import { describe, expect, it } from 'vitest'

import type { Paddle } from '@/games/arkanoid/interfaces/game'
import { bounceOffPaddle, createBall, launchBall } from './ball'

function makePaddle(x = 400): Paddle {
  return { x, y: 564, width: 120, height: 14 }
}

describe('bounceOffPaddle', () => {
  it('bounces straight up from the paddle center', () => {
    const ball = createBall(400, 550)
    ball.velocity.x = 120
    ball.velocity.y = -300

    bounceOffPaddle(ball, makePaddle())

    expect(Math.abs(ball.velocity.x)).toBeLessThan(1)
    expect(ball.velocity.y).toBeLessThan(0)
  })

  it('deflects left from the left edge', () => {
    const ball = createBall(340, 550) // paddle spans x 340..460
    ball.velocity.x = 100
    ball.velocity.y = -300

    bounceOffPaddle(ball, makePaddle())

    expect(ball.velocity.x).toBeLessThan(0)
  })

  it('deflects right from the right edge', () => {
    const ball = createBall(460, 550)
    ball.velocity.x = -100
    ball.velocity.y = -300

    bounceOffPaddle(ball, makePaddle())

    expect(ball.velocity.x).toBeGreaterThan(0)
  })

  it('preserves the ball speed', () => {
    const ball = createBall(400, 550)
    ball.velocity.x = 200
    ball.velocity.y = -300
    const before = Math.hypot(ball.velocity.x, ball.velocity.y)

    bounceOffPaddle(ball, makePaddle())

    expect(Math.hypot(ball.velocity.x, ball.velocity.y)).toBeCloseTo(before)
  })
})

describe('launchBall', () => {
  it('always launches upward', () => {
    const ball = createBall(0, 0)

    for (let i = 0; i < 50; i++) {
      launchBall(ball, 360)
      expect(ball.velocity.y).toBeLessThan(0)
    }
  })

  it('launches at the requested speed', () => {
    const ball = createBall(0, 0)

    launchBall(ball, 420)

    expect(Math.hypot(ball.velocity.x, ball.velocity.y)).toBeCloseTo(420)
  })
})
