// Header health bars: Wizard (left) and Dragon (right), rendered as heart pips
// plus a numeric readout, styled like the wooden UI panels in the mock-up.

function Hearts({ hp, max, color }) {
  const pips = []
  for (let i = 0; i < max; i++) {
    pips.push(
      <span key={i} className={`pip ${i < hp ? 'full' : 'empty'}`} style={i < hp ? { color } : undefined}>
        ♥
      </span>
    )
  }
  return <div className="hearts">{pips}</div>
}

export default function StatusBar({ wizardHp, wizardMax, dragonHp, dragonMax }) {
  return (
    <div className="status-bar">
      <div className="hp-panel">
        <div className="hp-title">WIZARD HP:</div>
        <Hearts hp={wizardHp} max={wizardMax} color="#ff5c7a" />
        <div className="hp-num">({wizardHp})</div>
      </div>
      <div className="hp-panel">
        <div className="hp-title">DRAGON HP:</div>
        <Hearts hp={dragonHp} max={dragonMax} color="#ff5c7a" />
        <div className="hp-num">({dragonHp})</div>
      </div>
    </div>
  )
}
