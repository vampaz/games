<template>
  <main class="shell">
    <div class="stage">
      <canvas ref="canvasRef" aria-label="Pong game area"></canvas>

      <div v-if="status === 'idle' || status === 'paused' || status === 'gameover'" class="overlay">
        <template v-if="status === 'idle'">
          <h1 class="title">PONG</h1>
          <p class="subtitle">Two paddles. First to eleven.</p>
        </template>
        <template v-else-if="status === 'paused'">
          <h1 class="title">PAUSED</h1>
          <p class="subtitle">Score {{ hud.player }}–{{ hud.ai }}</p>
        </template>
        <template v-else>
          <h1 class="title" :class="{ danger: hud.player < hud.ai }">
            {{ hud.player > hud.ai ? 'YOU WIN' : 'GAME OVER' }}
          </h1>
          <p class="subtitle">Final score {{ hud.player }}–{{ hud.ai }}</p>
        </template>

        <button type="button" class="cta" @click="handlePrimaryAction">
          {{ status === 'idle' ? 'Start game' : status === 'paused' ? 'Resume' : 'Play again' }}
        </button>
      </div>
    </div>

    <p v-if="status === 'playing' || status === 'serving'" class="hint">
      Move W / S or ↑ / ↓ · P to pause
    </p>
  </main>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import type { GameStatus, Scores } from '@/games/pong/interfaces/game'
import { PongGame } from '@/games/pong/game/engine'

const canvasRef = ref<HTMLCanvasElement | null>(null)
const hud = ref<Scores>({ player: 0, ai: 0 })
const status = ref<GameStatus>('idle')

let game: PongGame | null = null

onMounted(() => {
  if (!canvasRef.value) return
  game = new PongGame(canvasRef.value, {
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

<style scoped>
.shell {
  width: min(100%, 840px);
  margin-inline: auto;
}

.stage {
  position: relative;
  /* Cap by viewport height so the 4:3 field always fits */
  width: min(100%, calc((100dvh - 160px) * 4 / 3));
  margin-inline: auto;
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
  background: rgb(0 0 0 / 0.78);
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
  color: #000000;
  background: #ffffff;
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
