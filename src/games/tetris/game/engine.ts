import type { GameCallbacks, GameStatus, PieceId, PieceMatrix } from '@/games/tetris/interfaces/game'
import {
  ARE_BASE_FRAMES,
  ARE_EXTRA_FRAMES_PER_ROW_GROUP,
  ARE_ROW_GROUP_SIZE,
  CELL,
  COLS,
  DAS_DELAY,
  DAS_RESET,
  GAME_HEIGHT,
  GAME_WIDTH,
  GET_READY_DURATION,
  ROWS,
} from './constants'
import { drawFromBag } from './bag'
import { canPlace, clearLines, createBoard, merge } from './board'
import type { Board } from './board'
import { getTetromino, PIECE_IDS, TETROMINOES } from './pieces'
import { dropIntervalForLevel, levelForLines, scoreForLines } from './scoring'

const MAX_FRAME_DT = 1 / 30
// Retina crispness without the pixel cost of 3x displays
const MAX_DPR = 2
// Minimum gesture length (in CSS px) for a swipe; taps rotate
const SWIPE_THRESHOLD = 60

interface ActivePiece {
  id: PieceId
  x: number
  y: number
  rotation: number
}

export class TetrisGame {
  status: GameStatus = 'idle'

  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private callbacks: GameCallbacks
  private dpr: number

  private board: Board = createBoard()
  private active: ActivePiece | null = null
  private nextId: PieceId
  private bag: PieceId[] = []

  private score = 0
  private lines = 0
  private level = 1

  private keys = { left: false, right: false, down: false }
  private dasTimer = 0
  private gravityTimer = 0
  // Additional rotation extension after landing, before the piece locks
  private areArmed = false
  private areTimer = 0
  private getreadyTimer = 0
  private pausedFrom: 'playing' | 'getready' = 'playing'

  private touchStartX = 0
  private touchStartY = 0

  private settledLayer: HTMLCanvasElement

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

    canvas.addEventListener('mousedown', this.handleMouseDown)
    canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false })
    canvas.addEventListener('touchmove', this.handleTouchMove, { passive: false })
    canvas.addEventListener('touchend', this.handleTouchEnd, { passive: false })
    window.addEventListener('keydown', this.handleKeyDown)
    window.addEventListener('keyup', this.handleKeyUp)

    this.settledLayer = this.createLayer(GAME_WIDTH, GAME_HEIGHT)

    // Preview the first piece before the game starts
    this.nextId = drawFromBag(this.bag)

    this.render()
    this.emitHud()
  }

  /** Context-dependent primary input (space / enter / click / button). */
  primaryAction(): void {
    if (this.status === 'idle' || this.status === 'gameover') {
      this.startGame()
    } else if (this.status === 'paused') {
      this.setStatus(this.pausedFrom)
    }
  }

  private startGame(): void {
    this.score = 0
    this.lines = 0
    this.level = 1
    this.board = createBoard()
    this.active = null
    this.resetPieceTimers()
    this.renderSettledLayer()
    this.beginGetReady()
    this.emitHud()
  }

  destroy(): void {
    this.running = false
    cancelAnimationFrame(this.rafId)
    const canvas = this.canvas
    canvas.removeEventListener('mousedown', this.handleMouseDown)
    canvas.removeEventListener('touchstart', this.handleTouchStart)
    canvas.removeEventListener('touchmove', this.handleTouchMove)
    canvas.removeEventListener('touchend', this.handleTouchEnd)
    window.removeEventListener('keydown', this.handleKeyDown)
    window.removeEventListener('keyup', this.handleKeyUp)
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
   * The animation loop only runs while the game is in play. In the other
   * states a single static frame is rendered and the loop stops, so the
   * screen (and its backdrop blur) costs nothing.
   */
  private syncLoop(): void {
    const shouldRun = this.status === 'playing' || this.status === 'getready'
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
    if (this.status === 'getready') {
      this.getreadyTimer += dt
      if (this.getreadyTimer >= GET_READY_DURATION) {
        this.getreadyTimer = 0
        this.spawnPiece()
        this.setStatus('playing')
      }
      return
    }

    if (this.status !== 'playing' || !this.active) return

    // Delayed auto shift while a key is held; frozen during the ARE window
    const direction = (this.keys.right ? 1 : 0) - (this.keys.left ? 1 : 0)
    if (direction !== 0) {
      if (!this.areArmed) {
        this.dasTimer += dt
        if (this.dasTimer >= DAS_DELAY) {
          this.dasTimer = DAS_RESET
          this.move(direction)
        }
      }
    } else {
      this.dasTimer = 0
    }

    // Gravity keeps ticking during the ARE window, so a piece that slides or
    // rotates over a gap falls again; the window expires only while at rest
    const interval = dropIntervalForLevel(this.level) / (this.keys.down ? 2 : 1)
    this.gravityTimer += dt
    let steps = 0
    while (this.gravityTimer >= interval && steps < 4) {
      this.gravityTimer -= interval
      steps += 1
      this.stepDown()
    }

    if (this.areArmed) {
      this.areTimer -= dt
      if (this.areTimer <= 0) this.lockPiece()
    }
  }

  /** One gravity tick: fall a row, or arm the ARE window when the floor is reached. */
  private stepDown(): void {
    const piece = this.active
    if (!piece) return

    if (canPlace(this.board, this.cellsOf(piece), piece.x, piece.y + 1)) {
      piece.y += 1
      this.areArmed = false
      if (this.keys.down) {
        this.score += 1
        this.emitHud()
      }
      return
    }

    if (!this.areArmed) {
      this.areArmed = true
      this.areTimer = this.areInterval(piece)
    }
  }

  /** NES lock extension: 10 frames, plus 2 per group of 4 rows above the bottom two. */
  private areInterval(piece: ActivePiece): number {
    const cells = this.cellsOf(piece)
    let bottom = -1
    for (let row = 0; row < cells.length; row++) {
      for (let col = 0; col < cells[row].length; col++) {
        if (cells[row][col] !== 1) continue
        bottom = Math.max(bottom, piece.y + row)
      }
    }
    const rowsAbove = Math.max(0, ROWS - 2 - bottom)
    const groups = Math.floor(rowsAbove / ARE_ROW_GROUP_SIZE)
    return (ARE_BASE_FRAMES + groups * ARE_EXTRA_FRAMES_PER_ROW_GROUP) / 60
  }

  private move(dx: number): void {
    const piece = this.active
    if (!piece || this.status !== 'playing') return
    if (canPlace(this.board, this.cellsOf(piece), piece.x + dx, piece.y)) piece.x += dx
  }

  /** NES rotation: clockwise only, no wall kicks, no 180°. */
  private rotate(): void {
    const piece = this.active
    if (!piece || this.status !== 'playing') return

    const rotation = (piece.rotation + 1) % 4
    if (canPlace(this.board, this.cellsOf({ ...piece, rotation }), piece.x, piece.y)) {
      piece.rotation = rotation
    }
  }

  private lockPiece(): void {
    const piece = this.active
    if (!piece) return

    const pieceIndex = PIECE_IDS.indexOf(piece.id) + 1
    merge(this.board, this.cellsOf(piece), piece.x, piece.y, pieceIndex)

    const cleared = clearLines(this.board)
    const previousLevel = this.level
    if (cleared > 0) {
      this.score += scoreForLines(cleared, this.level)
      this.lines += cleared
      this.level = levelForLines(this.lines)
    }
    this.renderSettledLayer()
    this.resetPieceTimers()

    if (this.level > previousLevel) {
      this.beginGetReady()
    } else {
      this.spawnPiece()
    }
    this.emitHud()
  }

  private beginGetReady(): void {
    this.getreadyTimer = 0
    this.setStatus('getready')
  }

  private spawnPiece(): void {
    const id = this.nextId
    this.nextId = drawFromBag(this.bag)

    const size = getTetromino(id).rotations[0].length
    this.active = { id, x: Math.floor((COLS - size) / 2), y: 0, rotation: 0 }

    // Top-out: the new piece cannot fit
    if (!canPlace(this.board, this.cellsOf(this.active), this.active.x, this.active.y)) {
      this.setStatus('gameover')
    }
    this.emitHud()
  }

  private resetPieceTimers(): void {
    this.dasTimer = 0
    this.gravityTimer = 0
    this.areArmed = false
    this.areTimer = 0
  }

  private cellsOf(piece: ActivePiece): PieceMatrix {
    return getTetromino(piece.id).rotations[piece.rotation % 4]
  }

  private emitHud(): void {
    this.callbacks.onHud({ score: this.score, level: this.level, lines: this.lines, next: this.nextId })
  }

  private setStatus(status: GameStatus): void {
    if (status === 'paused') this.pausedFrom = this.status === 'getready' ? 'getready' : 'playing'
    this.status = status
    this.callbacks.onStatus(status)
    this.syncLoop()
  }

  private handleMouseDown = (): void => {
    this.primaryAction()
  }

  private handleTouchStart = (event: TouchEvent): void => {
    event.preventDefault()
    const touch = event.touches[0]
    if (!touch) return
    this.touchStartX = touch.clientX
    this.touchStartY = touch.clientY
  }

  private handleTouchMove = (event: TouchEvent): void => {
    event.preventDefault()
  }

  private handleTouchEnd = (event: TouchEvent): void => {
    event.preventDefault()
    const touch = event.changedTouches[0]
    if (!touch) return

    if (this.status !== 'playing') {
      this.primaryAction()
      return
    }

    const dx = touch.clientX - this.touchStartX
    const dy = touch.clientY - this.touchStartY

    if (Math.abs(dx) >= SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
      const pxPerCell = this.canvas.getBoundingClientRect().width / COLS
      const steps = Math.min(COLS, Math.max(1, Math.round(Math.abs(dx) / pxPerCell)))
      for (let i = 0; i < steps; i++) this.move(Math.sign(dx))
    } else if (Math.abs(dy) < SWIPE_THRESHOLD) {
      this.rotate()
    }
    // A deliberate down swipe does nothing: the NES has no hard drop
  }

  private isInteractiveTarget(target: EventTarget | null): boolean {
    return target instanceof HTMLElement && target.closest('button, a, input, select, textarea') !== null
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    // Let buttons and form controls keep their native keyboard behavior
    if (this.isInteractiveTarget(event.target)) return

    const code = event.code
    if (code === 'ArrowLeft' || code === 'KeyA') {
      event.preventDefault()
      if (!event.repeat) {
        this.keys.left = true
        this.dasTimer = 0
        this.move(-1)
      }
    } else if (code === 'ArrowRight' || code === 'KeyD') {
      event.preventDefault()
      if (!event.repeat) {
        this.keys.right = true
        this.dasTimer = 0
        this.move(1)
      }
    } else if (code === 'ArrowDown' || code === 'KeyS') {
      event.preventDefault()
      if (!event.repeat) this.keys.down = true
    } else if (code === 'ArrowUp' || code === 'KeyW' || code === 'KeyX') {
      event.preventDefault()
      if (!event.repeat) this.rotate()
    } else if (code === 'Space' || code === 'Enter') {
      event.preventDefault()
      if (!event.repeat) this.primaryAction()
    } else if (code === 'KeyP' || code === 'Escape') {
      event.preventDefault()
      if (!event.repeat) {
        if (this.status === 'playing' || this.status === 'getready') this.setStatus('paused')
        else if (this.status === 'paused') this.setStatus(this.pausedFrom)
      }
    }
  }

  private handleKeyUp = (event: KeyboardEvent): void => {
    const code = event.code
    if (code === 'ArrowLeft' || code === 'KeyA') {
      this.keys.left = false
      this.dasTimer = 0
    }
    if (code === 'ArrowRight' || code === 'KeyD') {
      this.keys.right = false
      this.dasTimer = 0
    }
    if (code === 'ArrowDown' || code === 'KeyS') this.keys.down = false
  }

  private render(): void {
    const ctx = this.ctx
    // The NES well is pure black, without grid lines
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

    ctx.drawImage(this.settledLayer, 0, 0, GAME_WIDTH, GAME_HEIGHT)

    if (this.status === 'getready') {
      this.renderGetReady()
      return
    }

    const piece = this.active
    if (!piece) return
    if (this.status !== 'gameover') this.renderGhost(piece)
    this.renderPiece(piece)
  }

  /** The GET READY screen the NES shows before the first piece and after each level up. */
  private renderGetReady(): void {
    const ctx = this.ctx
    ctx.fillStyle = '#e8e8e8'
    ctx.textAlign = 'center'
    ctx.font = '700 42px monospace'
    ctx.fillText('GET READY', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 12)
    ctx.font = '700 28px monospace'
    ctx.fillText(`L${this.level}  ${this.score}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30)
    ctx.textAlign = 'left'
  }

  private renderGhost(piece: ActivePiece): void {
    let ghostY = piece.y
    while (canPlace(this.board, this.cellsOf(piece), piece.x, ghostY + 1)) ghostY += 1
    if (ghostY === piece.y) return

    const cells = this.cellsOf(piece)
    const color = getTetromino(piece.id).color
    const ctx = this.ctx
    ctx.globalAlpha = 0.25
    for (let row = 0; row < cells.length; row++) {
      for (let col = 0; col < cells[row].length; col++) {
        if (cells[row][col] !== 1) continue
        this.fillCell(ctx, piece.x + col, ghostY + row, color)
      }
    }
    ctx.globalAlpha = 1
  }

  private renderPiece(piece: ActivePiece): void {
    const cells = this.cellsOf(piece)
    const color = getTetromino(piece.id).color
    const ctx = this.ctx
    for (let row = 0; row < cells.length; row++) {
      for (let col = 0; col < cells[row].length; col++) {
        if (cells[row][col] !== 1) continue
        this.fillCell(ctx, piece.x + col, piece.y + row, color, true)
      }
    }
  }

  private renderSettledLayer(): void {
    const ctx = this.layerContext(this.settledLayer)
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const cell = this.board[row][col]
        if (cell === 0) continue
        this.fillCell(ctx, col, row, TETROMINOES[PIECE_IDS[cell - 1]].color, true)
      }
    }
  }

  /** A square block with the NES-style bevel: light top/left, dark bottom/right. */
  private fillCell(ctx: CanvasRenderingContext2D, col: number, row: number, color: string, bevel = false): void {
    const x = col * CELL + 1
    const y = row * CELL + 1
    const size = CELL - 2
    ctx.fillStyle = color
    ctx.fillRect(x, y, size, size)
    if (!bevel) return

    const b = 2
    ctx.fillStyle = shade(color, 0.35)
    ctx.fillRect(x, y, size, b)
    ctx.fillRect(x, y, b, size)
    ctx.fillStyle = shade(color, -0.35)
    ctx.fillRect(x, y + size - b, size, b)
    ctx.fillRect(x + size - b, y, b, size)
  }

  private createLayer(width: number, height: number): HTMLCanvasElement {
    const layer = document.createElement('canvas')
    layer.width = Math.round(width * this.dpr)
    layer.height = Math.round(height * this.dpr)
    this.layerContext(layer).scale(this.dpr, this.dpr)
    return layer
  }

  private layerContext(layer: HTMLCanvasElement): CanvasRenderingContext2D {
    const ctx = layer.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D context is not available')
    return ctx
  }
}

/** Mix a hex color toward white (positive amount) or black (negative). */
function shade(hex: string, amount: number): string {
  const value = parseInt(hex.slice(1), 16)
  const target = amount > 0 ? 255 : 0
  const t = Math.abs(amount)
  const mix = (channel: number): number => Math.round(channel + (target - channel) * t)
  const r = mix((value >> 16) & 255)
  const g = mix((value >> 8) & 255)
  const b = mix(value & 255)
  return `rgb(${r}, ${g}, ${b})`
}
