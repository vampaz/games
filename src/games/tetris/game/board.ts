import type { PieceMatrix } from '@/games/tetris/interfaces/game'
import { COLS, ROWS } from './constants'

/** Grid of settled cells, row-major. 0 = empty, otherwise the 1-based index of the piece id. */
export type Board = number[][]

export function createBoard(): Board {
  return Array.from({ length: ROWS }, () => Array<number>(COLS).fill(0))
}

/** Whether a piece matrix positioned at (x, y) fits on the board without overlap. */
export function canPlace(board: Board, cells: PieceMatrix, x: number, y: number): boolean {
  for (let row = 0; row < cells.length; row++) {
    for (let col = 0; col < cells[row].length; col++) {
      if (cells[row][col] !== 1) continue
      const bx = x + col
      const by = y + row
      if (bx < 0 || bx >= COLS || by < 0 || by >= ROWS) return false
      if (board[by][bx] !== 0) return false
    }
  }
  return true
}

/** Stamp a piece into the board in place (mutates) and return it. */
export function merge(board: Board, cells: PieceMatrix, x: number, y: number, pieceIndex: number): Board {
  for (let row = 0; row < cells.length; row++) {
    for (let col = 0; col < cells[row].length; col++) {
      if (cells[row][col] !== 1) continue
      const bx = x + col
      const by = y + row
      if (bx < 0 || bx >= COLS || by < 0 || by >= ROWS) continue
      board[by][bx] = pieceIndex
    }
  }
  return board
}

/** Remove full rows, pulling the rows above down (mutates). Returns the number of rows cleared. */
export function clearLines(board: Board): number {
  let cleared = 0
  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[row].every((cell) => cell !== 0)) {
      board.splice(row, 1)
      board.unshift(Array<number>(COLS).fill(0))
      cleared += 1
      // The row that just slid into this slot still needs checking
      row += 1
    }
  }
  return cleared
}
