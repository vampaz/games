import { describe, expect, it } from 'vitest'

import { canPlace, clearLines, createBoard, merge } from './board'
import { COLS, ROWS } from './constants'
import { TETROMINOES } from './pieces'

describe('createBoard', () => {
  it('creates an empty board of the right size', () => {
    const board = createBoard()

    expect(board).toHaveLength(ROWS)
    for (const row of board) {
      expect(row).toHaveLength(COLS)
      expect(row.every((cell) => cell === 0)).toBe(true)
    }
  })
})

describe('canPlace', () => {
  it('accepts a piece inside an empty board', () => {
    expect(canPlace(createBoard(), TETROMINOES.T.rotations[0], 3, 5)).toBe(true)
  })

  it('rejects a piece past the left wall', () => {
    // T spans 3 columns, so x = -1 puts a cell outside the board
    expect(canPlace(createBoard(), TETROMINOES.T.rotations[0], -1, 0)).toBe(false)
  })

  it('rejects a piece past the right wall', () => {
    expect(canPlace(createBoard(), TETROMINOES.T.rotations[0], COLS - 2, 0)).toBe(false)
  })

  it('rejects a piece below the floor', () => {
    const i = TETROMINOES.I.rotations[0] // single row of four

    expect(canPlace(createBoard(), i, 3, ROWS)).toBe(false)
  })

  it('rejects a piece overlapping settled cells', () => {
    const board = createBoard()
    board[ROWS - 1] = Array<number>(COLS).fill(3) // blue floor

    expect(canPlace(board, TETROMINOES.O.rotations[0], 0, ROWS - 2)).toBe(false)
  })

  it('accepts a piece resting on top of settled cells', () => {
    const board = createBoard()
    board[ROWS - 1] = Array<number>(COLS).fill(3)

    // O is 2 rows tall, so it rests at y = ROWS - 3
    expect(canPlace(board, TETROMINOES.O.rotations[0], 0, ROWS - 3)).toBe(true)
  })
})

describe('merge', () => {
  it('stamps the piece into the board', () => {
    const board = createBoard()

    // The I bar sits in matrix row 1, so it lands in board row ROWS - 2
    merge(board, TETROMINOES.I.rotations[0], 3, ROWS - 3, 1)

    expect(board[ROWS - 2].slice(3, 7)).toEqual([1, 1, 1, 1])
    expect(board[ROWS - 2][0]).toBe(0)
    expect(board[ROWS - 1].every((cell) => cell === 0)).toBe(true)
  })

  it('stamps every filled cell exactly once', () => {
    const board = createBoard()

    merge(board, TETROMINOES.T.rotations[0], 3, 0, 4)

    expect(board.flat().filter((cell) => cell === 4)).toHaveLength(4)
  })
})

describe('clearLines', () => {
  function fullBoard(): number[][] {
    return Array.from({ length: ROWS }, () => Array<number>(COLS).fill(1))
  }

  it('returns 0 when no row is full', () => {
    const board = createBoard()

    expect(clearLines(board)).toBe(0)
  })

  it('clears one full row and keeps the board sized', () => {
    const board = createBoard()
    board[ROWS - 1] = Array<number>(COLS).fill(2)

    expect(clearLines(board)).toBe(1)
    expect(board).toHaveLength(ROWS)
    expect(board.every((row) => row.every((cell) => cell === 0))).toBe(true)
  })

  it('pulls the rows above down', () => {
    const board = createBoard()
    board[ROWS - 2][0] = 5 // marker cell, not a full row
    board[ROWS - 1] = Array<number>(COLS).fill(2)

    clearLines(board)

    expect(board[ROWS - 1][0]).toBe(5)
    expect(board[ROWS - 1].slice(1).every((cell) => cell === 0)).toBe(true)
    expect(board[ROWS - 2].every((cell) => cell === 0)).toBe(true)
  })

  it('clears every full row, not just one', () => {
    const board = fullBoard()

    expect(clearLines(board)).toBe(ROWS)
    expect(board.every((row) => row.every((cell) => cell === 0))).toBe(true)
  })

  it('leaves a board with an empty cell in the bottom row intact', () => {
    const board = fullBoard()
    board[ROWS - 1][0] = 0

    expect(clearLines(board)).toBe(ROWS - 1)
  })
})
