import type { GameEntry } from '@/interfaces/game-catalog'

export const games: GameEntry[] = [
  {
    id: 'arkanoid',
    name: 'Arkanoid',
    tagline: "Clear the wall. Don't drop the ball.",
    load: () => import('@/games/arkanoid/ArkanoidView.vue'),
  },
  {
    id: 'tetris',
    name: 'Tetris',
    tagline: 'Stack the pieces. Clear the lines.',
    load: () => import('@/games/tetris/TetrisView.vue'),
  },
]
