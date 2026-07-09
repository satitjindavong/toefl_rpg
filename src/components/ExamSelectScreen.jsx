// Question-set picker: lists every *.txt found in public/ with its word count,
// and lets the player switch which set the game loads from.

import { examLabel } from '../game/questions.js'

export default function ExamSelectScreen({ sets, activeExam, onChoose, onBack }) {
  const list = sets && sets.length ? sets : [{ file: activeExam, count: 0 }]

  return (
    <div className="screen exam-select">
      <h1 className="es-heading">📚 Exam Sets</h1>
      <p className="es-sub">Choose a word set to play</p>

      <div className="es-list">
        {list.map((s) => {
          const active = s.file === activeExam
          return (
            <button
              key={s.file}
              className={`es-item ${active ? 'active' : ''}`}
              onClick={() => onChoose(s.file)}
            >
              <span className="es-check">{active ? '✓' : ''}</span>
              <span className="es-info">
                <span className="es-label">{examLabel(s.file)}</span>
                <span className="es-file">{s.file}</span>
              </span>
              <span className="es-count">{s.count ? `${s.count.toLocaleString()} words` : ''}</span>
            </button>
          )
        })}
      </div>

      <button className="pill-btn ghost es-back" onClick={onBack}>
        ← BACK
      </button>
    </div>
  )
}
