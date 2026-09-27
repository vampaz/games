import { LINES_PER_LEVEL, NES_DROP_FRAMES } from './constants'

// NES scoring base values, indexed by the number of lines cleared at once
const NES_LINE_SCORES = [0, 40, 100, 300, 1200] as const

/** NES score for a single lock: base × the display level. */
export function scoreForLines(lines: number, level: number): number {
  if (lines < 1 || lines > 4) return 0
  return NES_LINE_SCORES[lines] * level
}

/** Level for a total line count, starting at 1. */
export function levelForLines(lines: number): number {
  return Math.floor(lines / LINES_PER_LEVEL) + 1
}

/** The NES gravity interval in seconds for a display level. */
export function dropIntervalForLevel(level: number): number {
  const index = Math.min(Math.max(1, level) - 1, NES_DROP_FRAMES.length - 1)
  return NES_DROP_FRAMES[index] / 60
}
