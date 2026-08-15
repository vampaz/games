import type { Ball, Paddle } from '@/interfaces/game'
import { BALL_BASE_SPEED, BALL_RADIUS, MAX_BOUNCE_ANGLE } from './constants'

export function createBall(x: number, y: number): Ball {
  return {
    position: { x, y },
    velocity: { x: 0, y: 0 },
    radius: BALL_RADIUS,
  }
}

export function launchBall(ball: Ball, speed: number): void {
  const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.5
  ball.velocity.x = Math.cos(angle) * speed
  ball.velocity.y = Math.sin(angle) * speed
}

export function setBallSpeed(ball: Ball, speed: number): void {
  const current = Math.hypot(ball.velocity.x, ball.velocity.y)
  if (current === 0) {
    launchBall(ball, speed)
    return
  }
  const scale = speed / current
  ball.velocity.x *= scale
  ball.velocity.y *= scale
}

export function bounceOffPaddle(ball: Ball, paddle: Paddle): void {
  const offset = (ball.position.x - paddle.x) / (paddle.width / 2)
  const clamped = Math.max(-1, Math.min(1, offset))
  const angle = -Math.PI / 2 + clamped * MAX_BOUNCE_ANGLE
  const speed = Math.hypot(ball.velocity.x, ball.velocity.y) || BALL_BASE_SPEED
  ball.velocity.x = Math.cos(angle) * speed
  ball.velocity.y = Math.sin(angle) * speed
}
