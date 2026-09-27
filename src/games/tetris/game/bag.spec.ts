import { describe, expect, it } from 'vitest'

import type { PieceId } from '@/games/tetris/interfaces/game'
import { drawFromBag, shuffleBag } from './bag'
import { PIECE_IDS } from './pieces'

describe('shuffleBag', () => {
  it('returns every piece exactly once', () => {
    const bag = shuffleBag()

    expect(bag).toHaveLength(PIECE_IDS.length)
    expect(new Set(bag).size).toBe(PIECE_IDS.length)
    for (const id of PIECE_IDS) expect(bag).toContain(id)
  })

  it('shuffles', () => {
    // An exact permutation match on every call would be absurdly unlikely
    let reshuffled = 0
    for (let i = 0; i < 20; i++) {
      if (shuffleBag().join('') !== shuffleBag().join('')) reshuffled++
    }
    expect(reshuffled).toBeGreaterThan(0)
  })
})

describe('drawFromBag', () => {
  it('returns the piece on top of the bag', () => {
    const bag = shuffleBag()
    const top = bag[bag.length - 1]

    const first = drawFromBag(bag)

    expect(first).toBe(top)
    expect(bag).toHaveLength(6)
  })

  it('refills the bag when it runs empty', () => {
    const bag: PieceId[] = [shuffleBag()[0]]

    drawFromBag(bag) // empties it
    drawFromBag(bag) // the refill happens on the next draw

    expect(bag).toHaveLength(6) // refilled to 7, then consumed one
  })

  it('keeps drawing after the refill', () => {
    const bag: PieceId[] = []

    for (let i = 0; i < 7; i++) drawFromBag(bag)

    expect(bag).toHaveLength(0)
  })

  it('keeps each piece evenly distributed over full bag cycles', () => {
    const bag: PieceId[] = []
    const counts = new Map<PieceId, number>()

    for (let i = 0; i < 70; i++) {
      const piece = drawFromBag(bag)
      counts.set(piece, (counts.get(piece) ?? 0) + 1)
    }

    for (const id of PIECE_IDS) expect(counts.get(id)).toBe(10)
  })
})
