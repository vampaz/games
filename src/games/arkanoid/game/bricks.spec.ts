import { describe, expect, it } from 'vitest'

import type { Brick } from '@/games/arkanoid/interfaces/game'
import { bonusesForScore } from './engine'
import { countRemainingBricks, createBricks } from './bricks'

function overlaps(a: Brick, b: Brick): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height
}

describe('createBricks', () => {
  it('builds one brick per marked cell of the level layout', () => {
    // Level 1 is a full 6-row wall
    const bricks = createBricks(1)

    expect(bricks).toHaveLength(60)
    expect(countRemainingBricks(bricks)).toBe(60)
  })

  it('skips empty cells', () => {
    // Level 4 is a diamond: 2 + 6 + 8 + 10 + 10 + 8 + 6 + 2 cells
    const bricks = createBricks(4)

    expect(bricks).toHaveLength(52)
  })

  it('maps colors to the original point values, one hit each', () => {
    const bricks = createBricks(1)

    const topRow = bricks.slice(0, 10) // purple
    expect(topRow.every((brick) => brick.hitsLeft === 1 && brick.points === 120)).toBe(true)

    const bottomRow = bricks.slice(-10) // white
    expect(bottomRow.every((brick) => brick.hitsLeft === 1 && brick.points === 50)).toBe(true)
  })

  it('hardens silver on later rounds and scales its value', () => {
    const early = createBricks(1).filter((brick) => brick.color === '#c0c0c0')
    expect(early.length).toBe(0) // level 1 has no silver

    const level2 = createBricks(2)
    const silver = level2.filter((brick) => brick.color === '#c0c0c0')
    expect(silver.length).toBeGreaterThan(0)
    expect(silver.every((brick) => brick.hitsLeft === 2 && brick.points === 100)).toBe(true)

    const late = createBricks(16) // same layout as level 2, round 9+
    const lateSilver = late.filter((brick) => brick.color === '#c0c0c0')
    expect(lateSilver.length).toBeGreaterThan(0)
    for (const brick of lateSilver) {
      expect(brick.hitsLeft).toBe(3)
      expect(brick.points).toBe(800)
    }
  })

  it('marks gold indestructible and excludes it from the clear count', () => {
    const bricks = createBricks(4)
    const gold = bricks.filter((brick) => brick.color === '#c9a227')

    expect(gold.length).toBeGreaterThan(0)
    expect(gold.every((brick) => brick.destructible === false)).toBe(true)
    expect(countRemainingBricks(bricks)).toBe(bricks.length - gold.length)
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

describe('countRemainingBricks', () => {
  it('ignores destroyed bricks', () => {
    const bricks = createBricks(1)
    bricks[0].alive = false

    expect(countRemainingBricks(bricks)).toBe(59)
  })
})

describe('bonusesForScore', () => {
  it('awards ships at 20k, 60k and every 60k after', () => {
    expect(bonusesForScore(0)).toBe(0)
    expect(bonusesForScore(19999)).toBe(0)
    expect(bonusesForScore(20000)).toBe(1)
    expect(bonusesForScore(59999)).toBe(1)
    expect(bonusesForScore(60000)).toBe(2)
    expect(bonusesForScore(120000)).toBe(3)
  })
})
