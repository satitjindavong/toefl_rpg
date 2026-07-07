// The battle stage: forest background with the Wizard (left) and Dragon (right),
// their per-state sprites, and transient attack effects (blue beam / fireball).

const BASE = import.meta.env.BASE_URL

const WIZARD_SPRITES = {
  idle: 'wizard_idle',
  cast_blue: 'wizard_blue',
  cast_fire: 'wizard_fire',
  hurt: 'wizard_hurt',
  die: 'wizard_die',
}

const DRAGON_SPRITES = {
  idle: 'dragon_idle',
  hurt: 'dragon_hurt',
  die: 'dragon_die',
}

function spriteUrl(name) {
  return `${BASE}sprites/${name}.png`
}

export default function BattleArena({ wizardAnim, dragonAnim, effect, shake }) {
  const wizardSprite = WIZARD_SPRITES[wizardAnim] || WIZARD_SPRITES.idle
  const dragonSprite = DRAGON_SPRITES[dragonAnim] || DRAGON_SPRITES.idle

  return (
    <div
      className={`arena ${shake ? 'shake' : ''}`}
      style={{ backgroundImage: `url(${BASE}background.png)` }}
    >
      <div className="ground-shadow wizard-shadow" />
      <div className="ground-shadow dragon-shadow" />

      <img
        className={`fighter wizard anim-${wizardAnim}`}
        src={spriteUrl(wizardSprite)}
        alt="Wizard"
        draggable="false"
      />
      <img
        className={`fighter dragon anim-${dragonAnim}`}
        src={spriteUrl(dragonSprite)}
        alt="Dragon"
        draggable="false"
      />

      {/* Attack effects */}
      {effect === 'blue' && (
        <div className="fx-layer">
          <div className="beam blue" />
          <div className="impact blue" />
        </div>
      )}
      {effect === 'fire' && (
        <div className="fx-layer">
          <div className="fireball" />
          <div className="impact fire" />
        </div>
      )}
      {effect === 'enemy' && (
        <div className="fx-layer">
          <div className="enemy-fireball" />
          <div className="impact enemy" />
        </div>
      )}
    </div>
  )
}
