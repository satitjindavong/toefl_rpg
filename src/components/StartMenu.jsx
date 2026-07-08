// Title screen with difficulty selection and the active question-set picker.

import { DIFFICULTIES } from '../game/constants.js'
import { examLabel } from '../game/questions.js'

const DETAILS = {
  EASY: '15s / question · Wizard 5 HP · Dragon 10 HP',
  MEDIUM: '8s / question · Wizard 4 HP · Dragon 20 HP',
  HARD: '4s / question · Wizard 3 HP · Dragon 30 HP',
}

export default function StartMenu({ onStart, onScoreboard, onOpenExam, activeExam, loading, error, count }) {
  return (
    <div className="screen start-menu">
      <div className="title-block">
        <img className="menu-wizard" src={`${import.meta.env.BASE_URL}sprites/wizard_idle.png`} alt="" />
        <h1 className="game-title">
          <span className="t1">TOEFL</span>
          <span className="t2">VOCAB BATTLE</span>
        </h1>
        <img className="menu-dragon" src={`${import.meta.env.BASE_URL}sprites/dragon_idle.png`} alt="" />
      </div>

      <p className="subtitle">Defeat the dragon by mastering English vocabulary!</p>

      <button className="exam-pill" onClick={onOpenExam} title="Choose question set">
        <span className="exam-pill-ic">📚</span>
        <span className="exam-pill-text">
          ชุดข้อสอบ: <strong>{examLabel(activeExam)}</strong>
          {!loading && !error && <span className="exam-pill-count"> · {count} คำ</span>}
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
            <span className="diff-detail">{DETAILS[d.key]}</span>
          </button>
        ))}
      </div>

      <button className="pill-btn ghost menu-scoreboard" onClick={onScoreboard}>
        🏆 SCOREBOARD
      </button>

      <div className="menu-status">
        {loading && <span>Loading vocabulary…</span>}
        {error && <span className="err">⚠ {error}</span>}
        {!loading && !error && <span>{count} words loaded · Answer in the first half of the timer for a Critical beam &amp; bonus score!</span>}
      </div>
    </div>
  )
}
