export const COLS = 10
export const ROWS = 20
// Large logical cells keep the small board crisp when the canvas is scaled
// up to its display size (a 20px grid would upscale 2.4x on retina screens)
export const CELL = 50

export const GAME_WIDTH = COLS * CELL
export const GAME_HEIGHT = ROWS * CELL

// Gravity in frames per gridcell at 60fps, as stored in the NES ROM.
// Index is the internal level (0-based); the display level is internal + 1.
export const NES_DROP_FRAMES = [
  48, 43, 38, 33, 28, 23, 18, 13, 8, 6,
  5, 5, 5,
  4, 4, 4,
  3, 3, 3,
  2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
  1,
] as const

// Delayed auto shift: press moves once, then after 16 frames it repeats
// every 6 frames while held (the counter resets to 10 after each move,
// so the repeat interval is DAS_DELAY - DAS_RESET)
export const DAS_DELAY = 16 / 60
export const DAS_RESET = 10 / 60

// Additional rotation extension: after a piece lands it stays movable for
// 10 frames (18 if it lands on the top rows) before it locks
export const ARE_BASE_FRAMES = 10
export const ARE_EXTRA_FRAMES_PER_ROW_GROUP = 2
export const ARE_ROW_GROUP_SIZE = 4

export const LINES_PER_LEVEL = 10

// The GET READY pause shown at game start and after each level up
export const GET_READY_DURATION = 1.5
