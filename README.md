# Arkanoid

Classic Arkanoid built with Vue 3, TypeScript and Vite. The game runs on an HTML canvas; Vue handles the HUD and state overlays.

## Gameplay

- Clear all bricks to advance to the next level (the ball gets faster each level)
- 14 hand-crafted level layouts, repeating after 14
- Brick color encodes durability and value: white 1 hit / 10 pts, red 2 / 20, blue 3 / 40, green 2 / 60, yellow 2 / 80, purple 4 / 100
- 3 lives — drop the ball and you lose one

## Controls

| Input | Action |
| --- | --- |
| Mouse / touch drag | Move paddle |
| Arrow keys or A/D | Move paddle |
| Space / Enter / click | Start, launch ball, continue |

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
  game/          engine, ball, paddle, bricks and collision logic (pure TS)
  interfaces/    shared TypeScript interfaces
  App.vue        HUD, canvas mount and state overlays
```
