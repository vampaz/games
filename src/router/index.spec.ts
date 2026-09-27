import { describe, expect, it } from 'vitest'

import { games } from '@/games/catalog'
import { router } from '@/router'

describe('router', () => {
  it('exposes the hub at the root', () => {
    expect(router.resolve('/').name).toBe('home')
  })

  it('creates a route for every catalog game', () => {
    for (const game of games) {
      expect(router.resolve(`/${game.id}`).name).toBe(game.id)
    }
  })
})
