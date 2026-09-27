<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import type { GameStatus, HudState } from '@/games/arkanoid/interfaces/game'
import { ArkanoidGame } from '@/games/arkanoid/game/engine'

const canvasRef = ref<HTMLCanvasElement | null>(null)
const hud = ref<HudState>({ score: 0, lives: 3, level: 1 })
const status = ref<GameStatus>('idle')

let game: ArkanoidGame | null = null

onMounted(() => {
  if (!canvasRef.value) return
  game = new ArkanoidGame(canvasRef.value, {
    onHud: (next) => {
      hud.value = next
    },
    onStatus: (next) => {
      status.value = next
    },
  })
})

onBeforeUnmount(() => {
  game?.destroy()
  game = null
})

function handlePrimaryAction(): void {
  game?.primaryAction()
}
</script>

<template>
  <main class="shell">
    <header class="hud">
      <div class="hud-item">
        <span class="hud-label">Score</span>
        <span class="hud-value">{{ hud.score }}</span>
      </div>
      <div class="hud-item">
        <span class="hud-label">Level</span>
        <span class="hud-value">{{ hud.level }}</span>
      </div>
      <div class="hud-item">
        <span class="hud-label">Lives</span>
        <span class="hud-value lives" :aria-label="`${hud.lives} lives remaining`">
          <i v-for="life in hud.lives" :key="life" class="life-dot"></i>
        </span>
      </div>
    </header>

    <div class="stage">
      <canvas ref="canvasRef" aria-label="Arkanoid game area"></canvas>

      <div
        v-if="status === 'idle' || status === 'gameover' || status === 'levelcomplete'"
        class="overlay"
      >
        <template v-if="status === 'idle'">
          <h1 class="title">ARKANOID</h1>
          <p class="subtitle">Clear the wall. Don't drop the ball.</p>
        </template>
        <template v-else-if="status === 'gameover'">
          <h1 class="title danger">GAME OVER</h1>
          <p class="subtitle">Final score {{ hud.score }}</p>
        </template>
        <template v-else>
          <h1 class="title">LEVEL {{ hud.level }} CLEARED</h1>
          <p class="subtitle">Score {{ hud.score }}</p>
        </template>

        <button type="button" class="cta" @click="handlePrimaryAction">
          {{ status === 'idle' ? 'Start game' : status === 'gameover' ? 'Play again' : 'Next level' }}
        </button>
      </div>
    </div>

    <p v-if="status === 'ready'" class="hint">
      Move with mouse or arrow keys · Space / click to launch
    </p>
  </main>
</template>

<style scoped>
.shell {
  width: min(100%, 840px);
  margin-inline: auto;
}

.hud {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 16px;
  padding: 0 4px 12px;
}

.hud-item {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.hud-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #64748b;
}

.hud-value {
  font-size: 1.25rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.lives {
  display: inline-flex;
  gap: 5px;
}

.life-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #f8fafc;
}

.stage {
  position: relative;
}

canvas {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: 12px;
  box-shadow: 0 24px 60px rgb(0 0 0 / 0.5);
  touch-action: none;
}

.overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 24px;
  border-radius: 12px;
  background: rgb(7 10 22 / 0.78);
  backdrop-filter: blur(6px);
  text-align: center;
}

.title {
  margin: 0;
  font-size: clamp(2rem, 6vw, 3.5rem);
  font-weight: 800;
  letter-spacing: 0.18em;
  text-shadow: 0 0 32px rgb(148 163 184 / 0.5);
}

.title.danger {
  color: #f87171;
  text-shadow: 0 0 32px rgb(248 113 113 / 0.4);
}

.subtitle {
  margin: 0;
  color: #94a3b8;
}

.cta {
  margin-top: 14px;
  padding: 10px 30px;
  font-size: 1rem;
  font-weight: 600;
  color: #0b1020;
  background: #f8fafc;
  border: none;
  border-radius: 999px;
  cursor: pointer;
}

.cta:hover {
  background: #e2e8f0;
}

.hint {
  margin: 12px 4px 0;
  text-align: center;
  font-size: 0.85rem;
  color: #64748b;
}
</style>
