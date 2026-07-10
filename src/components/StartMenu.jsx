// Title screen with difficulty selection and the active question-set picker.

import { DIFFICULTIES } from '../game/constants.js'
import { examLabel } from '../game/questions.js'
import { spriteUrl } from '../game/themes.js'

export default function StartMenu({ onStart, onScoreboard, onOpenExam, activeExam, theme, loading, error, count }) {
  return (
    <div className={`screen start-menu theme-${theme.id}`}>
      <div className="title-block">
        <img className="menu-hero" src={spriteUrl(theme, theme.hero.idle)} alt="" />
        <h1 className="game-title">
          <span className="t1">MAGE</span>
          <span className="t2">SPELL BATTLE</span>
        </h1>
        <img className="menu-enemy" src={spriteUrl(theme, theme.enemy.idle)} alt="" />
      </div>

      <p className="subtitle">Defeat the {theme.enemyName.toLowerCase()} by mastering your vocabulary!</p>

      <button className="exam-pill" onClick={onOpenExam} title="Choose question set">
        <span className="exam-pill-ic">📚</span>
        <span className="exam-pill-text">
          Exam set: <strong>{examLabel(activeExam)}</strong>
          {!loading && !error && <span className="exam-pill-count"> · {count} words</span>}
        </span>
        <span className="exam-pill-chev">▾</span>
      </button>

      <div className="difficulty-list">
        {Object.values(DIFFICULTIES).map((d) => (
          <button
            key={d.key}
            className={`diff-btn diff-${d.key.toLowerCase()}`}
            onClick={() => onStart(d.key)}
            disabled={loading || !!error}
          >
            <span className="diff-label">{d.label}</span>
            <span className="diff-detail">
              {d.timeLimit}s / question · {theme.heroName} {d.wizardHp} HP · {theme.enemyName} {d.dragonHp} HP
            </span>
          </button>
        ))}
      </div>

      <button className="pill-btn ghost menu-scoreboard" onClick={onScoreboard}>
        🏆 SCOREBOARD
      </button>

      <div className="menu-status">
        {loading && <span>Loading vocabulary…</span>}
        {error && <span className="err">⚠ {error}</span>}
        {!loading && !error && <span>{count} words loaded · Answer in the first half of the timer for a Critical hit &amp; bonus score!</span>}
      </div>
    </div>
  )
}
