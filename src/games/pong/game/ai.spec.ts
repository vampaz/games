import { describe, expect, it } from 'vitest'

import { aiPaddleStep } from './ai'
import { createBall } from './ball'
import { PADDLE_HEIGHT, PADDLE_WIDTH } from './constants'
import type { Paddle } from '@/games/pong/interfaces/game'

function paddleAt(y: number): Paddle {
  return { x: 745, y, width: PADDLE_WIDTH, height: PADDLE_HEIGHT }
}

describe('aiPaddleStep', () => {
  it('chases the ball while it approaches the AI', () => {
    const ball = createBall(400, 500, 12)
    ball.velocity = { x: 200, y: 100 }
    const paddle = paddleAt(300)

    expect(aiPaddleStep(ball, paddle, 0.016)).toBeGreaterThan(0)
  })

  it('drifts back to the center when the ball moves away', () => {
    const ball = createBall(400, 500, 12)
    ball.velocity = { x: -200, y: 100 }
    const paddle = paddleAt(100)

    expect(aiPaddleStep(ball, paddle, 0.016)).toBeGreaterThan(0) // toward y = 300
  })

  it('stays put within the dead zone', () => {
    const ball = createBall(400, 305, 12)
    ball.velocity = { x: 200, y: 0 }

    expect(aiPaddleStep(ball, paddleAt(300), 0.016)).toBe(0)
  })

  it('never moves faster than its speed cap', () => {
    const ball = createBall(400, 550, 12)
    ball.velocity = { x: 200, y: 0 }
    const paddle = paddleAt(50) // 500 away

    const step = aiPaddleStep(ball, paddle, 0.016)
    expect(step).toBeGreaterThan(0)
    expect(step).toBeLessThanOrEqual(400 * 0.016 + 1e-9)
  })
})
