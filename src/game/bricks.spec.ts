import { describe, expect, it } from 'vitest'

import type { Brick } from '@/interfaces/game'
import { countAliveBricks, createBricks } from './bricks'
import { BRICK_COLS, BRICK_ROWS } from './constants'

function overlaps(a: Brick, b: Brick): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height
}

describe('createBricks', () => {
  it('creates a full grid of alive bricks', () => {
    const bricks = createBricks()

    expect(bricks).toHaveLength(BRICK_ROWS * BRICK_COLS)
    expect(countAliveBricks(bricks)).toBe(BRICK_ROWS * BRICK_COLS)
  })

  it('gives the top row more hit points and higher value', () => {
    const bricks = createBricks()

    const topRow = bricks.slice(0, BRICK_COLS)
    expect(topRow.every((brick) => brick.hitsLeft === 3 && brick.points === 60)).toBe(true)

    const bottomRow = bricks.slice(-BRICK_COLS)
    expect(bottomRow.every((brick) => brick.hitsLeft === 1 && brick.points === 10)).toBe(true)
  })

  it('lays bricks out without overlaps', () => {
    const bricks = createBricks()

    for (let i = 0; i < bricks.length; i++) {
      for (let j = i + 1; j < bricks.length; j++) {
        expect(overlaps(bricks[i], bricks[j])).toBe(false)
      }
    }
  })
})

describe('countAliveBricks', () => {
  it('ignores destroyed bricks', () => {
    const bricks = createBricks()
    bricks[0].alive = false

    expect(countAliveBricks(bricks)).toBe(BRICK_ROWS * BRICK_COLS - 1)
  })
})
