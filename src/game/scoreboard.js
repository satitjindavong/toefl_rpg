// High-score boards, kept per question-set (exam file) and per difficulty.
// Persisted in the browser (localStorage + a cookie fallback) so scores survive
// closing the tab/browser. Per device — there is no server, and scores are not
// shared between players or auto-cleared. Keeps the top 20 scores per board.

import { DEFAULT_EXAM } from './questions.js'

export const MODES = ['EASY', 'MEDIUM', 'HARD']
const KEY = 'mage-spell-scoreboard'
const MAX = 20

function emptyBoards() {
  return { EASY: [], MEDIUM: [], HARD: [] }
}

// --- Low-level storage --------------------------------------------------------
// Persist to BOTH localStorage and a long-lived cookie. Some mobile in-app
// browsers (LINE / Facebook WebViews) hand each visit a fresh, ephemeral
// localStorage but keep cookies, so the cookie acts as a durable fallback.

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
    // Secure only on HTTPS — a `Secure` cookie is dropped outright over plain
    // http://localhost, which would break the fallback in local dev.
    const secure = location.protocol === 'https:' ? '; Secure' : ''
    document.cookie = `${KEY}=${encodeURIComponent(str)}; expires=${exp}; path=/; SameSite=Lax${secure}`
  } catch {
    /* cookies unavailable — ignore */
  }
}

// Cookies cap around ~4KB. Mirror every set/mode but keep only the top few rows,
// shrinking further if we're still over budget (localStorage holds the full 20).
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

// Upgrade a pre-multi-set record ({ boards }) to the per-exam shape ({ sets }).
function migrate(data) {
  if (!data) return data
  if (!data.sets && data.boards) return { sets: { [DEFAULT_EXAM]: data.boards } }
  return data
}

function persist(data) {
  lsSet(JSON.stringify(data))
  cookieSet(cookiePayload(data))
}

// Read the record, recovering from whichever store survived.
function read() {
  const fromLs = parseMaybe(lsGet())
  const fromCookie = parseMaybe(cookieGet())
  let data = migrate(fromLs || fromCookie)
  if (!data || !data.sets) {
    data = { sets: {} }
  } else if (!fromLs && fromCookie) {
    // localStorage was wiped (ephemeral WebView) — rehydrate it from the cookie.
    persist(data)
  }
  return data
}

// Return (creating if needed) the { EASY, MEDIUM, HARD } boards for one exam set.
function boardsFor(data, exam) {
  const key = exam || DEFAULT_EXAM
  if (!data.sets[key]) data.sets[key] = emptyBoards()
  const boards = data.sets[key]
  for (const m of MODES) if (!Array.isArray(boards[m])) boards[m] = []
  return boards
}

export function getAllBoards(exam) {
  return boardsFor(read(), exam)
}

export function getBoard(exam, mode) {
  return getAllBoards(exam)[mode] || []
}

// Would `score` earn a place in this set+mode's top 20?
export function qualifies(exam, mode, score) {
  if (!(score > 0)) return false
  const board = getBoard(exam, mode)
  if (board.length < MAX) return true
  return score > board[board.length - 1].score
}

// Insert a score; returns the 0-based rank if it made the top 20, else -1.
export function addScore(exam, mode, entry) {
  const data = read()
  const boards = boardsFor(data, exam)
  const board = boards[mode]
  const row = {
    name: (entry.name || 'PLAYER').trim().slice(0, 12) || 'PLAYER',
    score: entry.score,
    hp: entry.hp,
    ts: entry.ts || Date.now(),
  }
  board.push(row)
  board.sort((a, b) => b.score - a.score || a.ts - b.ts) // higher score, then earlier
  boards[mode] = board.slice(0, MAX)
  persist(data)
  return boards[mode].indexOf(row)
}
