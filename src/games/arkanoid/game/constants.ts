export const GAME_WIDTH = 800
export const GAME_HEIGHT = 600

export const PADDLE_WIDTH = 120
export const PADDLE_HEIGHT = 14
export const PADDLE_Y = GAME_HEIGHT - 36
export const PADDLE_SPEED = 520

export const BALL_RADIUS = 8
export const BALL_BASE_SPEED = 360
export const BALL_LEVEL_SPEED_BONUS = 40
export const BALL_MAX_SPEED = 620

// Max deflection angle off vertical when the ball hits a paddle edge (radians)
export const MAX_BOUNCE_ANGLE = Math.PI / 3

export const BRICK_COLS = 10
export const BRICK_GAP = 6
export const BRICK_TOP = 70
export const BRICK_SIDE_MARGIN = 24
export const BRICK_HEIGHT = 22

export const START_LIVES = 3

// The original awards bonus ships at 20k and 60k, then every 60k after.
export const BONUS_LIFE_SCORES = [20000, 60000, 120000, 180000, 240000, 300000]
