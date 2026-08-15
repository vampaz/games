import type { GameCallbacks, GameStatus } from '@/interfaces/game'
import { BALL_BASE_SPEED, GAME_HEIGHT, GAME_WIDTH, PADDLE_SPEED } from './constants'
import { bounceOffPaddle, createBall, launchBall } from './ball'
import { createPaddle, movePaddle, setPaddleX } from './paddle'

const MAX_FRAME_DT = 1 / 30

export class ArkanoidGame {
  status: GameStatus = 'idle'

  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private callbacks: GameCallbacks

  private paddle = createPaddle()
  private ball = createBall(GAME_WIDTH / 2, GAME_HEIGHT - 80)
  private keys = { left: false, right: false }

  private rafId = 0
  private lastTime = 0
  private running = false

  constructor(canvas: HTMLCanvasElement, callbacks: GameCallbacks) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D context is not available')
    this.ctx = ctx
    this.callbacks = callbacks

    const dpr = window.devicePixelRatio || 1
    canvas.width = GAME_WIDTH * dpr
    canvas.height = GAME_HEIGHT * dpr
    ctx.scale(dpr, dpr)

    canvas.addEventListener('mousemove', this.handleMouseMove)
    canvas.addEventListener('touchmove', this.handleTouchMove, { passive: false })
    canvas.addEventListener('mousedown', this.handleClick)
    canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false })
    window.addEventListener('keydown', this.handleKeyDown)
    window.addEventListener('keyup', this.handleKeyUp)
  }

  start(): void {
    if (this.running) return
    this.running = true
    this.setStatus('ready')
    this.lastTime = performance.now()
    this.rafId = requestAnimationFrame(this.loop)
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
  }

  private loop = (time: number): void => {
    if (!this.running) return
    const dt = Math.min((time - this.lastTime) / 1000, MAX_FRAME_DT)
    this.lastTime = time
    this.update(dt)
    this.render()
    this.rafId = requestAnimationFrame(this.loop)
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

    this.collideWalls()
    this.collidePaddle()
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
      this.resetBallToPaddle()
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

  private resetBallToPaddle(): void {
    this.setStatus('ready')
  }

  private setStatus(status: GameStatus): void {
    this.status = status
    this.callbacks.onStatus(status)
  }

  private action(): void {
    if (this.status === 'idle') this.start()
    else if (this.status === 'ready') {
      launchBall(this.ball, BALL_BASE_SPEED)
      this.setStatus('playing')
    }
  }

  private pointerToGameX(clientX: number): number {
    const rect = this.canvas.getBoundingClientRect()
    return ((clientX - rect.left) / rect.width) * GAME_WIDTH
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
    this.action()
  }

  private handleTouchStart = (event: TouchEvent): void => {
    event.preventDefault()
    const touch = event.touches[0]
    if (touch) setPaddleX(this.paddle, this.pointerToGameX(touch.clientX))
    this.action()
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (event.code === 'ArrowLeft' || event.code === 'KeyA') this.keys.left = true
    if (event.code === 'ArrowRight' || event.code === 'KeyD') this.keys.right = true
    if (event.code === 'Space' || event.code === 'Enter') {
      event.preventDefault()
      this.action()
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

    this.renderPaddle()
    this.renderBall()
  }

  private renderPaddle(): void {
    const { x, y, width, height } = this.paddle
    this.ctx.fillStyle = '#e2e8f0'
    roundRect(this.ctx, x - width / 2, y - height / 2, width, height, height / 2)
    this.ctx.fill()
  }

  private renderBall(): void {
    const { x, y } = this.ball.position
    this.ctx.fillStyle = '#f8fafc'
    this.ctx.beginPath()
    this.ctx.arc(x, y, this.ball.radius, 0, Math.PI * 2)
    this.ctx.fill()
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
