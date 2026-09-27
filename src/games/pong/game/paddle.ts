import type { Paddle } from '@/games/pong/interfaces/game'
import { GAME_HEIGHT, PADDLE_EDGE_GAP, PADDLE_HEIGHT, PADDLE_WIDTH } from './constants'

export function createPaddle(x: number): Paddle {
  return { x, y: GAME_HEIGHT / 2, width: PADDLE_WIDTH, height: PADDLE_HEIGHT }
}

/**
 * Move the paddle vertically by `delta`, clamped so it never touches the top
 * or bottom of the screen, the way the original paddles never did.
 */
export function movePaddle(paddle: Paddle, delta: number): void {
  const bound = paddle.height / 2 + PADDLE_EDGE_GAP
  paddle.y = Math.max(bound, Math.min(GAME_HEIGHT - bound, paddle.y + delta))
}
