// Countdown bar with a smooth blue fill and an MM:SS-style numeric readout.

function fmt(t) {
  const clamped = Math.max(0, t)
  const secs = Math.floor(clamped)
  const cs = Math.floor((clamped - secs) * 100)
  const p = (n) => String(n).padStart(2, '0')
  return `${p(secs)}:${p(cs)}`
}

export default function TimerBar({ timeLeft, timeLimit }) {
  const pct = Math.max(0, Math.min(100, (timeLeft / timeLimit) * 100))
  const low = timeLeft <= timeLimit * 0.33
  return (
    <div className="timer-wrap">
      <div className="timer-label">TIME: {fmt(timeLeft)} SECS</div>
      <div className="timer-track">
        <div className={`timer-fill ${low ? 'low' : ''}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
