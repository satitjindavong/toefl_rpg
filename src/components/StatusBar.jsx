// Compact single-line header HUD: Wizard HP as heart pips (small max, never
// wraps) on the left, Dragon HP as a mini bar + number on the right (a numeric
// readout keeps it tiny even when the Dragon has 30 HP).

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

export default function StatusBar({ theme, wizardHp, wizardMax, dragonHp, dragonMax }) {
  const pct = dragonMax > 0 ? Math.max(0, (dragonHp / dragonMax) * 100) : 0
  return (
    <div className="status-bar">
      <div className="hp-panel wiz">
        <span className="hp-title">{theme.heroName.toUpperCase()}</span>
        <Hearts hp={wizardHp} max={wizardMax} color="#ff5c7a" />
        <span className="hp-num">{wizardHp}</span>
      </div>
      <div className="hp-panel drg">
        <span className="hp-title">{theme.enemyName.toUpperCase()}</span>
        <div className="hp-bar">
          <div className="hp-bar-fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="hp-num">
          <span className="hp-cur">{dragonHp}</span>
          <span className="hp-max">/{dragonMax}</span>
        </span>
      </div>
    </div>
  )
}
