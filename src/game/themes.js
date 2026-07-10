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
    hurt: 'wizard_hurt',
    die: 'wizard_die',
  },
  enemy: {
    idle: 'dragon_idle',
    attack: 'dragon_idle', // the dragon has no distinct attack pose
    hurt: 'dragon_hurt',
    die: 'dragon_die',
  },
  fx: { crit: 'blue', normal: 'fire', enemy: 'enemy' },
  sfx: { crit: 'blue', normal: 'fire', enemy: 'hurt' },
  music: 'greensleeves',
}

// Wuxia theme: a brush-wielding female warrior versus a panda.
// Critical = ink slash (สะบัดหมึก), normal = thrown book (ปาหนังสือ),
// and the panda answers back with a fart (ปล่อยตด).
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
    attack: 'panda_fart',
    hurt: 'panda_hurt',
    die: 'panda_die',
  },
  fx: { crit: 'ink', normal: 'book', enemy: 'fart' },
  sfx: { crit: 'ink', normal: 'book', enemy: 'fart' },
  music: 'molihua',
  projectile: 'book', // sprite thrown by the 'book' effect
}

// Kid theme: a knight girl versus a friendly dinosaur in candy land.
// Critical = sword slash (ฟันดาบ), normal = thrown lollipop (ปล่อยอมยิ้ม),
// and the dino answers back with a roar (คำราม).
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
    attack: 'dino_roar',
    hurt: 'dino_hurt',
    die: 'dino_die',
  },
  fx: { crit: 'slash', normal: 'candy', enemy: 'roar' },
  sfx: { crit: 'sword', normal: 'candy', enemy: 'roar' },
  music: 'kids',
  projectile: 'lollipop', // sprite thrown by the 'candy' effect
}

// High-school theme: an archer girl versus a winged hamster on an open meadow.
// Critical = three light arrows (ปล่อยธนูแสงสามดอก), normal = a fire arrow
// (ปล่อยธนูไฟ), and the hamster answers back with an electric aura (ปล่อยไฟฟ้ารอบตัว).
export const HS_THEME = {
  id: 'hs',
  heroName: 'Archer',
  enemyName: 'Hamster',
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
    idle: 'hamster_idle',
    attack: 'hamster_shock',
    hurt: 'hamster_hurt',
    die: 'hamster_die',
  },
  fx: { crit: 'arrows', normal: 'firearrow', enemy: 'shock' },
  sfx: { crit: 'arrow', normal: 'firearrow', enemy: 'shock' },
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

export function backgroundUrl(theme) {
  return `${BASE}${theme.background}`
}
