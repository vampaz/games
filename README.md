# Games

A collection of small browser games built with Vue 3, TypeScript and Vite. The hub at `/` lists every game; each game lives in its own self-contained folder under `src/games/`.

## Games

- **Arkanoid** (`/arkanoid`) — Classic brick breaker. The game runs on an HTML canvas; Vue handles the HUD and state overlays.

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
