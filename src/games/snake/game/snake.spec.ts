import { describe, expect, it } from 'vitest'

import type { SnakeState } from '@/games/snake/interfaces/game'
import { createGame, intervalFor, setDirection, spawnFood, step } from './snake'

const COLS = 20
const ROWS = 20

function stateWith(snake: SnakeState['snake'], food: SnakeState['food']): SnakeState {
  return { snake, direction: 'right', queuedDirection: 'right', food, score: 0, alive: true }
}

describe('createGame', () => {
  it('starts centered with 3 segments, facing right, food off the snake', () => {
    const state = createGame(COLS, ROWS)
    expect(state.snake).toHaveLength(3)
    expect(state.direction).toBe('right')
    expect(state.alive).toBe(true)
    const [head, ...body] = state.snake
    expect(head).toEqual({ x: 10, y: 10 })
    for (const segment of body) {
      expect(segment.y).toBe(10)
    }
    expect(state.snake).not.toContainEqual(state.food)
  })
})

describe('setDirection', () => {
  it('ignores 180-degree reversals', () => {
    const state = stateWith(
      [
        { x: 5, y: 5 },
        { x: 4, y: 5 },
      ],
      { x: 0, y: 0 },
    )
    setDirection(state, 'left')
    expect(state.queuedDirection).toBe('right')
  })

  it('queues perpendicular turns', () => {
    const state = stateWith(
      [
        { x: 5, y: 5 },
        { x: 4, y: 5 },
      ],
      { x: 0, y: 0 },
    )
    setDirection(state, 'up')
    expect(state.queuedDirection).toBe('up')
  })
})

describe('step', () => {
  it('moves the head without growing', () => {
    const state = stateWith(
      [
        { x: 5, y: 5 },
        { x: 4, y: 5 },
      ],
      { x: 0, y: 0 },
    )
    expect(step(state, COLS, ROWS)).toBe('moved')
    expect(state.snake).toEqual([
      { x: 6, y: 5 },
      { x: 5, y: 5 },
    ])
    expect(state.score).toBe(0)
  })

  it('grows and scores when eating', () => {
    const state = stateWith(
      [
        { x: 5, y: 5 },
        { x: 4, y: 5 },
      ],
      { x: 6, y: 5 },
    )
    expect(step(state, COLS, ROWS)).toBe('ate')
    expect(state.snake).toHaveLength(3)
    expect(state.snake[0]).toEqual({ x: 6, y: 5 })
    expect(state.score).toBe(1)
    expect(state.snake).not.toContainEqual(state.food)
  })

  it('dies on wall contact', () => {
    const state = stateWith([{ x: 0, y: 0 }], { x: 10, y: 10 })
    setDirection(state, 'up')
    state.direction = 'up'
    state.queuedDirection = 'up'
    expect(step(state, COLS, ROWS)).toBe('died')
    expect(state.alive).toBe(false)
  })

  it('dies on self contact', () => {
    const state: SnakeState = {
      snake: [
        { x: 5, y: 5 },
        { x: 5, y: 6 },
        { x: 4, y: 6 },
        { x: 4, y: 5 },
      ],
      direction: 'down',
      queuedDirection: 'down',
      food: { x: 0, y: 0 },
      score: 0,
      alive: true,
    }
    expect(step(state, COLS, ROWS)).toBe('died')
    expect(state.alive).toBe(false)
  })

  it('allows moving into the vacating tail', () => {
    const state: SnakeState = {
      snake: [
        { x: 5, y: 5 },
        { x: 5, y: 6 },
        { x: 4, y: 6 },
        { x: 4, y: 5 },
      ],
      direction: 'left',
      queuedDirection: 'left',
      food: { x: 0, y: 0 },
      score: 0,
      alive: true,
    }
    expect(step(state, COLS, ROWS)).toBe('moved')
    expect(state.alive).toBe(true)
  })
})

describe('spawnFood', () => {
  it('never spawns on the snake', () => {
    const state = stateWith([{ x: 0, y: 0 }], { x: 0, y: 0 })
    for (let i = 0; i < 50; i++) {
      const food = spawnFood(state, 2, 2)
      expect(state.snake).not.toContainEqual(food)
    }
  })
})

describe('intervalFor', () => {
  it('starts comfortable and steps down at score thresholds', () => {
    expect(intervalFor(0)).toBe(0.15)
    expect(intervalFor(9)).toBe(0.15)
    expect(intervalFor(10)).toBe(0.135)
    expect(intervalFor(29)).toBe(0.12)
    expect(intervalFor(30)).toBe(0.105)
    expect(intervalFor(80)).toBe(0.06)
    expect(intervalFor(10000)).toBe(0.06)
  })
})
