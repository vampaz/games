import { createRouter, createWebHistory } from 'vue-router'

import { games } from '@/games/catalog'
import HomeView from '@/views/HomeView.vue'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    ...games.map((game) => ({
      path: `/${game.id}`,
      name: game.id,
      component: game.load,
    })),
  ],
})
