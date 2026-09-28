import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { GameStatus } from '@/games/pong/interfaces/game'
import { PongGame } from './engine'

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

class FakeAudioContext {
  state = 'running'
  currentTime = 0
  destination = {}
  resume(): Promise<void> {
    return Promise.resolve()
  }
  close(): Promise<void> {
    return Promise.resolve()
  }
  createOscillator(): unknown {
    return {
      type: '',
      frequency: { value: 0 },
      connect: () => ({ connect: () => undefined }),
      start: () => undefined,
      stop: () => undefined,
    }
  }
  createGain(): unknown {
    return {
      gain: { setValueAtTime: () => undefined, exponentialRampToValueAtTime: () => undefined },
      connect: () => ({}),
    }
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
  vi.stubGlobal('AudioContext', FakeAudioContext)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('PongGame', () => {
  it('boots, serves, plays, pauses and cleans up', () => {
    const statuses: GameStatus[] = []
    const canvas = document.createElement('canvas')
    const game = new PongGame(canvas, {
      onHud: () => undefined,
      onStatus: (status) => {
        statuses.push(status)
      },
    })

    expect(game.status).toBe('idle')

    game.primaryAction()
    expect(game.status).toBe('serving')

    pump(80) // past the 1s serve delay: the loop runs and serves the ball
    expect(game.status).toBe('playing')
    expect(statuses).toContain('playing')

    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyP' }))
    expect(game.status).toBe('paused')

    game.primaryAction()
    expect(game.status).toBe('playing')

    pump(180) // rallies run without throwing
    game.destroy()
  })
})
