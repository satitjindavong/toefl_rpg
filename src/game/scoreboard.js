// High-score boards, kept per question-set (exam file) and per difficulty.
//
// Primary store is a GLOBAL Supabase table shared by all players, with unlimited
// ranking (no top-N cap). If Supabase isn't configured (no .env) or a request
// fails, we transparently fall back to a per-device localStorage board so the
// game keeps working offline / in local dev.

import { DEFAULT_EXAM } from './questions.js'
import { supabase } from './supabase.js'
import config from './config.js'

export const MODES = ['EASY', 'MEDIUM', 'HARD']

// Scoreboard reset window (config.scoreboard.resetPeriod). Rather than deleting
// old rows, we only *show* runs newer than the current period's start, so the
// board appears to reset while the full history stays in the database.
//   'never'   -> null (show everything, all time)
//   'monthly' -> first instant of the current month, in the viewer's local time
// Returns a JS timestamp (ms) or null for "no cutoff".
function periodStartMs() {
  if (config.scoreboard?.resetPeriod === 'monthly') {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  }
  return null
}

// Name of the Supabase table (must match the SQL you ran in the dashboard).
const TABLE = 'scores'

// How many rows to pull for on-screen display. Ranking is unlimited — even a run
// ranked beyond this still gets an exact rank number on the result screen (we
// count rather than fetch). This only bounds how big the visible list can get.
const DISPLAY_LIMIT = 200

// Any positive score is worth recording now that the board is unlimited.
export function qualifies(exam, mode, score) {
  return score > 0
}

function normalizeName(name) {
  return (name || 'PLAYER').trim().slice(0, 12) || 'PLAYER'
}

// --- Public API (async) -------------------------------------------------------

// Returns the rows for one exam+mode, best first. Never throws — on any failure
// it returns whatever the local fallback has.
export async function getBoard(exam, mode) {
  const key = exam || DEFAULT_EXAM
  if (supabase) {
    try {
      const since = periodStartMs()
      let query = supabase
        .from(TABLE)
        .select('name, score, hp, created_at')
        .eq('exam', key)
        .eq('mode', mode)
      if (since != null) query = query.gte('created_at', new Date(since).toISOString())
      const { data, error } = await query
        .order('score', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(DISPLAY_LIMIT)
      if (error) throw error
      // Map to the shape the UI expects ({ name, score, hp, ts }).
      return (data || []).map((r) => ({
        name: r.name,
        score: r.score,
        hp: r.hp,
        ts: new Date(r.created_at).getTime(),
      }))
    } catch (e) {
      console.warn('[scoreboard] falling back to local board:', e?.message || e)
    }
  }
  return localGetBoard(key, mode)
}

// Inserts a run and returns its 0-based global rank (0 = 1st place), or -1 if the
// score wasn't worth saving. Falls back to the local board on any Supabase error.
export async function submitScore(exam, mode, entry) {
  const key = exam || DEFAULT_EXAM
  if (!(entry.score > 0)) return -1
  const row = {
    exam: key,
    mode,
    name: normalizeName(entry.name),
    score: entry.score,
    hp: entry.hp,
  }

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from(TABLE)
        .insert(row)
        .select('created_at')
        .single()
      if (error) throw error
      return await rankOf(key, mode, entry.score, data.created_at)
    } catch (e) {
      console.warn('[scoreboard] save to Supabase failed, saving locally:', e?.message || e)
    }
  }
  return localAddScore(key, mode, row)
}

// Exact 0-based rank of a run: everyone strictly better, plus tied runs that were
// recorded earlier. Works even when the run is past DISPLAY_LIMIT.
async function rankOf(exam, mode, score, createdAt) {
  const since = periodStartMs()
  const base = () => {
    let q = supabase.from(TABLE).select('*', { count: 'exact', head: true }).eq('exam', exam).eq('mode', mode)
    if (since != null) q = q.gte('created_at', new Date(since).toISOString())
    return q
  }
  const [{ count: higher = 0 }, { count: tiedEarlier = 0 }] = await Promise.all([
    base().gt('score', score),
    base().eq('score', score).lt('created_at', createdAt),
  ])
  return higher + tiedEarlier
}

// =============================================================================
// Local fallback (per-device) — a trimmed version of the original localStorage +
// cookie board. Used only when Supabase is unavailable.
// =============================================================================

const KEY = 'mage-spell-scoreboard'
const LOCAL_MAX = 50

function emptyBoards() {
  return { EASY: [], MEDIUM: [], HARD: [] }
}

function lsGet() {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

function lsSet(str) {
  try {
    localStorage.setItem(KEY, str)
  } catch {
    /* unavailable — rely on the cookie */
  }
}

function cookieGet() {
  try {
    const m = document.cookie.match(new RegExp('(?:^|; )' + KEY + '=([^;]*)'))
    return m ? decodeURIComponent(m[1]) : null
  } catch {
    return null
  }
}

function cookieSet(str) {
  try {
    const exp = new Date(Date.now() + 400 * 24 * 60 * 60 * 1000).toUTCString()
    const secure = location.protocol === 'https:' ? '; Secure' : ''
    document.cookie = `${KEY}=${encodeURIComponent(str)}; expires=${exp}; path=/; SameSite=Lax${secure}`
  } catch {
    /* cookies unavailable — ignore */
  }
}

function trimSets(sets, perMode) {
  const out = {}
  for (const [exam, boards] of Object.entries(sets || {})) {
    out[exam] = {}
    for (const m of MODES) out[exam][m] = (boards[m] || []).slice(0, perMode)
  }
  return out
}

function cookiePayload(data) {
  for (let per = 10; per >= 3; per--) {
    const str = JSON.stringify({ sets: trimSets(data.sets, per) })
    if (str.length <= 3600 || per === 3) return str
  }
  return JSON.stringify({ sets: {} })
}

function parseMaybe(str) {
  try {
    const d = JSON.parse(str)
    return d && (d.sets || d.boards) ? d : null
  } catch {
    return null
  }
}

function migrate(data) {
  if (!data) return data
  if (!data.sets && data.boards) return { sets: { [DEFAULT_EXAM]: data.boards } }
  return data
}

function persist(data) {
  lsSet(JSON.stringify(data))
  cookieSet(cookiePayload(data))
}

function read() {
  const fromLs = parseMaybe(lsGet())
  const fromCookie = parseMaybe(cookieGet())
  let data = migrate(fromLs || fromCookie)
  if (!data || !data.sets) {
    data = { sets: {} }
  } else if (!fromLs && fromCookie) {
    persist(data)
  }
  return data
}

function boardsFor(data, exam) {
  const key = exam || DEFAULT_EXAM
  if (!data.sets[key]) data.sets[key] = emptyBoards()
  const boards = data.sets[key]
  for (const m of MODES) if (!Array.isArray(boards[m])) boards[m] = []
  return boards
}

// Rows still inside the active reset window (mirrors the Supabase filter).
function inPeriod(rows) {
  const since = periodStartMs()
  return since == null ? rows : rows.filter((r) => r.ts >= since)
}

function localGetBoard(exam, mode) {
  return inPeriod(boardsFor(read(), exam)[mode] || [])
}

function localAddScore(exam, mode, entry) {
  const data = read()
  const boards = boardsFor(data, exam)
  const board = boards[mode]
  const row = { name: entry.name, score: entry.score, hp: entry.hp, ts: Date.now() }
  board.push(row)
  board.sort((a, b) => b.score - a.score || a.ts - b.ts)
  // Keep full history (bounded) so an older month's rows aren't lost mid-month...
  boards[mode] = board.slice(0, LOCAL_MAX)
  persist(data)
  // ...but rank only against the current period, matching the global board.
  return inPeriod(boards[mode]).indexOf(row)
}
