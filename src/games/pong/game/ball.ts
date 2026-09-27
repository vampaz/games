import type { Ball, Paddle } from '@/games/pong/interfaces/game'
import { BALL_MAX_SPEED, BALL_SPEED_BONUS, GAME_HEIGHT, MAX_DEFLECTION, SERVE_MAX_ANGLE } from './constants'

export function createBall(x: number, y: number, size: number): Ball {
  return { position: { x, y }, velocity: { x: 0, y: 0 }, size, previousX: x }
}

/**
 * Launch the ball from the center toward one side. `direction` is 1 (right,
 * toward the AI) or -1 (left, toward the player); the angle is random but
 * kept shallow, like the original serves.
 */
export function launchBall(ball: Ball, direction: 1 | -1, speed: number): void {
  const angle = (Math.random() * 2 - 1) * SERVE_MAX_ANGLE
  ball.velocity.x = Math.cos(angle) * speed * direction
  ball.velocity.y = Math.sin(angle) * speed
}

/** Advance the ball by `dt` seconds. */
export function advanceBall(ball: Ball, dt: number): void {
  ball.previousX = ball.position.x
  ball.position.x += ball.velocity.x * dt
  ball.position.y += ball.velocity.y * dt
}

/**
 * Reflect off the top and bottom walls (angle of incidence equals angle of
 * reflection). Returns which wall was hit, or null when the ball is in flight.
 */
export function bounceWalls(ball: Ball): 'top' | 'bottom' | null {
  const half = ball.size / 2
  if (ball.position.y - half < 0) {
    ball.position.y = half
    ball.velocity.y = Math.abs(ball.velocity.y)
    return 'top'
  }
  if (ball.position.y + half > GAME_HEIGHT) {
    ball.position.y = GAME_HEIGHT - half
    ball.velocity.y = -Math.abs(ball.velocity.y)
    return 'bottom'
  }
  return null
}

/**
 * Ball/paddle collision for a vertical paddle. The ball must be moving toward
 * the paddle and its leading edge must have crossed the paddle face this frame
 * (a swept test, so a fast ball can never tunnel through the paddle). On
 * contact the ball is snapped just outside the face, steered by where it
 * struck (edge hits leave at a steep angle) and sped up, the way the original
 * accelerated the ball on every paddle hit.
 *
 * `travel` is the direction the ball is currently moving: 1 toward the right
 * paddle, -1 toward the left. Returns true when the ball was deflected.
 */
export function hitPaddle(ball: Ball, paddle: Paddle, travel: 1 | -1): boolean {
  const half = ball.size / 2
  const face = travel === 1 ? paddle.x - paddle.width / 2 : paddle.x + paddle.width / 2
  const movingToward = travel === 1 ? ball.velocity.x > 0 : ball.velocity.x < 0
  if (!movingToward) return false

  const leadPrev = travel === 1 ? ball.previousX + half : ball.previousX - half
  const leadNow = travel === 1 ? ball.position.x + half : ball.position.x - half
  const crossedFace =
    travel === 1 ? leadPrev <= face && leadNow >= face : leadPrev >= face && leadNow <= face
  const overlapsY = Math.abs(ball.position.y - paddle.y) <= paddle.height / 2 + half
  if (!overlapsY || !crossedFace) return false

  ball.position.x = travel === 1 ? face - half - 0.5 : face + half + 0.5

  const speed = Math.min(Math.hypot(ball.velocity.x, ball.velocity.y) * BALL_SPEED_BONUS, BALL_MAX_SPEED)
  const offset = Math.max(-1, Math.min(1, (ball.position.y - paddle.y) / (paddle.height / 2)))
  const angle = offset * MAX_DEFLECTION
  // The ball bounces back the way it came from
  ball.velocity.x = Math.cos(angle) * speed * -travel
  ball.velocity.y = Math.sin(angle) * speed
  return true
}
