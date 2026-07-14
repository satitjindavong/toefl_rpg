import { useEffect, useReducer, useRef } from 'react'
import StatusBar from './StatusBar.jsx'
import TimerBar from './TimerBar.jsx'
import BattleArena from './BattleArena.jsx'
import QuestionBoard from './QuestionBoard.jsx'
import SoundControls from './SoundControls.jsx'
import { audio } from '../audio/audioEngine.js'
import { shuffle } from '../game/questions.js'
import { sfxName } from '../game/themes.js'
import {
  WIZARD_MAX_HP,
  DMG_CRITICAL,
  DMG_NORMAL,
  DMG_TO_WIZARD,
  SPEED_BONUS_PER_SEC,
  TURN_DELAY,
  TICK_MS,
  TICK_ENABLED,
  dangerThreshold,
} from '../game/constants.js'

function init({ questions, config }) {
  const pool = shuffle(questions)
  const wizardMax = config.wizardHp ?? WIZARD_MAX_HP
  return {
    pool,
    index: 0,
    wizardMax,
    wizardHp: wizardMax,
    dragonHp: config.dragonHp,
    timeLimit: config.timeLimit,
    timeLeft: config.timeLimit,
    phase: 'answering', // 'answering' | 'resolving'
    selected: null,
    isCorrect: null,
    heroAnim: 'idle',
    enemyAnim: 'idle',
    effect: null,
    score: 0,
    combo: 0,
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'TICK': {
      if (state.phase !== 'answering') return state
      const timeLeft = state.timeLeft - action.dt
      if (timeLeft <= 0) return resolve(state, { timeout: true })
      return { ...state, timeLeft }
    }
    case 'ANSWER': {
      if (state.phase !== 'answering') return state
      return resolve(state, { choice: action.choice })
    }
    case 'NEXT': {
      const nextIndex = (state.index + 1) % state.pool.length
      return {
        ...state,
        index: nextIndex,
        timeLeft: state.timeLimit,
        phase: 'answering',
        selected: null,
        isCorrect: null,
        heroAnim: 'idle',
        enemyAnim: 'idle',
        effect: null,
      }
    }
    default:
      return state
  }
}

// Evaluate an answer (or a timeout) and move into the resolving phase.
function resolve(state, { choice = null, timeout = false }) {
  const q = state.pool[state.index]
  const correct = !timeout && choice === q.answer

  if (correct) {
    // Critical if answered within the first half of this question's timer.
    const critical = state.timeLeft >= state.timeLimit / 2
    const dmg = critical ? DMG_CRITICAL : DMG_NORMAL
    const dragonHp = Math.max(0, state.dragonHp - dmg)
    const combo = state.combo + 1
    const speedBonus = Math.round(SPEED_BONUS_PER_SEC * Math.max(0, state.timeLeft))
    const points = (critical ? 100 : 50) * combo + speedBonus
    return {
      ...state,
      phase: 'resolving',
      selected: choice,
      isCorrect: true,
      dragonHp,
      heroAnim: critical ? 'cast_crit' : 'cast_normal',
      enemyAnim: dragonHp <= 0 ? 'die' : 'hurt',
      effect: critical ? 'crit' : 'normal',
      score: state.score + points,
      combo,
    }
  }

  // Wrong answer or timeout -> Wizard takes a hit. Timeouts get their own enemy
  // animation/effect so themes can answer back differently (e.g. the pig
  // body-slams a wrong answer but zaps a timeout); other themes fall back to the
  // single attack via the theme helpers.
  const wizardHp = Math.max(0, state.wizardHp - DMG_TO_WIZARD)
  return {
    ...state,
    phase: 'resolving',
    selected: choice,
    isCorrect: false,
    wizardHp,
    heroAnim: wizardHp <= 0 ? 'die' : 'hurt',
    enemyAnim: timeout ? 'attack_timeout' : 'attack',
    effect: timeout ? 'enemy_timeout' : 'enemy',
    combo: 0,
  }
}

export default function GameContainer({ questions, config, theme, sound, onSound, onEnd }) {
  const [state, dispatch] = useReducer(reducer, { questions, config }, init)
  const stateRef = useRef(state)
  stateRef.current = state

  const question = state.pool[state.index]

  // Closing seconds of the turn: pulses the battle scene and (optionally) ticks.
  // Only while an answer is still awaited, so it stops the moment a turn resolves.
  const danger =
    state.phase === 'answering' &&
    state.timeLeft > 0 &&
    state.timeLeft <= dangerThreshold(state.timeLimit)

  // --- Countdown timer: only runs while awaiting an answer -----------------
  useEffect(() => {
    if (state.phase !== 'answering') return
    const id = setInterval(() => dispatch({ type: 'TICK', dt: TICK_MS / 1000 }), TICK_MS)
    return () => clearInterval(id)
  }, [state.phase, state.index])

  // --- Soft tick on each remaining second of the danger window --------------
  // The timer ticks every 100 ms, so fire only when the whole-second count
  // changes (3 → 2 → 1). audio.sfx() already honours the 🔊 SFX toggle.
  const lastTickSec = useRef(null)
  useEffect(() => {
    if (!TICK_ENABLED || !danger) {
      lastTickSec.current = null
      return
    }
    const sec = Math.ceil(state.timeLeft)
    if (lastTickSec.current !== sec) {
      lastTickSec.current = sec
      audio.sfx('tick')
    }
  }, [danger, state.timeLeft])

  // --- Play SFX when a turn resolves ---------------------------------------
  useEffect(() => {
    if (state.phase !== 'resolving') return
    audio.sfx(sfxName(theme, state.effect))
  }, [state.phase, state.index, state.isCorrect, state.effect, theme])

  // --- After the animation delay: end the game or advance ------------------
  useEffect(() => {
    if (state.phase !== 'resolving') return
    const id = setTimeout(() => {
      const s = stateRef.current
      if (s.dragonHp <= 0) onEnd('WIN', s.score, s.wizardHp)
      else if (s.wizardHp <= 0) onEnd('LOSE', s.score, s.wizardHp)
      else dispatch({ type: 'NEXT' })
    }, TURN_DELAY)
    return () => clearTimeout(id)
  }, [state.phase, state.index, onEnd])

  const handleAnswer = (choice) => {
    if (state.phase !== 'answering') return
    audio.sfx('click')
    dispatch({ type: 'ANSWER', choice })
  }

  const shake = state.phase === 'resolving' && !state.isCorrect

  return (
    <div className="game">
      <StatusBar
        theme={theme}
        wizardHp={state.wizardHp}
        wizardMax={state.wizardMax}
        dragonHp={state.dragonHp}
        dragonMax={config.dragonHp}
      />

      <div className="timer-and-sound">
        <TimerBar timeLeft={state.timeLeft} timeLimit={state.timeLimit} />
        <SoundControls
          bgmOn={sound.bgm}
          sfxOn={sound.sfx}
          onToggleBgm={() => onSound('bgm')}
          onToggleSfx={() => onSound('sfx')}
        />
      </div>

      <BattleArena
        theme={theme}
        heroAnim={state.heroAnim}
        enemyAnim={state.enemyAnim}
        effect={state.effect}
        shake={shake}
        danger={danger}
      />

      <QuestionBoard
        question={question}
        index={state.index}
        total={state.pool.length}
        onAnswer={handleAnswer}
        locked={state.phase === 'resolving'}
        selected={state.selected}
        correctAnswer={question ? question.answer : null}
        score={state.score}
        combo={state.combo}
      />
    </div>
  )
}
