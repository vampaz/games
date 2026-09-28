import type { GameEntry } from '@/interfaces/game-catalog'

export const games: GameEntry[] = [
  {
    id: 'arkanoid',
    name: 'Arkanoid',
    tagline: "Clear the wall. Don't drop the ball.",
    load: () => import('@/games/arkanoid/ArkanoidView.vue'),
  },
  {
    id: 'pong',
    name: 'Pong',
    tagline: 'Two paddles. First to eleven.',
    load: () => import('@/games/pong/PongView.vue'),
  },
  {
    id: 'snake',
    name: 'Snake',
    tagline: 'Eat. Grow. Survive.',
    load: () => import('@/games/snake/SnakeView.vue'),
  },
]
