import { describe, expect, it } from 'vitest'

import { createPaddle, movePaddle } from './paddle'

describe('createPaddle', () => {
  it('creates a paddle centered on the field', () => {
    const paddle = createPaddle(53)

    expect(paddle.x).toBe(53)
    expect(paddle.y).toBe(300)
    expect(paddle.width).toBe(10)
    expect(paddle.height).toBe(75)
  })
})

describe('movePaddle', () => {
  it('moves the paddle by the given delta', () => {
    const paddle = createPaddle(53)

    movePaddle(paddle, -40)
    expect(paddle.y).toBeCloseTo(260)

    movePaddle(paddle, 40)
    expect(paddle.y).toBeCloseTo(300)
  })

  it('clamps the paddle short of the top wall', () => {
    const paddle = createPaddle(53)

    movePaddle(paddle, -9999)
    // 75/2 + 8 edge gap
    expect(paddle.y).toBeCloseTo(45.5)
  })

  it('clamps the paddle short of the bottom wall', () => {
    const paddle = createPaddle(53)

    movePaddle(paddle, 9999)
    expect(paddle.y).toBeCloseTo(554.5)
  })
})
