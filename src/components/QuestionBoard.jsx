// The framed quiz box: question prompt (English vocab word) and four Thai-meaning
// answer buttons (A–D). Highlights the chosen/correct answers while resolving.

import { useEffect, useState } from 'react'
import { speech } from '../audio/speech.js'

const LETTERS = ['A', 'B', 'C', 'D']

export default function QuestionBoard({
  question,
  index,
  total,
  onAnswer,
  locked,
  selected,
  correctAnswer,
  score,
  combo,
}) {
  // Re-render when device voices finish loading (async on iOS/Android), so the
  // pronounce button can appear once a matching voice is available.
  const [, refreshVoices] = useState(0)
  useEffect(() => speech.subscribe(() => refreshVoices((n) => n + 1)), [])
  // Stop any pronunciation when the board unmounts (game ends).
  useEffect(() => () => speech.stop(), [])

  if (!question) return null

  // Only show the speaker when this device can actually pronounce this word's
  // language — otherwise it's simply hidden (no error, no mispronunciation).
  const canSpeak = speech.canSpeak(question.word)

  return (
    <div className="quiz">
      <div className="quiz-qnum">
        QUESTION {index + 1}
      </div>
      <div className="quiz-prompt">
        <span className="vocab-row">
          <span className="vocab">&ldquo;{question.word.toUpperCase()}&rdquo;</span>
          {canSpeak && (
            <button
              type="button"
              className="speak-btn"
              onClick={(e) => { e.stopPropagation(); speech.speak(question.word) }}
              aria-label="Pronounce the word"
              title="Pronounce"
            >
              <svg className="speak-ic" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  className="speak-body"
                  d="M3.6 10.6a2 2 0 0 1 2-2h2.1l3.6-2.9a1.3 1.3 0 0 1 2.2 1v10.6a1.3 1.3 0 0 1-2.2 1l-3.6-2.9H5.6a2 2 0 0 1-2-2z"
                />
                <path className="speak-wave" d="M16.8 9.6a3.4 3.4 0 0 1 0 4.8" />
                <path className="speak-wave" d="M19.2 7.4a6.4 6.4 0 0 1 0 9.2" />
              </svg>
            </button>
          )}
        </span>
      </div>

      <div className="options">
        {question.options.map((opt, i) => {
          let cls = 'option'
          if (locked) {
            if (i === correctAnswer) cls += ' correct'
            else if (i === selected) cls += ' wrong'
            else cls += ' dim'
          }
          return (
            <button
              key={i}
              className={cls}
              disabled={locked}
              onClick={() => onAnswer(i)}
            >
              <span className="opt-letter">{LETTERS[i]}.</span>
              <span className="opt-text th">{opt}</span>
            </button>
          )
        })}
      </div>

      <div className="score-row">
        <div>
          SCORE: <span className="accent">{score}</span>
        </div>
        <div>
          COMBO: <span className="accent">×{combo}</span>
        </div>
      </div>
    </div>
  )
}
