// Difficulty configuration per the game specification.
export const DIFFICULTIES = {
  EASY: { key: 'EASY', label: 'EASY', timeLimit: 15, dragonHp: 10, wizardHp: 5 },
  MEDIUM: { key: 'MEDIUM', label: 'MEDIUM', timeLimit: 8, dragonHp: 20, wizardHp: 4 },
  HARD: { key: 'HARD', label: 'HARD', timeLimit: 4, dragonHp: 30, wizardHp: 3 },
}

// Fallback wizard HP if a difficulty doesn't specify one.
export const WIZARD_MAX_HP = 10

// Correct within this many seconds => Critical (blue) attack.
export const CRITICAL_WINDOW = 5

// Damage values. Any correct answer within the time limit deals 1 damage;
// answering fast still triggers the flashier blue "Critical" beam + bonus score.
export const DMG_CRITICAL = 1 // fast answer (blue light beam)
export const DMG_NORMAL = 1 // slower-but-correct answer (fireball)
export const DMG_TO_WIZARD = 1 // wrong / timeout

// Length of the attack/animation pause before the next question (ms).
export const TURN_DELAY = 1500

// Timer tick interval (ms) for a smooth timer bar.
export const TICK_MS = 100
