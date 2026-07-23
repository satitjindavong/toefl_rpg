// Global scoreboard: one tab per difficulty, showing the ranked runs with the
// player's name, score, when they played, and how much Wizard HP survived.

import { useEffect, useState } from 'react'
import { DIFFICULTIES } from '../game/constants.js'
import { examLabel } from '../game/questions.js'
import { MODES, getBoard } from '../game/scoreboard.js'
import { isGlobal } from '../game/supabase.js'

function fmtWhen(ts) {
  try {
    return new Date(ts).toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '-'
  }
}

export default function ScoreboardScreen({ exam, onBack }) {
  const [mode, setMode] = useState('EASY')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    getBoard(exam, mode).then((data) => {
      if (alive) {
        setRows(data)
        setLoading(false)
      }
    })
    return () => {
      alive = false
    }
  }, [exam, mode])

  return (
    <div className="screen scoreboard">
      <h1 className="sb-heading">🏆 SCOREBOARD</h1>
      <p className="sb-exam">Exam set: <strong>{examLabel(exam)}</strong></p>
      <p className="sb-reset">
        {isGlobal ? 'Global ranking — shared by all players' : 'Saved on this device only'}
      </p>

      <div className="sb-tabs">
        {MODES.map((m) => (
          <button
            key={m}
            className={`sb-tab ${m === mode ? 'active' : ''} tab-${m.toLowerCase()}`}
            onClick={() => setMode(m)}
          >
            {DIFFICULTIES[m]?.label || m}
          </button>
        ))}
      </div>

      <div className="sb-table-wrap">
        {loading ? (
          <p className="sb-empty">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="sb-empty">No scores yet in this mode — be the first!</p>
        ) : (
          <table className="sb-table">
            <thead>
              <tr>
                <th className="c-rank">#</th>
                <th className="c-name">NAME</th>
                <th className="c-score">SCORE</th>
                <th className="c-when">PLAYED</th>
                <th className="c-hp">HP</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className={i < 3 ? `top top-${i + 1}` : ''}>
                  <td className="c-rank">{i + 1}</td>
                  <td className="c-name">{r.name}</td>
                  <td className="c-score">{r.score.toLocaleString()}</td>
                  <td className="c-when">{fmtWhen(r.ts)}</td>
                  <td className="c-hp">{'♥'.repeat(Math.min(r.hp, 5)) || '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <button className="pill-btn ghost sb-back" onClick={onBack}>
        ← BACK
      </button>
    </div>
  )
}
