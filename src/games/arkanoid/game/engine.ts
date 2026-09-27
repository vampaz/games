import type { Brick, GameCallbacks, GameStatus, Vec2 } from '@/games/arkanoid/interfaces/game'
import {
  BALL_BASE_SPEED,
  BALL_LEVEL_SPEED_BONUS,
  BALL_MAX_SPEED,
  BALL_RADIUS,
  GAME_HEIGHT,
  GAME_WIDTH,
  PADDLE_HEIGHT,
  PADDLE_SPEED,
  PADDLE_Y,
  START_LIVES,
} from './constants'
import { bounceOffPaddle, createBall, launchBall } from './ball'
import { countAliveBricks, createBricks } from './bricks'
import { resolveBallBrick } from './collision'
import { createPaddle, movePaddle, setPaddleX } from './paddle'

const MAX_FRAME_DT = 1 / 30
// Retina crispness without the pixel cost of 3x displays
const MAX_DPR = 2
const TRAIL_LENGTH = 10
// Clear area around pre-rendered glows so the shadow blur is never clipped
const GLOW_MARGIN = 32

export class ArkanoidGame {
  status: GameStatus = 'idle'

  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private callbacks: GameCallbacks
  private dpr: number

  private paddle = createPaddle()
  private ball = createBall(GAME_WIDTH / 2, PADDLE_Y - PADDLE_HEIGHT / 2 - BALL_RADIUS)
  private bricks: Brick[] = []
  private aliveBricks = 0
  private trail: Vec2[]
  private trailCursor = 0
  private trailLength = 0
  private score = 0
  private lives = START_LIVES
  private level = 1
  private keys = { left: false, right: false }

  private gridLayer: HTMLCanvasElement
  private brickLayer: HTMLCanvasElement
  private ballSprite: HTMLCanvasElement
  private paddleSprite: HTMLCanvasElement

  private rafId = 0
  private lastTime = 0
  private running = false
  private cachedRect: DOMRect | null = null

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
    canvas.addEventListener('touchmove', this.handleTouchMove, { passive: false })
    canvas.addEventListener('mousedown', this.handleClick)
    canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false })
    window.addEventListener('keydown', this.handleKeyDown)
    window.addEventListener('keyup', this.handleKeyUp)
    window.addEventListener('resize', this.handleResize)
    window.addEventListener('scroll', this.handleResize, { passive: true })

    this.trail = Array.from({ length: TRAIL_LENGTH }, () => ({ x: 0, y: 0 }))
    this.gridLayer = this.createLayer(GAME_WIDTH, GAME_HEIGHT)
    this.brickLayer = this.createLayer(GAME_WIDTH, GAME_HEIGHT)
    this.ballSprite = this.createBallSprite()
    this.paddleSprite = this.createPaddleSprite()

    this.renderGridLayer()
    this.bricks = createBricks(this.level)
    this.aliveBricks = countAliveBricks(this.bricks)
    this.renderBrickLayer()

    this.render()
  }

  /** Context-dependent primary input (space / click / button). */
  primaryAction(): void {
    if (this.status === 'idle') {
      this.resetGame()
      this.setStatus('ready')
    } else if (this.status === 'ready') {
      launchBall(this.ball, this.ballSpeed())
      this.setStatus('playing')
    } else if (this.status === 'gameover') {
      this.resetGame()
      this.setStatus('ready')
    } else if (this.status === 'levelcomplete') {
      this.nextLevel()
    }
  }

  private resetGame(): void {
    this.score = 0
    this.lives = START_LIVES
    this.level = 1
    this.loadLevel()
    this.emitHud()
  }

  destroy(): void {
    this.running = false
    cancelAnimationFrame(this.rafId)
    const canvas = this.canvas
    canvas.removeEventListener('mousemove', this.handleMouseMove)
    canvas.removeEventListener('touchmove', this.handleTouchMove)
    canvas.removeEventListener('mousedown', this.handleClick)
    canvas.removeEventListener('touchstart', this.handleTouchStart)
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
   * The animation loop only runs while the ball can move. In idle, game
   * over and level-complete states a single static frame is rendered and
   * the loop stops, so the screen (and its backdrop blur) costs nothing.
   */
  private syncLoop(): void {
    const shouldRun = this.status === 'ready' || this.status === 'playing'
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
    const keyDelta = (this.keys.right ? 1 : 0) - (this.keys.left ? 1 : 0)
    if (keyDelta !== 0) movePaddle(this.paddle, keyDelta * PADDLE_SPEED * dt)

    if (this.status === 'ready') {
      this.ball.position.x = this.paddle.x
      this.ball.position.y = this.paddle.y - this.paddle.height / 2 - this.ball.radius
      return
    }

    if (this.status !== 'playing') return

    const ball = this.ball
    ball.position.x += ball.velocity.x * dt
    ball.position.y += ball.velocity.y * dt

    this.pushTrail()
    this.collideWalls()
    this.collidePaddle()
    this.collideBricks()
  }

  private pushTrail(): void {
    const point = this.trail[this.trailCursor]
    point.x = this.ball.position.x
    point.y = this.ball.position.y
    this.trailCursor = (this.trailCursor + 1) % TRAIL_LENGTH
    if (this.trailLength < TRAIL_LENGTH) this.trailLength += 1
  }

  private clearTrail(): void {
    this.trailLength = 0
    this.trailCursor = 0
  }

  private collideWalls(): void {
    const ball = this.ball
    if (ball.position.x - ball.radius < 0) {
      ball.position.x = ball.radius
      ball.velocity.x = Math.abs(ball.velocity.x)
    } else if (ball.position.x + ball.radius > GAME_WIDTH) {
      ball.position.x = GAME_WIDTH - ball.radius
      ball.velocity.x = -Math.abs(ball.velocity.x)
    }

    if (ball.position.y - ball.radius < 0) {
      ball.position.y = ball.radius
      ball.velocity.y = Math.abs(ball.velocity.y)
    }

    if (ball.position.y - ball.radius > GAME_HEIGHT) {
      this.loseLife()
    }
  }

  private collidePaddle(): void {
    const ball = this.ball
    const paddle = this.paddle
    if (ball.velocity.y <= 0) return

    const withinX = Math.abs(ball.position.x - paddle.x) <= paddle.width / 2 + ball.radius
    const crossedTop =
      ball.position.y + ball.radius >= paddle.y - paddle.height / 2 &&
      ball.position.y - ball.radius <= paddle.y + paddle.height / 2

    if (withinX && crossedTop) {
      ball.position.y = paddle.y - paddle.height / 2 - ball.radius
      bounceOffPaddle(ball, paddle)
    }
  }

  private collideBricks(): void {
    const ball = this.ball
    for (const brick of this.bricks) {
      if (!brick.alive) continue
      const hit = resolveBallBrick(ball, brick)
      if (!hit) continue

      if (hit.axis === 'x') {
        ball.velocity.x = hit.signX * Math.abs(ball.velocity.x)
        ball.position.x = hit.signX < 0 ? brick.x - ball.radius : brick.x + brick.width + ball.radius
      } else {
        ball.velocity.y = hit.signY * Math.abs(ball.velocity.y)
        ball.position.y = hit.signY < 0 ? brick.y - ball.radius : brick.y + brick.height + ball.radius
      }

      this.damageBrick(brick)
      break // one brick per frame keeps the physics stable
    }
  }

  private damageBrick(brick: Brick): void {
    brick.hitsLeft -= 1
    if (brick.hitsLeft > 0) {
      this.renderBrickLayer()
      return
    }

    brick.alive = false
    this.aliveBricks -= 1
    this.score += brick.points
    this.renderBrickLayer()
    this.emitHud()

    if (this.aliveBricks === 0) this.setStatus('levelcomplete')
  }

  private loseLife(): void {
    this.lives -= 1
    this.emitHud()
    this.setStatus(this.lives <= 0 ? 'gameover' : 'ready')
  }

  private nextLevel(): void {
    this.level += 1
    this.loadLevel()
    this.emitHud()
    this.setStatus('ready')
  }

  private loadLevel(): void {
    this.bricks = createBricks(this.level)
    this.aliveBricks = countAliveBricks(this.bricks)
    this.renderBrickLayer()
  }

  private ballSpeed(): number {
    return Math.min(BALL_BASE_SPEED + (this.level - 1) * BALL_LEVEL_SPEED_BONUS, BALL_MAX_SPEED)
  }

  private emitHud(): void {
    this.callbacks.onHud({ score: this.score, lives: this.lives, level: this.level })
  }

  private setStatus(status: GameStatus): void {
    this.status = status
    if (status !== 'playing') this.clearTrail()
    this.callbacks.onStatus(status)
    this.syncLoop()
  }

  private pointerToGameX(clientX: number): number {
    const rect = this.cachedRect ?? (this.cachedRect = this.canvas.getBoundingClientRect())
    return ((clientX - rect.left) / rect.width) * GAME_WIDTH
  }

  private handleResize = (): void => {
    this.cachedRect = null
  }

  private handleMouseMove = (event: MouseEvent): void => {
    setPaddleX(this.paddle, this.pointerToGameX(event.clientX))
  }

  private handleTouchMove = (event: TouchEvent): void => {
    event.preventDefault()
    const touch = event.touches[0]
    if (touch) setPaddleX(this.paddle, this.pointerToGameX(touch.clientX))
  }

  private handleClick = (): void => {
    this.primaryAction()
  }

  private handleTouchStart = (event: TouchEvent): void => {
    event.preventDefault()
    const touch = event.touches[0]
    if (touch) setPaddleX(this.paddle, this.pointerToGameX(touch.clientX))
    this.primaryAction()
  }

  private isInteractiveTarget(target: EventTarget | null): boolean {
    return target instanceof HTMLElement && target.closest('button, a, input, select, textarea') !== null
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    // Let buttons and form controls keep their native keyboard behavior
    if (this.isInteractiveTarget(event.target)) return
    if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
      event.preventDefault()
      this.keys.left = true
    }
    if (event.code === 'ArrowRight' || event.code === 'KeyD') {
      event.preventDefault()
      this.keys.right = true
    }
    if (event.code === 'Space' || event.code === 'Enter') {
      event.preventDefault()
      this.primaryAction()
    }
  }

  private handleKeyUp = (event: KeyboardEvent): void => {
    if (event.code === 'ArrowLeft' || event.code === 'KeyA') this.keys.left = false
    if (event.code === 'ArrowRight' || event.code === 'KeyD') this.keys.right = false
  }

  private render(): void {
    const ctx = this.ctx
    ctx.fillStyle = '#0b1020'
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

    ctx.drawImage(this.gridLayer, 0, 0, GAME_WIDTH, GAME_HEIGHT)
    ctx.drawImage(this.brickLayer, 0, 0, GAME_WIDTH, GAME_HEIGHT)

    this.renderTrail()

    const { x, y, width, height } = this.paddle
    ctx.drawImage(
      this.paddleSprite,
      x - width / 2 - GLOW_MARGIN,
      y - height / 2 - GLOW_MARGIN,
      width + GLOW_MARGIN * 2,
      height + GLOW_MARGIN * 2,
    )

    const { x: bx, y: by } = this.ball.position
    const r = this.ball.radius
    ctx.drawImage(
      this.ballSprite,
      bx - r - GLOW_MARGIN,
      by - r - GLOW_MARGIN,
      (r + GLOW_MARGIN) * 2,
      (r + GLOW_MARGIN) * 2,
    )
  }

  private renderGridLayer(): void {
    const ctx = this.layerContext(this.gridLayer)
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.05)'
    ctx.lineWidth = 1
    for (let y = 40; y < GAME_HEIGHT; y += 40) {
      ctx.beginPath()
      ctx.moveTo(0, y + 0.5)
      ctx.lineTo(GAME_WIDTH, y + 0.5)
      ctx.stroke()
    }
  }

  private renderBrickLayer(): void {
    const ctx = this.layerContext(this.brickLayer)
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
    for (const brick of this.bricks) {
      if (!brick.alive) continue

      ctx.fillStyle = brick.color
      roundRect(ctx, brick.x, brick.y, brick.width, brick.height, 4)
      ctx.fill()

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)'
      ctx.lineWidth = 1
      ctx.stroke()

      if (brick.hitsLeft < brick.maxHits) {
        const damage = 1 - brick.hitsLeft / brick.maxHits
        ctx.fillStyle = `rgba(0, 0, 0, ${0.3 * damage})`
        roundRect(ctx, brick.x, brick.y, brick.width, brick.height, 4)
        ctx.fill()
      }
    }
  }

  private renderTrail(): void {
    if (this.trailLength === 0) return
    const ctx = this.ctx
    const { radius } = this.ball
    for (let i = 0; i < this.trailLength; i++) {
      const index = (this.trailCursor - this.trailLength + i + TRAIL_LENGTH) % TRAIL_LENGTH
      const point = this.trail[index]
      const t = (i + 1) / this.trailLength
      ctx.fillStyle = `rgba(248, 250, 252, ${0.16 * t})`
      ctx.beginPath()
      ctx.arc(point.x, point.y, radius * (0.4 + 0.6 * t), 0, Math.PI * 2)
      ctx.fill()
    }
  }

  private createLayer(width: number, height: number): HTMLCanvasElement {
    const layer = document.createElement('canvas')
    layer.width = Math.round(width * this.dpr)
    layer.height = Math.round(height * this.dpr)
    this.layerContext(layer).scale(this.dpr, this.dpr)
    return layer
  }

  private createBallSprite(): HTMLCanvasElement {
    const { radius } = this.ball
    const size = (radius + GLOW_MARGIN) * 2
    const sprite = this.createLayer(size, size)
    const ctx = this.layerContext(sprite)
    ctx.shadowColor = 'rgba(248, 250, 252, 0.6)'
    ctx.shadowBlur = 12
    ctx.fillStyle = '#f8fafc'
    ctx.beginPath()
    ctx.arc(radius + GLOW_MARGIN, radius + GLOW_MARGIN, radius, 0, Math.PI * 2)
    ctx.fill()
    return sprite
  }

  private createPaddleSprite(): HTMLCanvasElement {
    const { width, height } = this.paddle
    const sprite = this.createLayer(width + GLOW_MARGIN * 2, height + GLOW_MARGIN * 2)
    const ctx = this.layerContext(sprite)
    ctx.shadowColor = 'rgba(226, 232, 240, 0.45)'
    ctx.shadowBlur = 14
    ctx.fillStyle = '#e2e8f0'
    roundRect(ctx, GLOW_MARGIN, GLOW_MARGIN, width, height, height / 2)
    ctx.fill()
    return sprite
  }

  private layerContext(layer: HTMLCanvasElement): CanvasRenderingContext2D {
    const ctx = layer.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D context is not available')
    return ctx
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + width, y, x + width, y + height, radius)
  ctx.arcTo(x + width, y + height, x, y + height, radius)
  ctx.arcTo(x, y + height, x, y, radius)
  ctx.arcTo(x, y, x + width, y, radius)
  ctx.closePath()
}
