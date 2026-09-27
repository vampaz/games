<template>
  <main class="hub">
    <header class="hub-header">
      <h1 class="hub-title">Games</h1>
      <p class="hub-subtitle">A growing collection of small browser games.</p>
    </header>

    <ul class="game-grid">
      <li v-for="game in games" :key="game.id">
        <RouterLink class="game-card" :to="`/${game.id}`">
          <span class="game-name">{{ game.name }}</span>
          <span class="game-tagline">{{ game.tagline }}</span>
        </RouterLink>
      </li>
    </ul>
  </main>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'

import { games } from '@/games/catalog'
</script>

<style scoped>
.hub {
  width: min(100%, 840px);
  margin-inline: auto;
}

.hub-header {
  padding: 0 4px 24px;
}

.hub-title {
  margin: 0;
  font-size: clamp(2rem, 6vw, 3rem);
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.hub-subtitle {
  margin: 8px 0 0;
  color: #94a3b8;
}

.game-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.game-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px;
  color: inherit;
  text-decoration: none;
  background: rgb(20 27 52 / 0.7);
  border: 1px solid rgb(148 163 184 / 0.16);
  border-radius: 12px;
  transition:
    border-color 0.15s ease,
    transform 0.15s ease;
}

.game-card:hover,
.game-card:focus-visible {
  border-color: rgb(148 163 184 / 0.5);
  transform: translateY(-2px);
}

.game-name {
  font-size: 1.25rem;
  font-weight: 700;
}

.game-tagline {
  font-size: 0.9rem;
  color: #94a3b8;
}
</style>
