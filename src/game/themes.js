// Visual/audio themes, selected by the active question-set file name.
//
// A theme swaps the battle backdrop, both fighters' sprites, the attack effects,
// the background music and the sound effects. Game rules are unaffected.
//
// To add a theme for future question sets: define a theme object below and add a
// rule to THEME_RULES (matched in order, first match wins).

const BASE = import.meta.env.BASE_URL

// Animation states a theme must provide sprites for:
//   hero : idle, cast_crit, cast_normal, hurt, die
//   enemy: idle, attack, hurt, die
// `fx` maps the semantic effect (crit / normal / enemy) to a visual effect name,
// and `sfx` maps it to a sound name (see audioEngine.sfx()).

// Default theme: a witch girl versus a dragon. Critical = blue beam, normal =
// fireball. The dragon answers back with two different actions: it breathes fire
// on a wrong answer (`enemy`) and flexes its muscles to show off when the timer
// runs out (`enemy_timeout`).
export const DEFAULT_THEME = {
  id: 'default',
  heroName: 'Wizard',
  enemyName: 'Dragon',
  background: 'background.png',
  bgPosition: 'center 28%',
  spriteDir: 'sprites',
  hero: {
    idle: 'wizard_idle',
    cast_crit: 'wizard_blue',
    cast_normal: 'wizard_fire',
    hurt: 'wizard_idle', // no hurt frame on this sheet; the CSS flash carries it
    die: 'wizard_die',
  },
  enemy: {
    idle: 'dragon_idle',
    attack: 'dragon_fire', // wrong answer: fire breath
    attack_timeout: 'dragon_flex', // timed out: muscle-flex show-off
    hurt: 'dragon_hurt',
    die: 'dragon_die',
  },
  fx: { crit: 'blue', normal: 'fire', enemy: 'enemy', enemy_timeout: 'flex' },
  sfx: { crit: 'blue', normal: 'fire', enemy: 'fire', enemy_timeout: 'flex' },
  music: 'greensleeves',
}

// Wuxia theme: a brush-wielding female warrior versus a panda.
// Critical = ink slash (สะบัดหมึก), normal = thrown book (ปาหนังสือ). The panda
// answers back with two different actions: a flurry of punches on a wrong answer
// (`enemy`) and a fart when the timer runs out (`enemy_timeout`).
export const CHINESE_THEME = {
  id: 'chinese',
  heroName: 'Warrior',
  enemyName: 'Panda',
  background: 'background_chinese.png',
  bgPosition: 'center bottom',
  spriteDir: 'sprites/chinese',
  hero: {
    idle: 'warrior_idle',
    cast_crit: 'warrior_ink',
    cast_normal: 'warrior_book',
    // The sword-girl sheet has no hurt/defeated frame: reuse idle and let the
    // CSS hurt-flash / die treatment carry those states.
    hurt: 'warrior_idle',
    die: 'warrior_idle',
  },
  enemy: {
    idle: 'panda_idle',
    attack: 'panda_punch', // wrong answer: flurry of punches
    attack_timeout: 'panda_fart', // timed out: fart
    hurt: 'panda_hurt',
    die: 'panda_die',
  },
  fx: { crit: 'ink', normal: 'book', enemy: 'punch', enemy_timeout: 'fart' },
  sfx: { crit: 'ink', normal: 'book', enemy: 'punch', enemy_timeout: 'fart' },
  music: 'molihua',
  projectile: 'book', // sprite thrown by the 'book' effect
}

// Kid theme: a knight girl versus a friendly dinosaur in candy land.
// Critical = sword slash (ฟันดาบ), normal = thrown lollipop (ปล่อยอมยิ้ม). The dino
// answers back with two different actions: a smelly fart on a wrong answer
// (`enemy`) and a loud roar when the timer runs out (`enemy_timeout`). Both the
// 'fart' and 'roar' fx/sfx already exist (shared with the wuxia panda and the
// dino's old attack).
export const KID_THEME = {
  id: 'kid',
  heroName: 'Knight',
  enemyName: 'Dino',
  background: 'background_kid.png',
  bgPosition: 'center bottom',
  spriteDir: 'sprites/kid',
  hero: {
    idle: 'knight_idle',
    cast_crit: 'knight_sword',
    cast_normal: 'knight_candy',
    // No hurt/defeated frame on this sheet: reuse idle and let the CSS
    // hurt-flash / die treatment carry those states.
    hurt: 'knight_idle',
    die: 'knight_idle',
  },
  enemy: {
    idle: 'dino_idle',
    attack: 'dino_fart', // wrong answer: fart
    attack_timeout: 'dino_roar', // timed out: roar
    hurt: 'dino_hurt',
    die: 'dino_die',
  },
  fx: { crit: 'slash', normal: 'candy', enemy: 'fart', enemy_timeout: 'roar' },
  sfx: { crit: 'sword', normal: 'candy', enemy: 'fart', enemy_timeout: 'roar' },
  music: 'kids',
  projectile: 'lollipop', // sprite thrown by the 'candy' effect
}

// High-school theme: an archer girl versus a sunglasses-wearing pig on an open
// meadow. Critical = three light arrows (ปล่อยธนูแสงสามดอก), normal = a fire arrow
// (ปล่อยธนูไฟ). The pig answers back with two *different* actions depending on how
// the player missed: a wrestling body-slam on a wrong answer (`enemy`) and an
// electric aura when the timer runs out (`enemy_timeout`). See enemyStateFor()
// and the fx/sfx helpers for how the timeout variant falls back for other themes.
export const HS_THEME = {
  id: 'hs',
  heroName: 'Archer',
  enemyName: 'Pig',
  background: 'background_hs.png',
  bgPosition: 'center bottom',
  spriteDir: 'sprites/hs',
  hero: {
    idle: 'archer_idle',
    cast_crit: 'archer_light',
    cast_normal: 'archer_fire',
    hurt: 'archer_idle', // no hurt frame; the CSS flash carries it
    die: 'archer_die',
  },
  enemy: {
    idle: 'pig_idle',
    attack: 'pig_slam', // wrong answer: body-slam
    attack_timeout: 'pig_shock', // timed out: electric aura
    hurt: 'pig_hurt',
    die: 'pig_die',
  },
  fx: { crit: 'arrows', normal: 'firearrow', enemy: 'slam', enemy_timeout: 'shock' },
  sfx: { crit: 'arrow', normal: 'firearrow', enemy: 'slam', enemy_timeout: 'shock' },
  music: 'adventure',
  // This theme fires a different projectile per attack, so it uses the
  // per-effect `projectiles` map instead of the single `projectile`.
  projectiles: { crit: 'arrows_light', normal: 'arrow_fire' },
}

// First match wins; add new prefixes here as more themed sets arrive.
const THEME_RULES = [
  { prefix: 'chinese', theme: CHINESE_THEME },
  { prefix: 'english_for_kid', theme: KID_THEME },
  { prefix: 'english_highschool', theme: HS_THEME },
]

export function themeForExam(file) {
  const name = String(file || '').toLowerCase()
  const hit = THEME_RULES.find((r) => name.startsWith(r.prefix))
  return hit ? hit.theme : DEFAULT_THEME
}

export function spriteUrl(theme, name) {
  return `${BASE}${theme.spriteDir}/${name}.png`
}

// The game can distinguish a wrong answer (enemyAnim 'attack', effect 'enemy')
// from a timeout (enemyAnim 'attack_timeout', effect 'enemy_timeout'). Only
// themes that define the timeout variants react differently; everyone else
// falls back to the single attack pose / effect / sound below.

export function enemySpriteName(theme, animKey) {
  if (theme.enemy[animKey]) return theme.enemy[animKey]
  if (animKey === 'attack_timeout') return theme.enemy.attack || theme.enemy.idle
  return theme.enemy.idle
}

export function fxName(theme, effect) {
  if (!effect) return null
  return theme.fx[effect] || (effect === 'enemy_timeout' ? theme.fx.enemy : null)
}

export function sfxName(theme, effect) {
  if (!effect) return null
  return theme.sfx[effect] || (effect === 'enemy_timeout' ? theme.sfx.enemy : null)
}

export function backgroundUrl(theme) {
  return `${BASE}${theme.background}`
}
