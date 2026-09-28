import type { Ball, GameCallbacks, GameStatus, Paddle, Scores } from '@/games/pong/interfaces/game'
import {
  BALL_SIZE,
  DASH_OFF,
  DASH_ON,
  DASH_WIDTH,
  GAME_HEIGHT,
  GAME_WIDTH,
  PADDLE_MARGIN,
  PADDLE_SPEED,
  PADDLE_WIDTH,
  SCORE_CENTER_GAP,
  SCORE_DIGIT_GAP,
  SCORE_DIGIT_HEIGHT,
  SCORE_DIGIT_WIDTH,
  SCORE_SEGMENT,
  SCORE_TOP,
  SERVE_DELAY,
} from './constants'
import { advanceBall, bounceWalls, createBall, hitPaddle, launchBall, rallySpeed } from './ball'
import { createPaddle, movePaddle } from './paddle'
import { aiPaddleStep } from './ai'
import { pointFor, winningSide } from './scoring'
import { PongSound } from './sound'

const MAX_FRAME_DT = 1 / 30
// Retina crispness without the pixel cost of 3x displays
const MAX_DPR = 2
// The original Pong was pure white on pure black
const WHITE = '#ffffff'

// Lit segments for each digit, order: a, b, c, d, e, f, g
const DIGIT_SEGMENTS: boolean[][] = [
  [true, true, true, true, true, true, false], // 0
  [false, true, true, false, false, false, false], // 1
  [true, true, false, true, true, false, true], // 2
  [true, true, true, true, false, false, true], // 3
  [false, true, true, false, false, true, true], // 4
  [true, false, true, true, false, true, true], // 5
  [true, false, true, true, true, true, true], // 6
  [true, true, true, false, false, false, false], // 7
  [true, true, true, true, true, true, true], // 8
  [true, true, true, true, false, true, true], // 9
]

export class PongGame {
  status: GameStatus = 'idle'

  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private callbacks: GameCallbacks
  private dpr: number

  private ball = createBall(GAME_WIDTH / 2, GAME_HEIGHT / 2, BALL_SIZE)
  private playerPaddle = createPaddle(PADDLE_MARGIN + PADDLE_WIDTH / 2)
  private aiPaddle = createPaddle(GAME_WIDTH - PADDLE_MARGIN - PADDLE_WIDTH / 2)
  private scores: Scores = { player: 0, ai: 0 }

  private keys = { up: false, down: false }
  private serveTimer = 0
  private serveDirection: 1 | -1 = 1
  private rallyHits = 0
  private pausedFrom: 'serving' | 'playing' = 'playing'

  private sound = new PongSound()

  private cachedRect: DOMRect | null = null

  private rafId = 0
  private lastTime = 0
  private running = false

  constructor(canvas: HTMLCanvasElement, callbacks: GameCallbacks) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D context is not available')
    this.ctx = ctx
    this.callbacks = callbacks

    this.dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
    canvas.width = Math.round(GAME_WIDTH * this.dpr)
    canvas.height = Math.round(GAME_HEIGHT * this.dpr)
    ctx.scale(this.dpr, this.dpr)

    canvas.addEventListener('mousemove', this.handleMouseMove)
    canvas.addEventListener('mousedown', this.handleMouseDown)
    canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false })
    canvas.addEventListener('touchmove', this.handleTouchMove, { passive: false })
    window.addEventListener('keydown', this.handleKeyDown)
    window.addEventListener('keyup', this.handleKeyUp)
    window.addEventListener('resize', this.handleResize)
    window.addEventListener('scroll', this.handleResize, { passive: true })

    this.render()
  }

  /** Context-dependent primary input (space / enter / click / button). */
  primaryAction(): void {
    // Every path that gets the ball moving starts from a user gesture, so this
    // also unlocks audio (browsers only allow sound after a gesture).
    this.sound.unlock()
    if (this.status === 'idle' || this.status === 'gameover') {
      this.startMatch()
    } else if (this.status === 'paused') {
      this.setStatus(this.pausedFrom)
    }
  }

  private startMatch(): void {
    this.scores = { player: 0, ai: 0 }
    this.playerPaddle.y = GAME_HEIGHT / 2
    this.aiPaddle.y = GAME_HEIGHT / 2
    this.beginServe(Math.random() < 0.5 ? 1 : -1)
    this.emitHud()
  }

  destroy(): void {
    this.running = false
    cancelAnimationFrame(this.rafId)
    this.sound.destroy()
    const canvas = this.canvas
    canvas.removeEventListener('mousemove', this.handleMouseMove)
    canvas.removeEventListener('mousedown', this.handleMouseDown)
    canvas.removeEventListener('touchstart', this.handleTouchStart)
    canvas.removeEventListener('touchmove', this.handleTouchMove)
    window.removeEventListener('keydown', this.handleKeyDown)
    window.removeEventListener('keyup', this.handleKeyUp)
    window.removeEventListener('resize', this.handleResize)
    window.removeEventListener('scroll', this.handleResize)
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
   * The animation loop only runs while the ball can move. In the other
   * states a single static frame is rendered and the loop stops, so the
   * screen (and its backdrop blur) costs nothing.
   */
  private syncLoop(): void {
    const shouldRun = this.status === 'serving' || this.status === 'playing'
    if (shouldRun) {
      if (this.running) return
      this.running = true
      this.lastTime = performance.now()
      this.rafId = requestAnimationFrame(this.loop)
    } else if (this.running) {
      this.running = false
      cancelAnimationFrame(this.rafId)
    }
  }

  private update(dt: number): void {
    const keyDelta = (this.keys.down ? 1 : 0) - (this.keys.up ? 1 : 0)
    if (keyDelta !== 0) movePaddle(this.playerPaddle, keyDelta * PADDLE_SPEED * dt)

    if (this.status === 'serving') {
      this.serveTimer += dt
      movePaddle(this.aiPaddle, aiPaddleStep(this.ball, this.aiPaddle, dt))
      if (this.serveTimer >= SERVE_DELAY) {
        launchBall(this.ball, this.serveDirection, rallySpeed(0))
        this.setStatus('playing')
      }
      return
    }

    if (this.status !== 'playing') return

    advanceBall(this.ball, dt)
    movePaddle(this.aiPaddle, aiPaddleStep(this.ball, this.aiPaddle, dt))

    if (bounceWalls(this.ball)) this.sound.wallHit()
    if (this.strikePaddle(this.ball, this.aiPaddle, 1)) this.sound.paddleHit()
    if (this.strikePaddle(this.ball, this.playerPaddle, -1)) this.sound.paddleHit()

    const half = this.ball.size / 2
    if (this.ball.position.x + half < 0) {
      this.awardPoint('ai')
    } else if (this.ball.position.x - half > GAME_WIDTH) {
      this.awardPoint('player')
    }
  }

  private awardPoint(side: 'player' | 'ai'): void {
    pointFor(this.scores, side)
    this.sound.score()
    this.emitHud()

    if (winningSide(this.scores)) {
      this.setStatus('gameover')
      return
    }
    // The original served the ball toward the side that just lost
    this.beginServe(side === 'ai' ? -1 : 1)
  }

  private beginServe(direction: 1 | -1): void {
    this.ball = createBall(GAME_WIDTH / 2, GAME_HEIGHT / 2, BALL_SIZE)
    this.serveDirection = direction
    this.serveTimer = 0
    this.rallyHits = 0 // missing the ball resets the speed, like the original
    this.setStatus('serving')
  }

  /** A paddle return at the current rally speed; consecutive hits step it up. */
  private strikePaddle(ball: Ball, paddle: Paddle, travel: 1 | -1): boolean {
    const struck = hitPaddle(ball, paddle, travel, rallySpeed(this.rallyHits + 1))
    if (struck) this.rallyHits += 1
    return struck
  }

  private emitHud(): void {
    this.callbacks.onHud({ player: this.scores.player, ai: this.scores.ai })
  }

  private setStatus(status: GameStatus): void {
    this.status = status
    this.callbacks.onStatus(status)
    this.syncLoop()
  }

  private pointerToGameY(clientY: number): number {
    const rect = this.cachedRect ?? (this.cachedRect = this.canvas.getBoundingClientRect())
    return ((clientY - rect.top) / rect.height) * GAME_HEIGHT
  }

  private handleResize = (): void => {
    this.cachedRect = null
  }

  private setPointerY = (clientY: number): void => {
    movePaddle(this.playerPaddle, this.pointerToGameY(clientY) - this.playerPaddle.y)
  }

  private handleMouseMove = (event: MouseEvent): void => {
    this.setPointerY(event.clientY)
  }

  private handleMouseDown = (): void => {
    this.sound.unlock()
    this.primaryAction()
  }

  private handleTouchStart = (event: TouchEvent): void => {
    event.preventDefault()
    this.sound.unlock()
    const touch = event.touches[0]
    if (touch) this.setPointerY(touch.clientY)
    this.primaryAction()
  }

  private handleTouchMove = (event: TouchEvent): void => {
    event.preventDefault()
    const touch = event.touches[0]
    if (touch) this.setPointerY(touch.clientY)
  }

  private isInteractiveTarget(target: EventTarget | null): boolean {
    return target instanceof HTMLElement && target.closest('button, a, input, select, textarea') !== null
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    // Let buttons and form controls keep their native keyboard behavior
    if (this.isInteractiveTarget(event.target)) return

    const code = event.code
    if (code === 'ArrowUp' || code === 'KeyW') {
      event.preventDefault()
      this.keys.up = true
    } else if (code === 'ArrowDown' || code === 'KeyS') {
      event.preventDefault()
      this.keys.down = true
    } else if (code === 'Space' || code === 'Enter') {
      event.preventDefault()
      if (!event.repeat) this.primaryAction()
    } else if (code === 'KeyP' || code === 'Escape') {
      event.preventDefault()
      if (!event.repeat) {
        if (this.status === 'playing' || this.status === 'serving') {
          this.pausedFrom = this.status
          this.setStatus('paused')
        } else if (this.status === 'paused') {
          this.setStatus(this.pausedFrom)
        }
      }
    } else {
      return
    }
    this.sound.unlock()
  }

  private handleKeyUp = (event: KeyboardEvent): void => {
    const code = event.code
    if (code === 'ArrowUp' || code === 'KeyW') this.keys.up = false
    if (code === 'ArrowDown' || code === 'KeyS') this.keys.down = false
  }

  private render(): void {
    const ctx = this.ctx
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

    this.renderCenterLine()
    this.renderScore()
    this.renderPaddle(this.playerPaddle)
    this.renderPaddle(this.aiPaddle)

    const { position, size } = this.ball
    ctx.fillStyle = WHITE
    ctx.fillRect(position.x - size / 2, position.y - size / 2, size, size)
  }

  private renderCenterLine(): void {
    const ctx = this.ctx
    ctx.fillStyle = WHITE
    const x = GAME_WIDTH / 2 - DASH_WIDTH / 2
    for (let y = 0; y < GAME_HEIGHT; y += DASH_ON + DASH_OFF) {
      ctx.fillRect(x, y, DASH_WIDTH, DASH_ON)
    }
  }

  private renderPaddle(paddle: Paddle): void {
    const ctx = this.ctx
    ctx.fillStyle = WHITE
    ctx.fillRect(paddle.x - paddle.width / 2, paddle.y - paddle.height / 2, paddle.width, paddle.height)
  }

  private renderScore(): void {
    const cx = GAME_WIDTH / 2

    const digitSpan = (value: number): number =>
      String(value).length * (SCORE_DIGIT_WIDTH + SCORE_DIGIT_GAP) - SCORE_DIGIT_GAP

    const playerLeft = cx - SCORE_CENTER_GAP - digitSpan(this.scores.player)
    const aiLeft = cx + SCORE_CENTER_GAP

    for (const [index, digit] of String(this.scores.player).split('').entries()) {
      this.renderDigit(Number(digit), playerLeft + index * (SCORE_DIGIT_WIDTH + SCORE_DIGIT_GAP))
    }
    for (const [index, digit] of String(this.scores.ai).split('').entries()) {
      this.renderDigit(Number(digit), aiLeft + index * (SCORE_DIGIT_WIDTH + SCORE_DIGIT_GAP))
    }
  }

  private renderDigit(value: number, left: number): void {
    const ctx = this.ctx
    const w = SCORE_DIGIT_WIDTH
    const t = SCORE_SEGMENT
    const v = (SCORE_DIGIT_HEIGHT - 3 * t) / 2
    // a: top, b: upper right, c: lower right, d: bottom, e: lower left, f: upper left, g: middle
    const rects: number[][] = [
      [0, 0, w, t],
      [w - t, 0, t, v + t],
      [w - t, v + t, t, v + t],
      [0, SCORE_DIGIT_HEIGHT - t, w, t],
      [0, v + t, t, v + t],
      [0, 0, t, v + t],
      [0, v + t, w, t],
    ]

    ctx.fillStyle = WHITE
    const segments = DIGIT_SEGMENTS[value]
    for (let i = 0; i < segments.length; i++) {
      if (!segments[i]) continue
      const [x, y, sw, sh] = rects[i]
      ctx.fillRect(left + x, SCORE_TOP + y, sw, sh)
    }
  }
}
