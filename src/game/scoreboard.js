// Per-mode high-score board, persisted in localStorage and auto-cleared every
// week (Monday 00:00 local time). Keeps the top 20 scores per difficulty.

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

function save(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data))
  } catch {
    /* storage unavailable — ignore */
  }
}

// Load the board set, resetting it if we've rolled into a new week.
export function load() {
  const cur = weekStartTs()
  let data = null
  try {
    data = JSON.parse(localStorage.getItem(KEY))
  } catch {
    data = null
  }
  if (!data || data.weekStart !== cur || !data.boards) {
    data = { weekStart: cur, boards: emptyBoards() }
    save(data)
  }
  for (const m of MODES) if (!Array.isArray(data.boards[m])) data.boards[m] = []
  return data
}

export function getBoard(mode) {
  return load().boards[mode] || []
}

export function getAllBoards() {
  return load().boards
}

// Would `score` earn a place in the mode's top 20?
export function qualifies(mode, score) {
  if (!(score > 0)) return false
  const board = getBoard(mode)
  if (board.length < MAX) return true
  return score > board[board.length - 1].score
}

// Insert a score; returns the 0-based rank if it made the top 20, else -1.
export function addScore(mode, entry) {
  const data = load()
  const board = data.boards[mode] || []
  const row = {
    name: (entry.name || 'PLAYER').trim().slice(0, 12) || 'PLAYER',
    score: entry.score,
    hp: entry.hp,
    ts: entry.ts || Date.now(),
  }
  board.push(row)
  board.sort((a, b) => b.score - a.score || a.ts - b.ts) // higher score, then earlier
  data.boards[mode] = board.slice(0, MAX)
  save(data)
  return data.boards[mode].indexOf(row)
}
