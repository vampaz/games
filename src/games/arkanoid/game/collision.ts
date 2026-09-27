import type { Ball, Brick, BrickCollision } from '@/games/arkanoid/interfaces/game'

export function circleHitsRect(ball: Ball, brick: Brick): boolean {
  const dx = ball.position.x - clamp(ball.position.x, brick.x, brick.x + brick.width)
  const dy = ball.position.y - clamp(ball.position.y, brick.y, brick.y + brick.height)
  return dx * dx + dy * dy <= ball.radius * ball.radius
}

/**
 * Returns the collision response, or null when there is no overlap.
 * The bounce direction is derived from the closest-point normal, so corner
 * hits resolve to the face the ball is actually nearest to.
 */
export function resolveBallBrick(ball: Ball, brick: Brick): BrickCollision | null {
  const closestX = clamp(ball.position.x, brick.x, brick.x + brick.width)
  const closestY = clamp(ball.position.y, brick.y, brick.y + brick.height)
  const dx = ball.position.x - closestX
  const dy = ball.position.y - closestY
  if (dx * dx + dy * dy > ball.radius * ball.radius) return null

  // Ball center inside the brick: fall back to the movement axis
  if (dx === 0 && dy === 0) {
    return ball.velocity.x !== 0
      ? { axis: 'x', signX: -Math.sign(ball.velocity.x), signY: 0 }
      : { axis: 'y', signX: 0, signY: -Math.sign(ball.velocity.y) }
  }

  if (Math.abs(dx) > Math.abs(dy)) {
    return { axis: 'x', signX: dx < 0 ? -1 : 1, signY: 0 }
  }
  return { axis: 'y', signX: 0, signY: dy < 0 ? -1 : 1 }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
