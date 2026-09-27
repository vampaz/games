import { describe, expect, it } from 'vitest'

import { advanceBall, bounceWalls, createBall, hitPaddle, launchBall } from './ball'
import { PADDLE_HEIGHT, PADDLE_WIDTH } from './constants'
import type { Paddle } from '@/games/pong/interfaces/game'

function rightPaddle(x = 700, y = 300): Paddle {
  return { x, y, width: PADDLE_WIDTH, height: PADDLE_HEIGHT }
}

describe('createBall', () => {
  it('creates a ball at rest at the given position', () => {
    const ball = createBall(400, 300, 12)

    expect(ball.position).toEqual({ x: 400, y: 300 })
    expect(ball.velocity).toEqual({ x: 0, y: 0 })
    expect(ball.size).toBe(12)
  })
})

describe('launchBall', () => {
  it('launches at the given speed in the given direction', () => {
    const ball = createBall(400, 300, 12)

    launchBall(ball, 1, 380)

    expect(Math.hypot(ball.velocity.x, ball.velocity.y)).toBeCloseTo(380)
    expect(ball.velocity.x).toBeGreaterThan(0)

    launchBall(ball, -1, 380)
    expect(ball.velocity.x).toBeLessThan(0)
  })

  it('keeps the launch angle shallow', () => {
    const ball = createBall(400, 300, 12)
    launchBall(ball, 1, 380)

    // sin(20°) is the steepest component a serve can have
    expect(Math.abs(ball.velocity.y) / 380).toBeLessThanOrEqual(Math.sin(Math.PI / 9) + 1e-9)
  })
})

describe('advanceBall', () => {
  it('moves the ball by velocity * dt and remembers the previous x', () => {
    const ball = createBall(100, 100, 12)
    ball.velocity = { x: 200, y: -100 }

    advanceBall(ball, 0.5)

    expect(ball.position.x).toBeCloseTo(200)
    expect(ball.position.y).toBeCloseTo(50)
    expect(ball.previousX).toBe(100)
  })
})

describe('bounceWalls', () => {
  it('reflects off the top wall', () => {
    const ball = createBall(100, 2, 12)
    ball.velocity = { x: 100, y: -50 }

    expect(bounceWalls(ball)).toBe('top')
    expect(ball.position.y).toBeCloseTo(6)
    expect(ball.velocity.y).toBe(50)
    expect(ball.velocity.x).toBe(100)
  })

  it('reflects off the bottom wall', () => {
    const ball = createBall(100, 598, 12)
    ball.velocity = { x: 100, y: 50 }

    expect(bounceWalls(ball)).toBe('bottom')
    expect(ball.position.y).toBeCloseTo(594)
    expect(ball.velocity.y).toBe(-50)
  })

  it('leaves a ball in flight untouched', () => {
    const ball = createBall(400, 300, 12)
    ball.velocity = { x: 100, y: -50 }

    expect(bounceWalls(ball)).toBeNull()
    expect(ball.position).toEqual({ x: 400, y: 300 })
    expect(ball.velocity).toEqual({ x: 100, y: -50 })
  })
})

describe('hitPaddle', () => {
  it('deflects a ball whose edge crosses the paddle face', () => {
    const paddle = rightPaddle() // face at x = 695
    const ball = createBall(688, 300, 12) // leading edge at 694, one short of the face
    ball.velocity = { x: 380, y: 0 }

    advanceBall(ball, 12 / 380) // lands at x = 700, leading edge 706: crossed the face
    expect(hitPaddle(ball, paddle, 1)).toBe(true)

    // Snapped just outside the face, heading left at the sped-up speed
    expect(ball.position.x).toBeCloseTo(700 - 5 - 6 - 0.5)
    expect(ball.velocity.x).toBeCloseTo(-380 * 1.06)
    expect(ball.velocity.y).toBeCloseTo(0)
  })

  it('steers the ball by where it strikes, steep at the edge', () => {
    const paddle = rightPaddle()
    const ball = createBall(688, 300 + PADDLE_HEIGHT / 2, 12)
    ball.velocity = { x: 380, y: 0 }

    advanceBall(ball, 12 / 380) // crosses the face at the paddle's bottom edge
    ball.velocity = { x: 380, y: 100 }

    expect(hitPaddle(ball, paddle, 1)).toBe(true)

    const speed = Math.hypot(ball.velocity.x, ball.velocity.y)
    expect(ball.velocity.y / speed).toBeCloseTo(Math.sin(Math.PI / 3))
    expect(ball.velocity.x / speed).toBeCloseTo(Math.cos(Math.PI / 3) * -1)
  })

  it('speeds the ball up, capped at the maximum', () => {
    const paddle = rightPaddle()
    const ball = createBall(688, 300, 12)
    ball.velocity = { x: 1000, y: 0 }

    advanceBall(ball, 12 / 1000) // crosses the face
    expect(hitPaddle(ball, paddle, 1)).toBe(true)
    expect(Math.hypot(ball.velocity.x, ball.velocity.y)).toBeCloseTo(950)
  })

  it('deflects a ball that would tunnel past the paddle in one frame', () => {
    const paddle = rightPaddle() // face at x = 695, paddle body to 705
    const ball = createBall(680, 300, 12)
    ball.velocity = { x: 950, y: 0 }

    advanceBall(ball, 1 / 30) // 31.7px step lands the ball fully behind the paddle
    expect(hitPaddle(ball, paddle, 1)).toBe(true)
    expect(ball.position.x).toBeLessThan(695) // snapped back outside the face
  })

  it('ignores a ball moving away from the paddle', () => {
    const paddle = rightPaddle()
    const ball = createBall(700, 300, 12)
    ball.velocity = { x: -380, y: 0 }

    expect(hitPaddle(ball, paddle, 1)).toBe(false)
    expect(ball.velocity.x).toBe(-380)
  })

  it('ignores a ball that misses the paddle vertically', () => {
    const paddle = rightPaddle(700, 100)
    const ball = createBall(700, 300, 12)
    ball.velocity = { x: 380, y: 0 }

    expect(hitPaddle(ball, paddle, 1)).toBe(false)
    expect(ball.velocity).toEqual({ x: 380, y: 0 })
  })

  it('ignores a ball that already passed through the paddle', () => {
    const paddle = rightPaddle(700)
    const ball = createBall(720, 300, 12) // fully behind the paddle face
    ball.velocity = { x: 380, y: 0 }

    expect(hitPaddle(ball, paddle, 1)).toBe(false)
  })
})
