import type { RouteComponent } from 'vue-router'

export interface GameEntry {
  /** URL segment and route name for the game, e.g. "arkanoid" -> /arkanoid */
  id: string
  name: string
  tagline: string
  load: () => Promise<RouteComponent>
}
