// Win / Lose end screen: score breakdown, HP bonus, and (when the total earns a
// top-20 spot) a name-entry form that saves the run to that mode's scoreboard.

import { useMemo, useState } from 'react'
import { DIFFICULTIES, HP_BONUS } from '../game/constants.js'
import { qualifies, submitScore } from '../game/scoreboard.js'
import { spriteUrl } from '../game/themes.js'

export default function ResultScreen({ info, theme, onPlayAgain, onViewScoreboard }) {
  const { result, exam, mode, baseScore, hp, bonus, total, ts } = info
  const win = result === 'WIN'
  const modeLabel = DIFFICULTIES[mode]?.label || mode

  const eligible = useMemo(() => qualifies(exam, mode, total), [exam, mode, total])
  const [name, setName] = useState('')
  const [savedRank, setSavedRank] = useState(-1)
  const [saving, setSaving] = useState(false)
  const saved = savedRank >= 0

  const handleSave = async () => {
    if (saving || saved) return
    setSaving(true)
    try {
      const rank = await submitScore(exam, mode, { name, score: total, hp, ts })
      setSavedRank(rank)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={`screen result ${win ? 'win' : 'lose'} theme-${theme.id}`}>
      <img
        className="result-sprite"
        src={spriteUrl(theme, win ? theme.hero.idle : theme.hero.die)}
        alt=""
      />
      <h1 className="result-title">{win ? 'YOU WIN!' : 'YOU LOST'}</h1>
      <p className="result-sub">
        {win ? `The ${theme.enemyName.toLowerCase()} is defeated — well done!` : "Don't give up — try again!"}
      </p>

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
          <div className="name-entry-title">🏆 New high score! Enter your name</div>
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
              disabled={saving}
            />
            <button className="pill-btn save-btn" onClick={handleSave} disabled={saving}>
              {saving ? 'SAVING…' : 'SAVE'}
            </button>
          </div>
        </div>
      )}

      {saved && (
        <div className="saved-note">
          🎉 Saved! You're ranked <span className="accent">#{savedRank + 1}</span> in {modeLabel} mode
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
