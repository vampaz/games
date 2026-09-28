// Nokia 6110 arena: 20 columns x 15 rows (300 cells), landscape like the phone.
export const COLS = 20
export const ROWS = 15

export const GAME_WIDTH = 600
export const GAME_HEIGHT = 450

// The original starts at 3 segments.
export const START_LENGTH = 3

// The original speeds up in steps at score thresholds, not smoothly.
// Exact Nokia thresholds are undocumented; this stepped curve approximates
// the feel: comfortable start, brisk late game.
export const SPEED_STEPS: Array<readonly [score: number, interval: number]> = [
  [0, 0.15],
  [10, 0.135],
  [20, 0.12],
  [30, 0.105],
  [45, 0.09],
  [60, 0.075],
  [80, 0.06],
]

export const BEST_KEY = 'snake-best'
