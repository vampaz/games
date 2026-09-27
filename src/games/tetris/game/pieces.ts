import type { PieceId, PieceMatrix, Tetromino } from '@/games/tetris/interfaces/game'

export const PIECE_IDS: readonly PieceId[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L']

// Spawn orientation of each tetromino, 1 = filled cell.
const SHAPES: Record<PieceId, PieceMatrix> = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
}

// The classic NES palette, one hue per piece (NTSC values, slightly muted)
const COLORS: Record<PieceId, string> = {
  I: '#00c8c8',
  O: '#c8c800',
  T: '#9c009c',
  S: '#00c800',
  Z: '#c80000',
  J: '#0000c8',
  L: '#c85c00',
}

/** Rotate a matrix 90° clockwise. */
export function rotateCW(cells: PieceMatrix): PieceMatrix {
  return cells[0].map((_, col) => cells.map((row) => row[col]).reverse())
}

function buildTetrominoes(): Record<PieceId, Tetromino> {
  const tetrominoes = {} as Record<PieceId, Tetromino>
  for (const id of PIECE_IDS) {
    const rotations: PieceMatrix[] = [SHAPES[id]]
    for (let i = 0; i < 3; i++) rotations.push(rotateCW(rotations[i]))
    tetrominoes[id] = { id, color: COLORS[id], rotations }
  }
  return tetrominoes
}

export const TETROMINOES = buildTetrominoes()

export function getTetromino(id: PieceId): Tetromino {
  return TETROMINOES[id]
}

/** Trim empty rows and columns so previews render centered and compact. */
export function trimCells(cells: PieceMatrix): PieceMatrix {
  const hasCell = (row: number[]): boolean => row.some((value) => value === 1)
  const rows = cells.filter(hasCell)
  let start = -1
  let end = -1
  for (const row of rows) {
    row.forEach((value, index) => {
      if (value !== 1) return
      if (start < 0 || index < start) start = index
      if (index > end) end = index
    })
  }
  if (start < 0) return []
  return rows.map((row) => row.slice(start, end + 1))
}
