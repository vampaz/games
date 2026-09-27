import type { Scores } from '@/games/pong/interfaces/game'
import { WIN_SCORE } from './constants'

/** Add a point for one side (mutates). */
export function pointFor(scores: Scores, side: 'player' | 'ai'): void {
  scores[side] += 1
}

/** The side that reached the winning score, or null while the game is on. */
export function winningSide(scores: Scores): 'player' | 'ai' | null {
  if (scores.player >= WIN_SCORE) return 'player'
  if (scores.ai >= WIN_SCORE) return 'ai'
  return null
}
