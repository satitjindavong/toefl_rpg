import { useEffect, useRef, useState } from 'react'
import StartMenu from './components/StartMenu.jsx'
import GameContainer from './components/GameContainer.jsx'
import ResultScreen from './components/ResultScreen.jsx'
import { loadQuestions } from './game/questions.js'
import { DIFFICULTIES } from './game/constants.js'
import { audio } from './audio/audioEngine.js'

export default function App() {
  const [gameState, setGameState] = useState('START_MENU') // START_MENU | PLAYING | WIN | LOSE
  const [difficulty, setDifficulty] = useState(null)
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [finalScore, setFinalScore] = useState(0)
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
    setFinalScore(0)
    setGameId((n) => n + 1)
    setGameState('PLAYING')
  }

  const handleEnd = (result, score) => {
    setFinalScore(score)
    setGameState(result) // 'WIN' | 'LOSE'
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
          <StartMenu onStart={startGame} loading={loading} error={error} count={questions.length} />
        )}

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

        {(gameState === 'WIN' || gameState === 'LOSE') && (
          <ResultScreen result={gameState} score={finalScore} onPlayAgain={backToMenu} />
        )}
      </div>
    </div>
  )
}
