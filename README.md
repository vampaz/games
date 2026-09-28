# Games

A collection of small browser games built with Vue 3, TypeScript and Vite. The hub at `/` lists every game; each game lives in its own self-contained folder under `src/games/`.

## Games

- **Arkanoid** (`/arkanoid`) — Classic brick breaker. The game runs on an HTML canvas; Vue handles the HUD and state overlays.
- **Pong** (`/pong`) — The 1972 arcade original: black field, white blocks, dashed center line, first to eleven.
- **Snake** (`/snake`) — Grid classic: eat, grow, don't bite yourself. Speeds up with every food; best score persists.

### Arkanoid gameplay

- Clear all bricks to advance to the next level (the ball gets faster each level)
- 14 hand-crafted level layouts, repeating after 14
- Brick color encodes value (1986 originals): white/yellow 50, green 90, red 100, blue 110, purple 120 — all break in one hit
- Silver bricks take 2 hits on rounds 1–8 (+1 per 8 rounds) and score 50×level; gold bricks are indestructible and don't need clearing
- Bonus ships at 20k and 60k points, then every 60k
- 3 lives — drop the ball and you lose one

### Arkanoid controls

| Input | Action |
| --- | --- |
| Mouse / touch drag | Move paddle |
| Arrow keys or A/D | Move paddle |
| Space / Enter / click | Start, launch ball, continue |

### Pong gameplay

- First to eleven points wins; the ball resets to center and serves toward the side that just lost
- The ball steps up speed after the 4th and 12th consecutive volley (and resets on a miss), like the original
- The paddle has 8 zones with fixed return angles: flat in the middle, steep at the edges
- You play the left paddle against the machine; the original square-wave beeps play on every hit and point
- A pause key is the only modern addition

### Pong controls

| Input | Action |
| --- | --- |
| W / S or ↑ / ↓ | Move paddle |
| Mouse / touch drag | Move paddle |
| Space / Enter / click | Start, continue |
| P / Escape | Pause |

### Snake gameplay

- 20×15 grid like the Nokia 6110; every food grows the snake by one for one point
- Speed steps up at score thresholds; walls and self contact kill (one grace beat to turn away from walls)
- Moving into the vacating tail is safe
- Best score persists in `localStorage`

### Snake controls

| Input | Action |
| --- | --- |
| Arrows / WASD / 2-4-6-8 | Steer (number pad, like the original) |
| Swipe | Steer on touch |
| Space / Enter / click | Start, continue |
| P / Escape | Pause |

## Adding a game

1. Create a folder `src/games/<id>/` with the game's root component and its logic.
2. Register it in `src/games/catalog.ts`:

   ```ts
   {
     id: 'pong',
     name: 'Pong',
     tagline: 'First to eleven.',
     load: () => import('@/games/pong/PongView.vue'),
   }
   ```

The hub listing and the `/pong` route are generated from the catalog, so no other wiring is needed.

## Scripts

```sh
npm run dev          # start the Vite dev server
npm run build        # typecheck + production build
npm run preview      # serve the production build locally
npm run test         # run unit tests (vitest)
npm run typecheck    # vue-tsc only
```

## Structure

```
src/
  App.vue                 root shell (<router-view />)
  main.ts                 app bootstrap + router
  style.css               shared global styles
  router/index.ts         routes generated from the game catalog
  views/HomeView.vue      hub landing page
  interfaces/             interfaces shared across the app
  games/
    catalog.ts            registry of games (add new games here)
    arkanoid/
      ArkanoidView.vue    HUD, canvas mount and state overlays
      game/               engine, ball, paddle, bricks and collision logic (pure TS)
      interfaces/         Arkanoid-specific interfaces
```
