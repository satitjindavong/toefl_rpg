// Fetch and parse the vocabulary database (exam.txt) and build a shuffled pool.
//
// Format per line: vocab, choice1, choice2, choice3, choice4, correct_number
// Example:        abandon, ละทิ้ง, รุนแรง, รูปแบบ, แบบสหพันธรัฐ, 1

export async function loadQuestions() {
  const res = await fetch(`${import.meta.env.BASE_URL}exam.txt`)
  if (!res.ok) throw new Error(`Failed to load exam.txt (${res.status})`)
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
