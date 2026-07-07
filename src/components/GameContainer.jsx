import { useEffect, useReducer, useRef } from 'react'
import StatusBar from './StatusBar.jsx'
import TimerBar from './TimerBar.jsx'
import BattleArena from './BattleArena.jsx'
import QuestionBoard from './QuestionBoard.jsx'
import SoundControls from './SoundControls.jsx'
import { audio } from '../audio/audioEngine.js'
import { shuffle } from '../game/questions.js'
import {
  WIZARD_MAX_HP,
  DMG_CRITICAL,
  DMG_NORMAL,
  DMG_TO_WIZARD,
  SPEED_BONUS_PER_SEC,
  TURN_DELAY,
  TICK_MS,
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
    wizardAnim: 'idle',
    dragonAnim: 'idle',
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
        wizardAnim: 'idle',
        dragonAnim: 'idle',
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
      wizardAnim: critical ? 'cast_blue' : 'cast_fire',
      dragonAnim: dragonHp <= 0 ? 'die' : 'hurt',
      effect: critical ? 'blue' : 'fire',
      score: state.score + points,
      combo,
    }
  }

  // Wrong answer or timeout -> Wizard takes a hit.
  const wizardHp = Math.max(0, state.wizardHp - DMG_TO_WIZARD)
  return {
    ...state,
    phase: 'resolving',
    selected: choice,
    isCorrect: false,
    wizardHp,
    wizardAnim: wizardHp <= 0 ? 'die' : 'hurt',
    dragonAnim: 'idle',
    effect: 'enemy',
    combo: 0,
  }
}

export default function GameContainer({ questions, config, sound, onSound, onEnd }) {
  const [state, dispatch] = useReducer(reducer, { questions, config }, init)
  const stateRef = useRef(state)
  stateRef.current = state

  const question = state.pool[state.index]

  // --- Countdown timer: only runs while awaiting an answer -----------------
  useEffect(() => {
    if (state.phase !== 'answering') return
    const id = setInterval(() => dispatch({ type: 'TICK', dt: TICK_MS / 1000 }), TICK_MS)
    return () => clearInterval(id)
  }, [state.phase, state.index])

  // --- Play SFX when a turn resolves ---------------------------------------
  useEffect(() => {
    if (state.phase !== 'resolving') return
    if (state.isCorrect) {
      if (state.effect === 'blue') audio.sfxBlue()
      else audio.sfxFire()
    } else {
      audio.sfxHurt()
    }
  }, [state.phase, state.index, state.isCorrect, state.effect])

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
    audio.sfxClick()
    dispatch({ type: 'ANSWER', choice })
  }

  const shake = state.phase === 'resolving' && !state.isCorrect

  return (
    <div className="game">
      <StatusBar
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
        wizardAnim={state.wizardAnim}
        dragonAnim={state.dragonAnim}
        effect={state.effect}
        shake={shake}
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
