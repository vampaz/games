export const GAME_WIDTH = 800
export const GAME_HEIGHT = 600

// The original paddles were thin and about an eighth of the field height
export const PADDLE_WIDTH = 10
export const PADDLE_HEIGHT = 75
// Gap from the wall to the paddle face
export const PADDLE_MARGIN = 48
export const PADDLE_SPEED = 420
// In the original the paddles never touched the top and bottom of the screen
export const PADDLE_EDGE_GAP = 8

export const BALL_SIZE = 12
// The original ball crossed the field in about two seconds
export const BALL_BASE_SPEED = 380
export const BALL_MAX_SPEED = 950

// The original sped up only twice per rally: the horizontal speed steps up
// after the 4th consecutive volley and again after the 12th; a miss resets it.
export const RALLY_FAST_HITS = 4
export const RALLY_MAX_HITS = 12
export const RALLY_FAST_MULT = 1.6
export const RALLY_MAX_MULT = 2.1

export const WIN_SCORE = 11
// The ball waits in the center before each serve
export const SERVE_DELAY = 1
export const SERVE_MAX_ANGLE = Math.PI / 9 // launch almost flat, like the original

// The AI tracks the ball a touch slower than a human can steer
export const AI_SPEED = 400
export const AI_DEAD_ZONE = 14

// Dashed center line
export const DASH_WIDTH = 6
export const DASH_ON = 24
export const DASH_OFF = 20

// Big seven-segment style digits, drawn on the field like the original
export const SCORE_DIGIT_WIDTH = 26
export const SCORE_DIGIT_HEIGHT = 40
export const SCORE_SEGMENT = 8
export const SCORE_TOP = 24
export const SCORE_CENTER_GAP = 28
export const SCORE_DIGIT_GAP = 10
