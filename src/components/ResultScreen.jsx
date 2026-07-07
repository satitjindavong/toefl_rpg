// Win / Lose end screen: score breakdown, HP bonus, and (when the total earns a
// top-20 spot) a name-entry form that saves the run to that mode's scoreboard.

import { useMemo, useState } from 'react'
import { DIFFICULTIES, HP_BONUS } from '../game/constants.js'
import { qualifies, addScore } from '../game/scoreboard.js'

export default function ResultScreen({ info, onPlayAgain, onViewScoreboard }) {
  const { result, mode, baseScore, hp, bonus, total, ts } = info
  const win = result === 'WIN'
  const modeLabel = DIFFICULTIES[mode]?.label || mode

  const eligible = useMemo(() => qualifies(mode, total), [mode, total])
  const [name, setName] = useState('')
  const [savedRank, setSavedRank] = useState(-1)
  const saved = savedRank >= 0

  const handleSave = () => {
    const rank = addScore(mode, { name, score: total, hp, ts })
    setSavedRank(rank)
  }

  return (
    <div className={`screen result ${win ? 'win' : 'lose'}`}>
      <img
        className="result-sprite"
        src={`${import.meta.env.BASE_URL}sprites/${win ? 'wizard_idle' : 'wizard_die'}.png`}
        alt=""
      />
      <h1 className="result-title">{win ? 'YOU WIN!' : 'YOU LOST'}</h1>
      <p className="result-sub th">{win ? 'มังกรพ่ายแพ้แล้ว! เก่งมาก!' : 'อย่ายอมแพ้ ลองอีกครั้ง!'}</p>

      <div className="score-breakdown">
        <div className="sb-line">
          <span>Question score</span>
          <span>{baseScore.toLocaleString()}</span>
        </div>
        <div className="sb-line">
          <span>HP bonus ({hp} × {HP_BONUS})</span>
          <span>+{bonus.toLocaleString()}</span>
        </div>
        <div className="sb-line total">
          <span>TOTAL</span>
          <span className="accent">{total.toLocaleString()}</span>
        </div>
        <div className="sb-mode">{modeLabel} mode</div>
      </div>

      {eligible && !saved && (
        <div className="name-entry">
          <div className="name-entry-title th">🏆 ทำคะแนนติดอันดับ! ใส่ชื่อของคุณ</div>
          <div className="name-entry-row">
            <input
              className="name-input"
              type="text"
              maxLength={12}
              value={name}
              autoFocus
              placeholder="YOUR NAME"
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
            <button className="pill-btn save-btn" onClick={handleSave}>
              SAVE
            </button>
          </div>
        </div>
      )}

      {saved && (
        <div className="saved-note th">
          🎉 บันทึกแล้ว! คุณอยู่อันดับ <span className="accent">#{savedRank + 1}</span> ของโหมด {modeLabel}
        </div>
      )}

      <div className="result-actions">
        <button className="pill-btn ghost" onClick={onViewScoreboard}>
          🏆 SCOREBOARD
        </button>
        <button className="pill-btn play-again" onClick={onPlayAgain}>
          ▶ PLAY AGAIN
        </button>
      </div>
    </div>
  )
}
