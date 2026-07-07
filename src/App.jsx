import { useEffect, useRef, useState } from 'react'
import StartMenu from './components/StartMenu.jsx'
import GameContainer from './components/GameContainer.jsx'
import ResultScreen from './components/ResultScreen.jsx'
import ScoreboardScreen from './components/ScoreboardScreen.jsx'
import { loadQuestions } from './game/questions.js'
import { DIFFICULTIES, HP_BONUS } from './game/constants.js'
import { audio } from './audio/audioEngine.js'

export default function App() {
  const [gameState, setGameState] = useState('START_MENU') // START_MENU | PLAYING | WIN | LOSE | SCOREBOARD
  const [difficulty, setDifficulty] = useState(null)
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [endInfo, setEndInfo] = useState(null)
  const [gameId, setGameId] = useState(0)
  const [sound, setSound] = useState({ bgm: false, sfx: true })
  const soundRef = useRef(sound)
  soundRef.current = sound

  // Load and parse the vocabulary database once on startup.
  useEffect(() => {
    loadQuestions()
      .then((q) => {
        if (q.length === 0) throw new Error('No questions found in exam.txt')
        setQuestions(q)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

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
            loading={loading}
            error={error}
            count={questions.length}
          />
        )}

        {gameState === 'SCOREBOARD' && <ScoreboardScreen onBack={backToMenu} />}

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
