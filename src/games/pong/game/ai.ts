import type { Ball, Paddle } from '@/games/pong/interfaces/game'
import { AI_DEAD_ZONE, AI_SPEED, GAME_HEIGHT } from './constants'

/**
 * One frame of AI paddle movement: track the ball while it travels toward the
 * AI, otherwise drift back to the center. The speed cap keeps the AI beatable
 * on fast, steep shots.
 */
export function aiPaddleStep(ball: Ball, paddle: Paddle, dt: number): number {
  const approaching = ball.velocity.x > 0
  const target = approaching ? ball.position.y : GAME_HEIGHT / 2
  const diff = target - paddle.y
  if (Math.abs(diff) < AI_DEAD_ZONE) return 0

  const maxStep = AI_SPEED * dt
  return Math.max(-maxStep, Math.min(maxStep, diff))
}
