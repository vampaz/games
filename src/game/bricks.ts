import type { Brick } from '@/interfaces/game'
import {
  BRICK_COLS,
  BRICK_GAP,
  BRICK_HEIGHT,
  BRICK_ROWS,
  BRICK_SIDE_MARGIN,
  BRICK_TOP,
  GAME_WIDTH,
} from './constants'

const ROW_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#a855f7']
const ROW_POINTS = [60, 50, 40, 30, 20, 10, 10]
const ROW_HITS = [3, 2, 2, 1, 1, 1, 1]

export function createBricks(): Brick[] {
  const brickWidth =
    (GAME_WIDTH - BRICK_SIDE_MARGIN * 2 - BRICK_GAP * (BRICK_COLS - 1)) / BRICK_COLS
  const bricks: Brick[] = []

  for (let row = 0; row < BRICK_ROWS; row++) {
    const hits = ROW_HITS[row] ?? 1
    for (let col = 0; col < BRICK_COLS; col++) {
      bricks.push({
        x: BRICK_SIDE_MARGIN + col * (brickWidth + BRICK_GAP),
        y: BRICK_TOP + row * (BRICK_HEIGHT + BRICK_GAP),
        width: brickWidth,
        height: BRICK_HEIGHT,
        hitsLeft: hits,
        maxHits: hits,
        points: ROW_POINTS[row] ?? 10,
        color: ROW_COLORS[row % ROW_COLORS.length],
        alive: true,
      })
    }
  }

  return bricks
}

export function countAliveBricks(bricks: Brick[]): number {
  let count = 0
  for (const brick of bricks) if (brick.alive) count++
  return count
}
