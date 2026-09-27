import type { Paddle } from '@/games/arkanoid/interfaces/game'
import { GAME_WIDTH, PADDLE_HEIGHT, PADDLE_WIDTH, PADDLE_Y } from './constants'

export function createPaddle(): Paddle {
  return { x: GAME_WIDTH / 2, y: PADDLE_Y, width: PADDLE_WIDTH, height: PADDLE_HEIGHT }
}

export function movePaddle(paddle: Paddle, dx: number): void {
  setPaddleX(paddle, paddle.x + dx)
}

export function setPaddleX(paddle: Paddle, x: number): void {
  const half = paddle.width / 2
  paddle.x = Math.min(GAME_WIDTH - half, Math.max(half, x))
}
