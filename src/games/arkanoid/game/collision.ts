import type { Ball, Brick } from '@/games/arkanoid/interfaces/game'

export function circleHitsRect(ball: Ball, brick: Brick): boolean {
  const closestX = clamp(ball.position.x, brick.x, brick.x + brick.width)
  const closestY = clamp(ball.position.y, brick.y, brick.y + brick.height)
  const dx = ball.position.x - closestX
  const dy = ball.position.y - closestY
  return dx * dx + dy * dy <= ball.radius * ball.radius
}

/** Returns the axis to reflect on, or null when there is no collision. */
export function resolveBallBrick(ball: Ball, brick: Brick): 'x' | 'y' | null {
  if (!circleHitsRect(ball, brick)) return null

  const closestX = clamp(ball.position.x, brick.x, brick.x + brick.width)
  const closestY = clamp(ball.position.y, brick.y, brick.y + brick.height)
  const dx = ball.position.x - closestX
  const dy = ball.position.y - closestY

  // Ball center inside the brick: fall back to the movement axis
  if (dx === 0 && dy === 0) return ball.velocity.x !== 0 ? 'x' : 'y'
  if (Math.abs(dx) > Math.abs(dy)) return 'x'
  return 'y'
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
