// The battle stage: the theme's backdrop with the hero (left) and enemy (right),
// their per-state sprites, and the transient attack effect for the current turn.
//
// `effect` is semantic ('crit' | 'normal' | 'enemy'); the active theme maps it to
// a concrete visual (blue beam / fireball / ink slash / thrown book / fart …).

import { spriteUrl, backgroundUrl, enemySpriteName, fxName } from '../game/themes.js'

export default function BattleArena({ theme, heroAnim, enemyAnim, effect, shake }) {
  const heroSprite = theme.hero[heroAnim] || theme.hero.idle
  const enemySprite = enemySpriteName(theme, enemyAnim)
  const fx = fxName(theme, effect)
  // Themes may fire a different projectile per attack (`projectiles`), or reuse
  // one sprite for every projectile effect (`projectile`).
  const projectile = (effect && theme.projectiles?.[effect]) || theme.projectile

  return (
    <div
      className={`arena theme-${theme.id} ${shake ? 'shake' : ''}`}
      style={{ backgroundImage: `url(${backgroundUrl(theme)})`, backgroundPosition: theme.bgPosition }}
    >
      <div className="ground-shadow hero-shadow" />
      <div className="ground-shadow enemy-shadow" />

      <img
        className={`fighter hero anim-${heroAnim}`}
        src={spriteUrl(theme, heroSprite)}
        alt="Hero"
        draggable="false"
      />
      <img
        className={`fighter enemy anim-${enemyAnim}`}
        src={spriteUrl(theme, enemySprite)}
        alt="Enemy"
        draggable="false"
      />

      {/* Attack effects */}
      {fx === 'blue' && (
        <div className="fx-layer">
          <div className="beam blue" />
          <div className="impact blue" />
        </div>
      )}
      {fx === 'fire' && (
        <div className="fx-layer">
          <div className="fireball" />
          <div className="impact fire" />
        </div>
      )}
      {fx === 'enemy' && (
        <div className="fx-layer">
          <div className="enemy-fireball" />
          <div className="impact enemy" />
        </div>
      )}
      {fx === 'flex' && (
        <div className="fx-layer">
          <div className="flex-shine" />
          <div className="flex-spark k1" />
          <div className="flex-spark k2" />
        </div>
      )}
      {fx === 'ink' && (
        <div className="fx-layer">
          <div className="ink-streak" />
          <div className="impact ink" />
        </div>
      )}
      {fx === 'book' && (
        <div className="fx-layer">
          <img className="proj-book" src={spriteUrl(theme, projectile)} alt="" draggable="false" />
          <div className="impact book" />
        </div>
      )}
      {fx === 'fart' && (
        <div className="fx-layer">
          <div className="fart-cloud" />
          <div className="impact fart" />
        </div>
      )}
      {fx === 'punch' && (
        <div className="fx-layer">
          <div className="punch-star s1" />
          <div className="punch-star s2" />
          <div className="punch-star s3" />
          <div className="impact punch" />
        </div>
      )}
      {fx === 'slash' && (
        <div className="fx-layer">
          <div className="slash-arc" />
          <div className="impact slash" />
        </div>
      )}
      {fx === 'candy' && (
        <div className="fx-layer">
          <img className="proj-candy" src={spriteUrl(theme, projectile)} alt="" draggable="false" />
          <div className="impact candy" />
        </div>
      )}
      {fx === 'roar' && (
        <div className="fx-layer">
          <div className="roar-wave" />
          <div className="roar-wave delay" />
          <div className="impact roar" />
        </div>
      )}
      {fx === 'arrows' && (
        <div className="fx-layer">
          <img className="proj-arrows" src={spriteUrl(theme, projectile)} alt="" draggable="false" />
          <div className="impact arrows" />
        </div>
      )}
      {fx === 'firearrow' && (
        <div className="fx-layer">
          <img className="proj-firearrow" src={spriteUrl(theme, projectile)} alt="" draggable="false" />
          <div className="impact firearrow" />
        </div>
      )}
      {fx === 'shock' && (
        <div className="fx-layer">
          <div className="shock-aura" />
          <div className="shock-bolt" />
          <div className="impact shock" />
        </div>
      )}
      {fx === 'slam' && (
        <div className="fx-layer">
          <div className="slam-line" />
          <div className="slam-ring" />
          <div className="impact slam" />
        </div>
      )}
    </div>
  )
}
