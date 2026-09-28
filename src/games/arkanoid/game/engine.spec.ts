import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { GameStatus, HudState } from '@/games/arkanoid/interfaces/game'
import { ArkanoidGame } from './engine'

let rafCallbacks: FrameRequestCallback[] = []
let now = 0

function pump(frames: number): void {
  for (let i = 0; i < frames; i++) {
    const batch = rafCallbacks
    rafCallbacks = []
    now += 1000 / 60
    for (const callback of batch) callback(now)
  }
}

beforeEach(() => {
  rafCallbacks = []
  now = performance.now()
  const ctx = new Proxy(
    {},
    {
      get: () => () => undefined,
      set: () => true,
    },
  )
  vi.spyOn(window.HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    ctx as unknown as CanvasRenderingContext2D,
  )
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    rafCallbacks.push(callback)
    return rafCallbacks.length
  })
  vi.stubGlobal('cancelAnimationFrame', () => {
    rafCallbacks = []
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('ArkanoidGame', () => {
  it('boots, launches the ball, runs the loop and cleans up', () => {
    const statuses: GameStatus[] = []
    const huds: HudState[] = []
    const canvas = document.createElement('canvas')
    const game = new ArkanoidGame(canvas, {
      onHud: (hud) => {
        huds.push(hud)
      },
      onStatus: (status) => {
        statuses.push(status)
      },
    })

    expect(game.status).toBe('idle')

    game.primaryAction()
    expect(game.status).toBe('ready')

    game.primaryAction()
    expect(game.status).toBe('playing')

    pump(120) // ball flies, bounces and breaks bricks without throwing
    expect(statuses).toContain('playing')
    expect(huds.length).toBeGreaterThan(0)

    game.destroy()
  })
})
