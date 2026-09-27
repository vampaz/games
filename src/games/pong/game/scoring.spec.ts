import { describe, expect, it } from 'vitest'

import { pointFor, winningSide } from './scoring'

describe('pointFor', () => {
  it('adds a point for the given side only', () => {
    const scores = { player: 3, ai: 5 }

    pointFor(scores, 'player')
    expect(scores).toEqual({ player: 4, ai: 5 })

    pointFor(scores, 'ai')
    expect(scores).toEqual({ player: 4, ai: 6 })
  })
})

describe('winningSide', () => {
  it('returns null while nobody has reached eleven', () => {
    expect(winningSide({ player: 10, ai: 10 })).toBeNull()
    expect(winningSide({ player: 0, ai: 0 })).toBeNull()
  })

  it('returns the side that reached eleven', () => {
    expect(winningSide({ player: 11, ai: 10 })).toBe('player')
    expect(winningSide({ player: 10, ai: 11 })).toBe('ai')
  })
})
