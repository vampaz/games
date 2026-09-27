# Games

A collection of small browser games built with Vue 3, TypeScript and Vite. The hub at `/` lists every game; each game lives in its own self-contained folder under `src/games/`.

## Games

- **Arkanoid** (`/arkanoid`) — Classic brick breaker. The game runs on an HTML canvas; Vue handles the HUD and state overlays.
- **Tetris** (`/tetris`) — A faithful remake of the 1989 NES Tetris: its gravity table, scoring, rotation and DAS, plus a ghost piece and next preview for playability.

### Arkanoid gameplay

- Clear all bricks to advance to the next level (the ball gets faster each level)
- 14 hand-crafted level layouts, repeating after 14
- Brick color encodes durability and value: white 1 hit / 10 pts, red 2 / 20, blue 3 / 40, green 2 / 60, yellow 2 / 80, purple 4 / 100
- 3 lives — drop the ball and you lose one

### Arkanoid controls

| Input | Action |
| --- | --- |
| Mouse / touch drag | Move paddle |
| Arrow keys or A/D | Move paddle |
| Space / Enter / click | Start, launch ball, continue |

### Tetris gameplay

- Faithful to the 1989 NES release: the ROM gravity table (level 1 at 800ms per row down to 16.7ms), NES scoring and the GET READY screen between levels
- The 7-bag randomizer deals fair, evenly distributed pieces
- NES scoring: 40 / 100 / 300 / 1200 points per 1 / 2 / 3 / 4 lines, × level; soft dropping awards 1 point per row
- Every 10 cleared lines raises the level; game over when a newly spawned piece cannot fit
- NES rotation (NRS): clockwise only, no wall kicks, no hard drop; held keys use the original DAS (16-frame delay, 6-frame repeat)
- A landed piece keeps a short extension (ARE, 10–18 frames) in which it can still move and rotate before it locks
- A ghost piece, next-piece preview and pause are the only modern additions

### Tetris controls

| Input | Action |
| --- | --- |
| Arrow keys or A/D | Move (original DAS auto-repeat) |
| Down / S | Soft drop (2× gravity, 1 pt/row) |
| Up / W / X | Rotate clockwise |
| Space / Enter | Start, resume, restart |
| P / Escape | Pause |
| Tap / swipe | Rotate / move (touch) |

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
    tetris/
      TetrisView.vue      HUD panel, canvas mount and state overlays
      game/               engine, board, pieces, 7-bag and scoring logic (pure TS)
      interfaces/         Tetris-specific interfaces
```
