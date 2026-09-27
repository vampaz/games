import type { PieceId } from '@/games/tetris/interfaces/game'
import { PIECE_IDS } from './pieces'

/** A shuffled 7-bag containing every piece exactly once. */
export function shuffleBag(): PieceId[] {
  const bag = [...PIECE_IDS]
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[bag[i], bag[j]] = [bag[j], bag[i]]
  }
  return bag
}

/** Draw the next piece, refilling the 7-bag when it runs empty (mutates the bag). */
export function drawFromBag(bag: PieceId[]): PieceId {
  if (bag.length === 0) bag.push(...shuffleBag())
  const piece = bag.pop()
  if (piece === undefined) throw new Error('Bag is empty after refill')
  return piece
}
