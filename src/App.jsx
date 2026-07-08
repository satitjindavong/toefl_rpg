import { useEffect, useRef, useState } from 'react'
import StartMenu from './components/StartMenu.jsx'
import GameContainer from './components/GameContainer.jsx'
import ResultScreen from './components/ResultScreen.jsx'
import ScoreboardScreen from './components/ScoreboardScreen.jsx'
import ExamSelectScreen from './components/ExamSelectScreen.jsx'
import { loadQuestions, loadExamSets, DEFAULT_EXAM } from './game/questions.js'
import { DIFFICULTIES, HP_BONUS } from './game/constants.js'
import { audio } from './audio/audioEngine.js'

export default function App() {
  const [gameState, setGameState] = useState('START_MENU') // START_MENU | PLAYING | WIN | LOSE | SCOREBOARD | EXAM_SELECT
  const [difficulty, setDifficulty] = useState(null)
  const [examSets, setExamSets] = useState([])
  const [activeExam, setActiveExam] = useState(DEFAULT_EXAM)
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [endInfo, setEndInfo] = useState(null)
  const [gameId, setGameId] = useState(0)
  const [sound, setSound] = useState({ bgm: false, sfx: true })
  const soundRef = useRef(sound)
  soundRef.current = sound

  // Discover the available question-set files once on startup.
  useEffect(() => {
    loadExamSets().then(setExamSets)
  }, [])

  // Load and parse the active vocabulary database (re-runs when the set changes).
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    loadQuestions(activeExam)
      .then((q) => {
        if (cancelled) return
        if (q.length === 0) throw new Error(`No questions found in ${activeExam}`)
        setQuestions(q)
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [activeExam])

  // Drive background music from the game state.
  useEffect(() => {
    if (gameState === 'PLAYING') audio.playMainBgm()
    else if (gameState === 'WIN') audio.playWinBgm()
    else if (gameState === 'LOSE') audio.playLoseBgm()
    else audio.stopBgm()
    return () => {}
  }, [gameState])

  const startGame = (diffKey) => {
    audio.unlock()
    audio.setBgm(soundRef.current.bgm)
    audio.setSfx(soundRef.current.sfx)
    setDifficulty(DIFFICULTIES[diffKey])
    setEndInfo(null)
    setGameId((n) => n + 1)
    setGameState('PLAYING')
  }

  const handleEnd = (result, score, hp) => {
    const bonus = hp * HP_BONUS
    setEndInfo({
      result,
      exam: activeExam,
      mode: difficulty.key,
      baseScore: score,
      hp,
      bonus,
      total: score + bonus,
      ts: Date.now(),
    })
    setGameState(result) // 'WIN' | 'LOSE'
  }

  const openScoreboard = () => setGameState('SCOREBOARD')
  const openExamSelect = () => setGameState('EXAM_SELECT')

  const chooseExam = (file) => {
    if (file !== activeExam) setActiveExam(file)
    setGameState('START_MENU')
  }

  const toggleSound = (kind) => {
    setSound((prev) => {
      const next = { ...prev, [kind]: !prev[kind] }
      if (kind === 'bgm') audio.setBgm(next.bgm)
      else audio.setSfx(next.sfx)
      return next
    })
  }

  const backToMenu = () => setGameState('START_MENU')

  return (
    <div className="app-shell">
      <div className="app-frame">
        {gameState === 'START_MENU' && (
          <StartMenu
            onStart={startGame}
            onScoreboard={openScoreboard}
            onOpenExam={openExamSelect}
            activeExam={activeExam}
            loading={loading}
            error={error}
            count={questions.length}
          />
        )}

        {gameState === 'EXAM_SELECT' && (
          <ExamSelectScreen
            sets={examSets}
            activeExam={activeExam}
            onChoose={chooseExam}
            onBack={backToMenu}
          />
        )}

        {gameState === 'SCOREBOARD' && <ScoreboardScreen exam={activeExam} onBack={backToMenu} />}

        {gameState === 'PLAYING' && difficulty && (
          <GameContainer
            key={`${difficulty.key}-${gameId}`}
            questions={questions}
            config={difficulty}
            sound={sound}
            onSound={toggleSound}
            onEnd={handleEnd}
          />
        )}

        {(gameState === 'WIN' || gameState === 'LOSE') && endInfo && (
          <ResultScreen
            info={endInfo}
            onPlayAgain={backToMenu}
            onViewScoreboard={openScoreboard}
          />
        )}
      </div>
    </div>
  )
}
