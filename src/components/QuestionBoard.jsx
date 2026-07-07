// The framed quiz box: question prompt (English vocab word) and four Thai-meaning
// answer buttons (A–D). Highlights the chosen/correct answers while resolving.

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
  if (!question) return null

  return (
    <div className="quiz">
      <div className="quiz-qnum">
        QUESTION {index + 1}
      </div>
      <div className="quiz-prompt">
        <span className="vocab">&ldquo;{question.word.toUpperCase()}&rdquo;</span>
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
