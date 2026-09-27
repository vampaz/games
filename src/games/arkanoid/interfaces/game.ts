export interface Vec2 {
  x: number
  y: number
}

export type GameStatus = 'idle' | 'ready' | 'playing' | 'gameover' | 'levelcomplete'

export interface Ball {
  position: Vec2
  velocity: Vec2
  radius: number
}

export interface Paddle {
  x: number
  y: number
  width: number
  height: number
}

export interface Brick {
  x: number
  y: number
  width: number
  height: number
  hitsLeft: number
  maxHits: number
  points: number
  color: string
  alive: boolean
}

/** Response of a ball/brick collision: the axis to reflect on and the direction to travel afterwards. */
export interface BrickCollision {
  axis: 'x' | 'y'
  /** Travel direction on x after the bounce (-1 or 1; 0 when axis is 'y'). */
  signX: number
  /** Travel direction on y after the bounce (-1 or 1; 0 when axis is 'x'). */
  signY: number
}

export interface HudState {
  score: number
  lives: number
  level: number
}

export interface GameCallbacks {
  onHud(hud: HudState): void
  onStatus(status: GameStatus): void
}
