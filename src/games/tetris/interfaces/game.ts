export type PieceId = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L'

/** Tetromino shape for one rotation state; 1 = filled cell. */
export type PieceMatrix = number[][]

export interface Tetromino {
  id: PieceId
  color: string
  /** All four rotation states, index 0 is the spawn orientation. */
  rotations: PieceMatrix[]
}

export type GameStatus = 'idle' | 'playing' | 'paused' | 'getready' | 'gameover'

export interface HudState {
  score: number
  level: number
  lines: number
  next: PieceId
}

export interface GameCallbacks {
  onHud(hud: HudState): void
  onStatus(status: GameStatus): void
}
