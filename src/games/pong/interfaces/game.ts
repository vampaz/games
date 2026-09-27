export interface Vec2 {
  x: number
  y: number
}

export type GameStatus = 'idle' | 'serving' | 'playing' | 'paused' | 'gameover'

export interface Ball {
  position: Vec2
  velocity: Vec2
  /** Side length; the original ball was a square. */
  size: number
  /** x before the last advance; lets paddle hits use a swept test instead of tunneling past. */
  previousX: number
}

export interface Paddle {
  /** Center x; fixed per side, the paddle only moves vertically. */
  x: number
  y: number
  width: number
  height: number
}

export interface Scores {
  player: number
  ai: number
}

export interface GameCallbacks {
  onHud(hud: Scores): void
  onStatus(status: GameStatus): void
}
