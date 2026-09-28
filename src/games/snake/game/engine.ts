import type {
  Direction,
  GameCallbacks,
  GameStatus,
  SnakeState,
} from '@/games/snake/interfaces/game'
import { BEST_KEY, COLS, GAME_HEIGHT, GAME_WIDTH, ROWS } from './constants'
import { createGame, intervalFor, setDirection, step } from './snake'
import { SnakeSound } from './sound'

const MAX_FRAME_DT = 1 / 10
const MAX_DPR = 2
const SWIPE_MIN = 24

// Two-tone LCD homage: dark ink on a green-tinted background, like the
// Nokia 6110's monochrome display. Exact hardware tint is undocumented;
// these values approximate the remembered look.
const LCD_BG = '#a8b68f'
const LCD_INK = '#232a1e'

export class SnakeGame {
  status: GameStatus = 'idle'

  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private callbacks: GameCallbacks

  private state = createGame(COLS, ROWS)
  private best = 0
  // Armanto's grace-delay: driving into the wall grants one extra beat to
  // turn away before the crash counts. Re-armed by every successful step.
  private graceArmed = true

  private accumulator = 0
  private touchStart: { x: number; y: number } | null = null

  private sound = new SnakeSound()

  private rafId = 0
  private lastTime = 0
  private running = false

  constructor(canvas: HTMLCanvasElement, callbacks: GameCallbacks) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D context is not available')
    this.ctx = ctx
    this.callbacks = callbacks

    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
    canvas.width = Math.round(GAME_WIDTH * dpr)
    canvas.height = Math.round(GAME_HEIGHT * dpr)
    ctx.scale(dpr, dpr)

    this.best = readBest()
    this.emitHud()

    canvas.addEventListener('mousedown', this.handleMouseDown)
    canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false })
    canvas.addEventListener('touchmove', this.handleTouchMove, { passive: false })
    canvas.addEventListener('touchend', this.handleTouchEnd)
    window.addEventListener('keydown', this.handleKeyDown)

    this.render()
  }

  /** Context-dependent primary input (space / enter / click / button). */
  primaryAction(): void {
    this.sound.unlock()
    if (this.status === 'idle' || this.status === 'gameover') {
      this.start()
    } else if (this.status === 'paused') {
      this.setStatus('playing')
    }
  }

  destroy(): void {
    this.running = false
    cancelAnimationFrame(this.rafId)
    this.sound.destroy()
    const canvas = this.canvas
    canvas.removeEventListener('mousedown', this.handleMouseDown)
    canvas.removeEventListener('touchstart', this.handleTouchStart)
    canvas.removeEventListener('touchmove', this.handleTouchMove)
    canvas.removeEventListener('touchend', this.handleTouchEnd)
    window.removeEventListener('keydown', this.handleKeyDown)
  }

  private start(): void {
    this.state = createGame(COLS, ROWS)
    this.accumulator = 0
    this.graceArmed = true
    this.emitHud()
    this.setStatus('playing')
  }

  private loop = (time: number): void => {
    if (!this.running) return
    const dt = Math.min((time - this.lastTime) / 1000, MAX_FRAME_DT)
    this.lastTime = time
    this.update(dt)
    this.render()
    if (this.running) this.rafId = requestAnimationFrame(this.loop)
  }

  /**
   * The animation loop only runs while the snake can move. In the other
   * states a single static frame is rendered and the loop stops.
   */
  private syncLoop(): void {
    const shouldRun = this.status === 'playing'
    if (shouldRun) {
      if (this.running) return
      this.running = true
      this.lastTime = performance.now()
      this.rafId = requestAnimationFrame(this.loop)
    } else if (this.running) {
      this.running = false
      cancelAnimationFrame(this.rafId)
      this.render()
    }
  }

  private update(dt: number): void {
    if (this.status !== 'playing') return
    this.accumulator += dt
    let interval = intervalFor(this.state.score)
    while (this.accumulator >= interval) {
      this.accumulator -= interval
      const result = step(this.state, COLS, ROWS)
      if (result === 'died') {
        if (this.graceArmed && this.crashedIntoWall()) {
          // One extra beat to turn away from the wall, like the original.
          this.graceArmed = false
          this.accumulator = 0
          return
        }
        this.accumulator = 0
        if (this.state.score > this.best) {
          this.best = this.state.score
          writeBest(this.best)
        }
        this.emitHud()
        this.sound.gameOver()
        this.setStatus('gameover')
        return
      }
      this.graceArmed = true
      if (result === 'ate') {
        if (this.state.score > this.best) this.best = this.state.score
        this.emitHud()
        this.sound.eat()
      }
      interval = intervalFor(this.state.score)
    }
  }

  /** True when the head sits on the edge facing outward (a wall crash). */
  private crashedIntoWall(): boolean {
    const head = this.state.snake[0]
    const direction = this.state.direction
    return (
      (direction === 'left' && head.x === 0) ||
      (direction === 'right' && head.x === COLS - 1) ||
      (direction === 'up' && head.y === 0) ||
      (direction === 'down' && head.y === ROWS - 1)
    )
  }

  private emitHud(): void {
    this.callbacks.onHud({ score: this.state.score, best: this.best })
  }

  private setStatus(status: GameStatus): void {
    this.status = status
    this.callbacks.onStatus(status)
    this.syncLoop()
  }

  private steer(direction: Direction): void {
    if (this.status !== 'playing') return
    setDirection(this.state, direction)
  }

  private togglePause(): void {
    if (this.status === 'playing') this.setStatus('paused')
    else if (this.status === 'paused') this.setStatus('playing')
  }

  private isInteractiveTarget(target: EventTarget | null): boolean {
    return target instanceof HTMLElement && target.closest('button, a, input, select, textarea') !== null
  }

  private handleMouseDown = (): void => {
    this.sound.unlock()
    this.primaryAction()
  }

  private handleTouchStart = (event: TouchEvent): void => {
    event.preventDefault()
    this.sound.unlock()
    const touch = event.touches[0]
    if (touch) this.touchStart = { x: touch.clientX, y: touch.clientY }
    if (this.status !== 'playing') this.primaryAction()
  }

  private handleTouchMove = (event: TouchEvent): void => {
    event.preventDefault()
    const touch = event.touches[0]
    if (!touch || !this.touchStart) return
    const dx = touch.clientX - this.touchStart.x
    const dy = touch.clientY - this.touchStart.y
    if (Math.abs(dx) < SWIPE_MIN && Math.abs(dy) < SWIPE_MIN) return
    this.steer(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up')
    this.touchStart = { x: touch.clientX, y: touch.clientY }
  }

  private handleTouchEnd = (): void => {
    this.touchStart = null
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (this.isInteractiveTarget(event.target)) return
    const code = event.code
    // The original ran on the phone's number pad (2/4/6/8).
    if (code === 'ArrowUp' || code === 'KeyW' || code === 'Numpad8' || code === 'Digit8') {
      event.preventDefault()
      this.steer('up')
    } else if (
      code === 'ArrowDown' ||
      code === 'KeyS' ||
      code === 'Numpad2' ||
      code === 'Digit2'
    ) {
      event.preventDefault()
      this.steer('down')
    } else if (
      code === 'ArrowLeft' ||
      code === 'KeyA' ||
      code === 'Numpad4' ||
      code === 'Digit4'
    ) {
      event.preventDefault()
      this.steer('left')
    } else if (
      code === 'ArrowRight' ||
      code === 'KeyD' ||
      code === 'Numpad6' ||
      code === 'Digit6'
    ) {
      event.preventDefault()
      this.steer('right')
    } else if (code === 'Space' || code === 'Enter' || code === 'Numpad5' || code === 'Digit5') {
      event.preventDefault()
      if (!event.repeat) this.primaryAction()
    } else if (code === 'KeyP' || code === 'Escape') {
      event.preventDefault()
      if (!event.repeat) this.togglePause()
    }
    this.sound.unlock()
  }

  private render(): void {
    const ctx = this.ctx
    ctx.fillStyle = LCD_BG
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

    const cellW = GAME_WIDTH / COLS
    const cellH = GAME_HEIGHT / ROWS
    const pad = Math.min(cellW, cellH) * 0.12

    // Border walls, like the phone screen edge.
    ctx.fillStyle = LCD_INK
    const wall = Math.max(3, Math.min(cellW, cellH) * 0.14)
    ctx.fillRect(0, 0, GAME_WIDTH, wall)
    ctx.fillRect(0, GAME_HEIGHT - wall, GAME_WIDTH, wall)
    ctx.fillRect(0, 0, wall, GAME_HEIGHT)
    ctx.fillRect(GAME_WIDTH - wall, 0, wall, GAME_HEIGHT)

    const state: SnakeState = this.state
    // Food: a small dark square in the same ink as the snake.
    const foodSize = Math.min(cellW, cellH) * 0.42
    ctx.fillRect(
      (state.food.x + 0.5) * cellW - foodSize / 2,
      (state.food.y + 0.5) * cellH - foodSize / 2,
      foodSize,
      foodSize,
    )

    // Snake: uniform dark blocks with a 1px-style gap, head included.
    for (const segment of state.snake) {
      ctx.fillRect(
        segment.x * cellW + pad,
        segment.y * cellH + pad,
        cellW - pad * 2,
        cellH - pad * 2,
      )
    }
  }
}

function readBest(): number {
  try {
    const raw = localStorage.getItem(BEST_KEY)
    const value = raw === null ? 0 : Number.parseInt(raw, 10)
    return Number.isFinite(value) && value > 0 ? value : 0
  } catch {
    return 0
  }
}

function writeBest(best: number): void {
  try {
    localStorage.setItem(BEST_KEY, String(best))
  } catch {
    // Private mode or disabled storage: best score simply doesn't persist.
  }
}
