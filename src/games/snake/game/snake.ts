import type { Cell, Direction, SnakeState } from '@/games/snake/interfaces/game'
import { SPEED_STEPS, START_LENGTH } from './constants'

export function opposite(a: Direction, b: Direction): boolean {
  return (
    (a === 'up' && b === 'down') ||
    (a === 'down' && b === 'up') ||
    (a === 'left' && b === 'right') ||
    (a === 'right' && b === 'left')
  )
}

export function createGame(cols: number, rows: number): SnakeState {
  const headX = Math.floor(cols / 2)
  const headY = Math.floor(rows / 2)
  const snake: Cell[] = []
  for (let i = 0; i < START_LENGTH; i++) {
    snake.push({ x: headX - i, y: headY })
  }
  const state: SnakeState = {
    snake,
    direction: 'right',
    queuedDirection: 'right',
    food: { x: 0, y: 0 },
    score: 0,
    alive: true,
  }
  state.food = spawnFood(state, cols, rows)
  return state
}

/** Queue a turn; 180-degree reversals are ignored. */
export function setDirection(state: SnakeState, direction: Direction): void {
  if (opposite(direction, state.queuedDirection)) return
  if (direction === state.queuedDirection) return
  state.queuedDirection = direction
}

/**
 * Advance one grid step. Returns what happened so the engine can score,
 * persist the best and update the HUD.
 */
export function step(state: SnakeState, cols: number, rows: number): 'moved' | 'ate' | 'died' {
  if (!state.alive) return 'died'
  state.direction = state.queuedDirection
  const head = state.snake[0]
  const next: Cell = { x: head.x, y: head.y }
  if (state.direction === 'up') next.y -= 1
  else if (state.direction === 'down') next.y += 1
  else if (state.direction === 'left') next.x -= 1
  else next.x += 1

  if (next.x < 0 || next.y < 0 || next.x >= cols || next.y >= rows) {
    state.alive = false
    return 'died'
  }

  const eats = next.x === state.food.x && next.y === state.food.y
  // The tail vacates unless we grow, so moving into it is legal.
  const body = eats ? state.snake : state.snake.slice(0, -1)
  for (const segment of body) {
    if (segment.x === next.x && segment.y === next.y) {
      state.alive = false
      return 'died'
    }
  }

  state.snake.unshift(next)
  if (eats) {
    state.score += 1
    state.food = spawnFood(state, cols, rows)
    return 'ate'
  }
  state.snake.pop()
  return 'moved'
}

/** Pick a free cell uniformly; keeps the current food when the board is full. */
export function spawnFood(
  state: SnakeState,
  cols: number,
  rows: number,
  random: () => number = Math.random,
): Cell {
  const occupied = new Set(state.snake.map((segment) => segment.y * cols + segment.x))
  const free: Cell[] = []
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (!occupied.has(y * cols + x)) free.push({ x, y })
    }
  }
  if (free.length === 0) return state.food
  return free[Math.floor(random() * free.length)]
}

/** Seconds per step for a score; the original speeds up in steps. */
export function intervalFor(score: number): number {
  let interval = SPEED_STEPS[0][1]
  for (const [threshold, stepInterval] of SPEED_STEPS) {
    if (score >= threshold) interval = stepInterval
  }
  return interval
}
