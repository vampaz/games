import { describe, expect, it } from 'vitest'

import { createPaddle, movePaddle, setPaddleX } from './paddle'
import { GAME_WIDTH, PADDLE_WIDTH } from './constants'

describe('paddle movement', () => {
  it('clamps to the left field edge', () => {
    const paddle = createPaddle()

    setPaddleX(paddle, -100)

    expect(paddle.x).toBe(PADDLE_WIDTH / 2)
  })

  it('clamps to the right field edge', () => {
    const paddle = createPaddle()

    setPaddleX(paddle, GAME_WIDTH + 100)

    expect(paddle.x).toBe(GAME_WIDTH - PADDLE_WIDTH / 2)
  })

  it('moves by a delta', () => {
    const paddle = createPaddle()

    movePaddle(paddle, 40)

    expect(paddle.x).toBe(GAME_WIDTH / 2 + 40)
  })
})
