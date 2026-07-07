// Weekly scoreboard: one tab per difficulty, showing the top 20 runs with the
// player's name, score, when they played, and how much Wizard HP survived.

import { useState } from 'react'
import { DIFFICULTIES } from '../game/constants.js'
import { MODES, getAllBoards, nextResetTs } from '../game/scoreboard.js'

function fmtWhen(ts) {
  try {
    return new Date(ts).toLocaleString('th-TH', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '-'
  }
}

function fmtDate(ts) {
  try {
    return new Date(ts).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
  } catch {
    return '-'
  }
}

export default function ScoreboardScreen({ onBack }) {
  const [mode, setMode] = useState('EASY')
  const boards = getAllBoards()
  const rows = boards[mode] || []

  return (
    <div className="screen scoreboard">
      <h1 className="sb-heading">🏆 SCOREBOARD</h1>
      <p className="sb-reset th">ล้างคะแนนใหม่ทุกวันจันทร์ · รอบถัดไป {fmtDate(nextResetTs())}</p>

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
        {rows.length === 0 ? (
          <p className="sb-empty th">ยังไม่มีคะแนนในโหมดนี้ — มาเป็นคนแรกกันเถอะ!</p>
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
                  <td className="c-when th">{fmtWhen(r.ts)}</td>
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
