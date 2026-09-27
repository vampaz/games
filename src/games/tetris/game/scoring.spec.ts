import { describe, expect, it } from 'vitest'

import { dropIntervalForLevel, levelForLines, scoreForLines } from './scoring'

describe('scoreForLines', () => {
  it('scores clears at the NES base values', () => {
    expect(scoreForLines(1, 1)).toBe(40)
    expect(scoreForLines(2, 1)).toBe(100)
    expect(scoreForLines(3, 1)).toBe(300)
    expect(scoreForLines(4, 1)).toBe(1200)
  })

  it('scales with the level', () => {
    expect(scoreForLines(1, 2)).toBe(80)
    expect(scoreForLines(2, 3)).toBe(300)
    expect(scoreForLines(4, 10)).toBe(12000)
  })

  it('awards nothing for zero or impossible clears', () => {
    expect(scoreForLines(0, 1)).toBe(0)
    expect(scoreForLines(5, 1)).toBe(0)
  })
})

describe('levelForLines', () => {
  it('starts at level 1', () => {
    expect(levelForLines(0)).toBe(1)
    expect(levelForLines(9)).toBe(1)
  })

  it('levels up every 10 lines', () => {
    expect(levelForLines(10)).toBe(2)
    expect(levelForLines(19)).toBe(2)
    expect(levelForLines(20)).toBe(3)
    expect(levelForLines(190)).toBe(20)
  })
})

describe('dropIntervalForLevel', () => {
  it('uses the NES ROM gravity table (frames at 60fps)', () => {
    expect(dropIntervalForLevel(1)).toBeCloseTo(48 / 60)
    expect(dropIntervalForLevel(2)).toBeCloseTo(43 / 60)
    expect(dropIntervalForLevel(10)).toBeCloseTo(6 / 60)
  })

  it('gets faster with each level', () => {
    expect(dropIntervalForLevel(2)).toBeLessThan(dropIntervalForLevel(1))
    expect(dropIntervalForLevel(10)).toBeLessThan(dropIntervalForLevel(2))
  })

  it('clamps at the fastest entry for levels beyond the table', () => {
    expect(dropIntervalForLevel(30)).toBeCloseTo(1 / 60)
    expect(dropIntervalForLevel(99)).toBeCloseTo(1 / 60)
  })

  it('clamps levels below 1', () => {
    expect(dropIntervalForLevel(0)).toBeCloseTo(48 / 60)
  })
})
