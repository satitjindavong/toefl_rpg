// Win / Lose end screen with score and a play-again action.

export default function ResultScreen({ result, score, onPlayAgain }) {
  const win = result === 'WIN'
  return (
    <div className={`screen result ${win ? 'win' : 'lose'}`}>
      <img
        className="result-sprite"
        src={`${import.meta.env.BASE_URL}sprites/${win ? 'wizard_idle' : 'wizard_die'}.png`}
        alt=""
      />
      <h1 className="result-title">{win ? 'YOU WIN!' : 'YOU LOST'}</h1>
      <p className="result-sub th">{win ? 'มังกรพ่ายแพ้แล้ว! เก่งมาก!' : 'อย่ายอมแพ้ ลองอีกครั้ง!'}</p>
      <div className="result-score">
        SCORE: <span className="accent">{score}</span>
      </div>
      <button className="play-again" onClick={onPlayAgain}>
        ▶ PLAY AGAIN
      </button>
    </div>
  )
}
