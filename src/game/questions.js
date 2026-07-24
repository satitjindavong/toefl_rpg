// Fetch and parse a vocabulary database (default.txt or any *.txt set) and build a shuffled pool.
//
// Format per line: vocab, choice1, choice2, choice3, choice4, correct_number
// Example:        abandon, ละทิ้ง, รุนแรง, รูปแบบ, แบบสหพันธรัฐ, 1

import config from './config.js'

// The default question set; used when no other set has been chosen.
// Edit it in config.js (defaultExam).
export const DEFAULT_EXAM = config.defaultExam

// A friendly display name for a question-set file, e.g. 'default.txt' ->
// 'Default', 'toefl_en_5k_words.txt' -> 'Toefl En 5k Words'.
export function examLabel(file) {
  const base = String(file || '').replace(/\.[^.]+$/, '') // strip extension
  if (!base || base.toLowerCase() === 'default') return 'Default'
  return base
    .replace(/[-_]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ')
}

// Fetch the list of available question-set files (any *.txt in public/),
// produced by the exam-manifest Vite plugin. Falls back to just the default.
export async function loadExamSets() {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}exam-sets.json`)
    if (!res.ok) throw new Error(String(res.status))
    const list = await res.json()
    if (Array.isArray(list) && list.length) return list
  } catch {
    /* manifest unavailable — fall through */
  }
  return [{ file: DEFAULT_EXAM, count: 0 }]
}

// Last-resort question set, used when the configured one is missing. Kept
// hardcoded (deliberately NOT in config.js): it is the safety net for a mistyped
// config.defaultExam, so it must not be breakable by that same typo. Keep this
// file present in public/.
export const FALLBACK_EXAM = 'default.txt'

// Fetch + parse one set. Returns the questions, or null if the file is missing
// or unusable — so the caller can decide whether to fall back.
async function tryLoad(file) {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}${file}`)
    if (!res.ok) return null
    const questions = parseQuestions(await res.text())
    // A static host may answer a missing path with index.html and HTTP 200,
    // which parses to zero questions — treat that as "not found" as well.
    return questions.length ? questions : null
  } catch {
    return null // network error / offline
  }
}

// Load the requested set, falling back to FALLBACK_EXAM when it can't be used.
// Returns { questions, file } where `file` is what actually loaded, so the caller
// can keep its own state (theme, scoreboard key) in sync after a fallback.
export async function loadQuestions(file = DEFAULT_EXAM) {
  const questions = await tryLoad(file)
  if (questions) return { questions, file }

  if (file !== FALLBACK_EXAM) {
    console.warn(
      `[questions] Exam set "${file}" is missing or empty — falling back to "${FALLBACK_EXAM}". ` +
        `Check config.defaultExam and that the file exists in public/.`
    )
    const fallback = await tryLoad(FALLBACK_EXAM)
    if (fallback) return { questions: fallback, file: FALLBACK_EXAM }
    throw new Error(`Cannot load "${file}", and the fallback "${FALLBACK_EXAM}" is missing too.`)
  }
  throw new Error(`Cannot load question set "${FALLBACK_EXAM}" — is it present in public/?`)
}

export function parseQuestions(raw) {
  return raw
    .replace(/^﻿/, '') // strip BOM
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(',').map((c) => c.trim()))
    .filter((parts) => parts.length >= 6)
    .map((parts) => {
      const word = parts[0]
      const options = parts.slice(1, 5)
      // The correct-answer column is 1-based in the file; store 0-based index.
      const answer = parseInt(parts[5], 10) - 1
      return { word, options, answer }
    })
    .filter(
      (q) =>
        q.word &&
        q.options.length === 4 &&
        Number.isInteger(q.answer) &&
        q.answer >= 0 &&
        q.answer < 4
    )
}

// Fisher-Yates shuffle -> a fresh randomized pool every session.
export function shuffle(arr) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
