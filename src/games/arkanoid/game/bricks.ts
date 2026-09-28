import type { Brick } from '@/games/arkanoid/interfaces/game'
import {
  BRICK_COLS,
  BRICK_GAP,
  BRICK_HEIGHT,
  BRICK_SIDE_MARGIN,
  BRICK_TOP,
  GAME_WIDTH,
} from './constants'

type BrickTypeCode = 'W' | 'R' | 'B' | 'G' | 'Y' | 'P' | 'S' | 'X'

interface BrickType {
  hits: number
  points: number
  color: string
  destructible: boolean
}

// Original Arkanoid mapping: every color breaks in one hit; silver takes
// more hits on later rounds and gold never breaks.
const BRICK_TYPES: Record<BrickTypeCode, BrickType> = {
  W: { hits: 1, points: 50, color: '#e5e7eb', destructible: true },
  R: { hits: 1, points: 100, color: '#ef4444', destructible: true },
  B: { hits: 1, points: 110, color: '#3b82f6', destructible: true },
  G: { hits: 1, points: 90, color: '#22c55e', destructible: true },
  Y: { hits: 1, points: 50, color: '#eab308', destructible: true },
  P: { hits: 1, points: 120, color: '#a855f7', destructible: true },
  S: { hits: 2, points: 50, color: '#c0c0c0', destructible: true },
  X: { hits: 1, points: 0, color: '#c9a227', destructible: false },
}

// Hand-crafted layouts, 10 columns wide, rows top-down. `.` is empty.
const LEVELS: string[][] = [
  [
    'PPPPPPPPPP',
    'RRRRRRRRRR',
    'BBBBBBBBBB',
    'YYYYYYYYYY',
    'GGGGGGGGGG',
    'WWWWWWWWWW',
  ],
  [
    '.PP.PP.PP.',
    '.RR.RR.RR.',
    '.BS.BS.BS.',
    '.YY.YY.YY.',
    '.GG.GG.GG.',
    '.WW.WW.WW.',
  ],
  [
    '....PP....',
    '...RRRR...',
    '..RRYYRR..',
    '.RRYWWYRR.',
    'RRYWWWWYRR',
    'RYWGGGGWYR',
  ],
  [
    '....PP....',
    '..RRRRRR..',
    '.RRBBBBRR.',
    'RRBBXXBBRR',
    'RRBBXXBBRR',
    '.RRBBBBRR.',
    '..RRRRRR..',
    '....PP....',
  ],
  [
    'G.W.G.W.G.',
    '.W.G.W.G.W',
    'G.W.G.W.G.',
    '.W.G.W.G.W',
    'G.W.G.W.G.',
    '.W.G.W.G.W',
  ],
  [
    'PPPPPPPPPP',
    'PSYYYYYYSP',
    'PYGGGGGGYP',
    'PYGWWWWGYP',
    'PYGWWWWGYP',
    'PYGGGGGGYP',
    'PYYYYYYYYP',
    'PPPPPPPPPP',
  ],
  [
    'RR......RR',
    '.RB....BR.',
    '..RB.BR...',
    '...BBBB...',
    '...BBBB...',
    '..RB.BR...',
    '.RB....BR.',
    'RR......RR',
  ],
  [
    '....PP....',
    '...PPPP...',
    '..BB..BB..',
    '.RR....RR.',
    'RR......RR',
    'WWWWWWWWWW',
  ],
  [
    'XP....RRRR',
    'PP....RRRR',
    'PP....BBRR',
    'PPPPPPPPPP',
    'PP....BBRR',
    'PP....RRRR',
    'XP....RRRR',
  ],
  [
    'PPPPPPPPPP',
    'PWWWWWWWPP',
    'PWWWWWWWPP',
    'PPPPPPPPPP',
  ],
  [
    'PPPP......',
    'PPPP..GGGG',
    'PPPP..GGGG',
    '......GGGG',
    'GGGG......',
    'GGGG..RRRR',
    'GGGG..RRRR',
    '......RRRR',
  ],
  [
    'YYWWWWWWYY',
    '.YYWWWWYY.',
    '..YYWWYY..',
    '...YYYY...',
    '....RR....',
  ],
  [
    'PPPPPPPPPP',
    'BRRBRRBRRB',
    'RBRBSRSBRB',
    'BRBRBRBRBR',
  ],
  [
    'PPPPPPPPPP',
    'BBBYYBBBPP',
    'PPBWWBPPPP',
    'RRRRRRRRRR',
    'RRRRRRRRRR',
  ],
]

export function createBricks(level: number): Brick[] {
  const normalizedLevel = Math.max(1, level)
  const layout = LEVELS[(normalizedLevel - 1) % LEVELS.length]
  const brickWidth =
    (GAME_WIDTH - BRICK_SIDE_MARGIN * 2 - BRICK_GAP * (BRICK_COLS - 1)) / BRICK_COLS
  const bricks: Brick[] = []

  layout.forEach((rowString, row) => {
    for (let col = 0; col < rowString.length; col++) {
      const code = rowString.charAt(col) as BrickTypeCode
      const type = BRICK_TYPES[code]
      if (!type) continue

      // Silver hardens on later rounds: 2 hits for rounds 1-8, +1 per 8 rounds.
      const hits = code === 'S' ? 2 + Math.floor((normalizedLevel - 1) / 8) : type.hits
      const points = code === 'S' ? 50 * normalizedLevel : type.points
      bricks.push({
        x: BRICK_SIDE_MARGIN + col * (brickWidth + BRICK_GAP),
        y: BRICK_TOP + row * (BRICK_HEIGHT + BRICK_GAP),
        width: brickWidth,
        height: BRICK_HEIGHT,
        hitsLeft: hits,
        maxHits: hits,
        points,
        color: type.color,
        alive: true,
        destructible: type.destructible,
      })
    }
  })

  return bricks
}

/** Destructible bricks still standing; gold never needs clearing. */
export function countRemainingBricks(bricks: Brick[]): number {
  let count = 0
  for (const brick of bricks) if (brick.alive && brick.destructible) count++
  return count
}
