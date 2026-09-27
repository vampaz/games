import { describe, expect, it } from 'vitest'

import type { Brick } from '@/interfaces/game'
import { countAliveBricks, createBricks } from './bricks'

function overlaps(a: Brick, b: Brick): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height
}

describe('createBricks', () => {
  it('builds one brick per marked cell of the level layout', () => {
    // Level 1 is a full 6-row wall
    const bricks = createBricks(1)

    expect(bricks).toHaveLength(60)
    expect(countAliveBricks(bricks)).toBe(60)
  })

  it('skips empty cells', () => {
    // Level 4 is a diamond: 2 + 6 + 8 + 10 + 10 + 8 + 6 + 2 cells
    const bricks = createBricks(4)

    expect(bricks).toHaveLength(52)
  })

  it('maps colors to the original hit counts and point values', () => {
    const bricks = createBricks(1)

    const topRow = bricks.slice(0, 10) // purple
    expect(topRow.every((brick) => brick.hitsLeft === 4 && brick.points === 100)).toBe(true)

    const bottomRow = bricks.slice(-10) // white
    expect(bottomRow.every((brick) => brick.hitsLeft === 1 && brick.points === 10)).toBe(true)
  })

  it('lays bricks out without overlaps', () => {
    const bricks = createBricks(11)

    for (let i = 0; i < bricks.length; i++) {
      for (let j = i + 1; j < bricks.length; j++) {
        expect(overlaps(bricks[i], bricks[j])).toBe(false)
      }
    }
  })

  it('wraps back to level 1 after the last layout', () => {
    expect(createBricks(15)).toEqual(createBricks(1))
  })

  it('clamps levels below 1 to the first layout', () => {
    expect(createBricks(0)).toEqual(createBricks(1))
  })
})

describe('countAliveBricks', () => {
  it('ignores destroyed bricks', () => {
    const bricks = createBricks(1)
    bricks[0].alive = false

    expect(countAliveBricks(bricks)).toBe(59)
  })
})
