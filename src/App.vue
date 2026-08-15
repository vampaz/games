<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import type { GameStatus, HudState } from '@/interfaces/game'
import { ArkanoidGame } from '@/game/engine'

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
  game.start()
})

onBeforeUnmount(() => {
  game?.destroy()
  game = null
})
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
        <span class="hud-value lives" aria-label="{{ hud.lives }} lives remaining">
          <i v-for="life in hud.lives" :key="life" class="life-dot"></i>
        </span>
      </div>
    </header>

    <div class="stage">
      <canvas ref="canvasRef" aria-label="Arkanoid game area"></canvas>
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

.hint {
  margin: 12px 4px 0;
  text-align: center;
  font-size: 0.85rem;
  color: #64748b;
}

canvas {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: 12px;
  box-shadow: 0 24px 60px rgb(0 0 0 / 0.5);
  touch-action: none;
}
</style>
