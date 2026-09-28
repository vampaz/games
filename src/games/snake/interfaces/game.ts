export interface Cell {
  x: number
  y: number
}

export type Direction = 'up' | 'down' | 'left' | 'right'

export type GameStatus = 'idle' | 'playing' | 'paused' | 'gameover'

export interface SnakeState {
  /** Head first; body follows. Coordinates are grid cells. */
  snake: Cell[]
  /** Direction applied on the last step. */
  direction: Direction
  /** Next direction to apply; inputs write here so fast turns can't 180. */
  queuedDirection: Direction
  food: Cell
  score: number
  alive: boolean
}

export interface HudState {
  score: number
  best: number
}

export interface GameCallbacks {
  onHud(hud: HudState): void
  onStatus(status: GameStatus): void
}
