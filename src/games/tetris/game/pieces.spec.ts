import { describe, expect, it } from 'vitest'

import { getTetromino, PIECE_IDS, rotateCW, TETROMINOES, trimCells } from './pieces'

function countCells(cells: number[][]): number {
  return cells.flat().filter((value) => value === 1).length
}

describe('rotateCW', () => {
  it('rotates a square matrix clockwise', () => {
    const cells = [
      [1, 0],
      [0, 1],
    ]

    expect(rotateCW(cells)).toEqual([
      [0, 1],
      [1, 0],
    ])
  })

  it('rotates a non-square matrix clockwise', () => {
    const cells = [
      [1, 1, 1],
      [0, 0, 0],
    ]

    expect(rotateCW(cells)).toEqual([
      [0, 1],
      [0, 1],
      [0, 1],
    ])
  })
})

describe('TETROMINOES', () => {
  it('defines one tetromino for every piece id', () => {
    expect(Object.keys(TETROMINOES)).toEqual([...PIECE_IDS])
  })

  it('gives each piece exactly four cells in every rotation state', () => {
    for (const id of PIECE_IDS) {
      for (const rotation of TETROMINOES[id].rotations) {
        expect(countCells(rotation)).toBe(4)
      }
    }
  })

  it('covers all four rotation states', () => {
    for (const id of PIECE_IDS) {
      expect(TETROMINOES[id].rotations).toHaveLength(4)
    }
  })

  it('returns to the spawn orientation after four rotations', () => {
    for (const id of PIECE_IDS) {
      const [spawn, once, twice, three] = TETROMINOES[id].rotations
      expect(rotateCW(three)).toEqual(spawn)
      if (id !== 'O') expect(once).not.toEqual(twice)
    }
  })

  it('keeps the O piece identical across rotations', () => {
    const [a, b, c, d] = TETROMINOES.O.rotations
    expect(a).toEqual(b)
    expect(b).toEqual(c)
    expect(c).toEqual(d)
  })

  it('gives every piece a distinct color', () => {
    const colors = PIECE_IDS.map((id) => TETROMINOES[id].color)
    expect(new Set(colors).size).toBe(PIECE_IDS.length)
  })
})

describe('getTetromino', () => {
  it('returns the matching tetromino', () => {
    expect(getTetromino('S')).toBe(TETROMINOES.S)
  })
})

describe('trimCells', () => {
  it('removes empty rows and columns', () => {
    expect(trimCells(TETROMINOES.T.rotations[0])).toEqual([
      [0, 1, 0],
      [1, 1, 1],
    ])
  })

  it('collapses the I bar to a single row', () => {
    expect(trimCells(TETROMINOES.I.rotations[0])).toEqual([[1, 1, 1, 1]])
  })

  it('keeps the O square untouched', () => {
    expect(trimCells(TETROMINOES.O.rotations[0])).toEqual([
      [1, 1],
      [1, 1],
    ])
  })

  it('never drops filled cells', () => {
    for (const id of PIECE_IDS) {
      expect(countCells(trimCells(TETROMINOES[id].rotations[0]))).toBe(4)
    }
  })
})
