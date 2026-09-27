import type { Brick } from '@/interfaces/game'
import {
  BRICK_COLS,
  BRICK_GAP,
  BRICK_HEIGHT,
  BRICK_SIDE_MARGIN,
  BRICK_TOP,
  GAME_WIDTH,
} from './constants'

type BrickTypeCode = 'W' | 'R' | 'B' | 'G' | 'Y' | 'P'

interface BrickType {
  hits: number
  points: number
  color: string
}

// Original Arkanoid mapping: color encodes durability and value.
const BRICK_TYPES: Record<BrickTypeCode, BrickType> = {
  W: { hits: 1, points: 10, color: '#e5e7eb' },
  R: { hits: 2, points: 20, color: '#ef4444' },
  B: { hits: 3, points: 40, color: '#3b82f6' },
  G: { hits: 2, points: 60, color: '#22c55e' },
  Y: { hits: 2, points: 80, color: '#eab308' },
  P: { hits: 4, points: 100, color: '#a855f7' },
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
    '.BB.BB.BB.',
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
    'RRBBWWBBRR',
    'RRBBWWBBRR',
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
    'PYYYYYYYYP',
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
    'PP....RRRR',
    'PP....RRRR',
    'PP....BBRR',
    'PPPPPPPPPP',
    'PP....BBRR',
    'PP....RRRR',
    'PP....RRRR',
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
    'RBRBRBRBRB',
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
  const layout = LEVELS[(Math.max(1, level) - 1) % LEVELS.length]
  const brickWidth =
    (GAME_WIDTH - BRICK_SIDE_MARGIN * 2 - BRICK_GAP * (BRICK_COLS - 1)) / BRICK_COLS
  const bricks: Brick[] = []

  layout.forEach((rowString, row) => {
    for (let col = 0; col < rowString.length; col++) {
      const type = BRICK_TYPES[rowString.charAt(col) as BrickTypeCode]
      if (!type) continue

      bricks.push({
        x: BRICK_SIDE_MARGIN + col * (brickWidth + BRICK_GAP),
        y: BRICK_TOP + row * (BRICK_HEIGHT + BRICK_GAP),
        width: brickWidth,
        height: BRICK_HEIGHT,
        hitsLeft: type.hits,
        maxHits: type.hits,
        points: type.points,
        color: type.color,
        alive: true,
      })
    }
  })

  return bricks
}

export function countAliveBricks(bricks: Brick[]): number {
  let count = 0
  for (const brick of bricks) if (brick.alive) count++
  return count
}
