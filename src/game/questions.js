// Fetch and parse a vocabulary database (default.txt or any *.txt set) and build a shuffled pool.
//
// Format per line: vocab, choice1, choice2, choice3, choice4, correct_number
// Example:        abandon, ละทิ้ง, รุนแรง, รูปแบบ, แบบสหพันธรัฐ, 1

// The default question set; used when no other set has been chosen.
export const DEFAULT_EXAM = 'default.txt'

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

export async function loadQuestions(file = DEFAULT_EXAM) {
  const res = await fetch(`${import.meta.env.BASE_URL}${file}`)
  if (!res.ok) throw new Error(`Failed to load ${file} (${res.status})`)
  const raw = await res.text()
  return parseQuestions(raw)
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
