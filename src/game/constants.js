import config from './config.js'

// Difficulty configuration. The editable numbers (time / HP) live in config.js;
// `key` is derived from the entry name so it always matches.
export const DIFFICULTIES = Object.fromEntries(
  Object.entries(config.difficulties).map(([key, values]) => [
    key,
    { key, ...values },
  ]),
)

// Fallback wizard HP if a difficulty doesn't specify one.
export const WIZARD_MAX_HP = 10

// Damage values. Any correct answer within the time limit deals 1 damage;
// answering in the first half of the timer still triggers the flashier blue
// "Critical" beam + bonus score.
export const DMG_CRITICAL = 1 // fast answer (blue light beam)
export const DMG_NORMAL = 1 // slower-but-correct answer (fireball)
export const DMG_TO_WIZARD = 1 // wrong / timeout

// Extra points per second left on the timer when answering correctly.
export const SPEED_BONUS_PER_SEC = config.score.speedBonusPerSec

// End-of-game bonus for each of the Wizard's surviving HP.
export const HP_BONUS = config.score.hpBonus

// --- "Time is running out" warning ---------------------------------------
// The quiz frame pulses for the last DANGER_SECONDS of the timer, so the player
// notices in peripheral vision while their eyes are on the answer options (the
// red timer bar at the top is easy to miss).
//
// The window is capped to a fraction of the timer, otherwise Hard mode (4 s)
// would pulse for 75% of the turn and become pure noise:
//   Easy 15s -> 3.0s   Medium 8s -> 3.0s   Hard 4s -> 1.6s
// (Both values are editable in config.js -> dangerTiming.)
export const DANGER_SECONDS = config.dangerTiming.seconds
export const DANGER_MAX_FRACTION = config.dangerTiming.maxFraction

export function dangerThreshold(timeLimit) {
  return Math.min(DANGER_SECONDS, timeLimit * DANGER_MAX_FRACTION)
}

// A soft clock tick on each remaining second of that same window, for players
// who look away from the screen while thinking. It shares the danger window with
// the scene pulse so both read as one signal, and it obeys the 🔊 SFX toggle.
//
// ── Flip to false to remove the ticking entirely (the pulse stays). ──
export const TICK_ENABLED = true

// Length of the attack/animation pause before the next question (ms).
export const TURN_DELAY = 1500

// Timer tick interval (ms) for a smooth timer bar.
export const TICK_MS = 100
