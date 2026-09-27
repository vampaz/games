import { describe, expect, it } from 'vitest'

import type { Ball, Brick } from '@/games/arkanoid/interfaces/game'
import { circleHitsRect, resolveBallBrick } from './collision'

function makeBall(x: number, y: number): Ball {
  return { position: { x, y }, velocity: { x: 0, y: -100 }, radius: 8 }
}

function makeBrick(): Brick {
  return { x: 100, y: 100, width: 60, height: 20, hitsLeft: 1, maxHits: 1, points: 10, color: '#fff', alive: true }
}

describe('circleHitsRect', () => {
  it('detects a hit when the ball overlaps a brick edge', () => {
    expect(circleHitsRect(makeBall(94, 110), makeBrick())).toBe(true)
  })

  it('returns false when the ball is far away', () => {
    expect(circleHitsRect(makeBall(300, 300), makeBrick())).toBe(false)
  })

  it('detects corner hits within the radius', () => {
    expect(circleHitsRect(makeBall(95, 95), makeBrick())).toBe(true)
    expect(circleHitsRect(makeBall(80, 80), makeBrick())).toBe(false)
  })
})

describe('resolveBallBrick', () => {
  it('returns null without overlap', () => {
    expect(resolveBallBrick(makeBall(300, 300), makeBrick())).toBeNull()
  })

  it("resolves 'x' for a hit from the left", () => {
    const ball = makeBall(94, 110)
    ball.velocity.x = 200
    expect(resolveBallBrick(ball, makeBrick())).toBe('x')
  })

  it("resolves 'x' for a hit from the right", () => {
    const ball = makeBall(166, 110)
    ball.velocity.x = -200
    expect(resolveBallBrick(ball, makeBrick())).toBe('x')
  })

  it("resolves 'y' for a hit from the top", () => {
    const ball = makeBall(130, 94)
    expect(resolveBallBrick(ball, makeBrick())).toBe('y')
  })

  it("resolves 'y' for a hit from the bottom", () => {
    const ball = makeBall(130, 126)
    ball.velocity.y = -200
    expect(resolveBallBrick(ball, makeBrick())).toBe('y')
  })

  it('falls back to the movement axis when the center is inside the brick', () => {
    const ball = makeBall(130, 110)
    ball.velocity.x = 200
    expect(resolveBallBrick(ball, makeBrick())).toBe('x')
  })
})
