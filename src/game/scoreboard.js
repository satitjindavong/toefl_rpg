// High-score boards, kept separately per question-set (exam file) and per
// difficulty. Persisted in localStorage (+ a cookie fallback) and auto-cleared
// every week (Monday 00:00 local time). Keeps the top 20 scores per board.

import { DEFAULT_EXAM } from './questions.js'

export const MODES = ['EASY', 'MEDIUM', 'HARD']
const KEY = 'toefl-vocab-scoreboard-v1'
const MAX = 20

// Timestamp (ms) of the most recent Monday 00:00 local time — the current
// "week bucket". When real time crosses into the next Monday this value
// changes, which triggers a reset on the next load().
export function weekStartTs(d = new Date()) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  const back = (x.getDay() + 6) % 7 // days since Monday (getDay: 0=Sun..6=Sat)
  x.setDate(x.getDate() - back)
  return x.getTime()
}

// The instant the board next resets (start of the coming Monday).
export function nextResetTs(d = new Date()) {
  return weekStartTs(d) + 7 * 24 * 60 * 60 * 1000
}

function emptyBoards() {
  return { EASY: [], MEDIUM: [], HARD: [] }
}

// --- Low-level storage --------------------------------------------------------
// We persist to BOTH localStorage and a long-lived cookie. Some mobile in-app
// browsers (e.g. LINE / Facebook WebViews) hand each visit a fresh, ephemeral
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
    document.cookie = `${KEY}=${encodeURIComponent(str)}; expires=${exp}; path=/; SameSite=Lax`
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
    const str = JSON.stringify({ weekStart: data.weekStart, sets: trimSets(data.sets, per) })
    if (str.length <= 3600 || per === 3) return str
  }
  return JSON.stringify({ weekStart: data.weekStart, sets: {} })
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
  if (!data.sets && data.boards) return { weekStart: data.weekStart, sets: { [DEFAULT_EXAM]: data.boards } }
  return data
}

function persist(data) {
  lsSet(JSON.stringify(data))
  cookieSet(cookiePayload(data))
}

// Load the record, recovering from whichever store survived and resetting only
// when we've genuinely rolled into a new week.
export function load() {
  const cur = weekStartTs()
  const fromLs = parseMaybe(lsGet())
  const fromCookie = parseMaybe(cookieGet())
  let data = fromLs || fromCookie
  if (fromLs && fromCookie && fromCookie.weekStart === fromLs.weekStart) {
    data = fromLs // same week: localStorage is the complete copy
  }
  data = migrate(data)

  if (!data || data.weekStart !== cur) {
    data = { weekStart: cur, sets: {} }
    persist(data)
  } else if (!fromLs && fromCookie) {
    // localStorage was wiped (ephemeral WebView) — rehydrate it from the cookie.
    persist(data)
  }

  if (!data.sets) data.sets = {}
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
  return boardsFor(load(), exam)
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
  const data = load()
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
