<template>
  <main class="shell">
    <div class="stage">
      <div class="board">
        <canvas ref="canvasRef" aria-label="Tetris game area"></canvas>

        <div v-if="status === 'idle' || status === 'paused' || status === 'gameover'" class="overlay">
          <template v-if="status === 'idle'">
            <h1 class="title">TETRIS</h1>
            <p class="subtitle">Stack the pieces. Clear the lines.</p>
          </template>
          <template v-else-if="status === 'paused'">
            <h1 class="title">PAUSED</h1>
            <p class="subtitle">Score {{ hud.score }}</p>
          </template>
          <template v-else>
            <h1 class="title danger">GAME OVER</h1>
            <p class="subtitle">Final score {{ hud.score }}</p>
          </template>

          <button type="button" class="cta" @click="handlePrimaryAction">
            {{ status === 'idle' ? 'Start game' : status === 'paused' ? 'Resume' : 'Play again' }}
          </button>
        </div>
      </div>

      <aside class="panel">
        <div class="panel-block">
          <span class="panel-label">Next</span>
          <div class="next-grid" :style="{ gridTemplateColumns: `repeat(${nextWidth}, 1fr)` }">
            <span
              v-for="(cell, index) in nextCells"
              :key="index"
              class="next-cell"
              :style="cell === 1 ? { background: nextColor } : undefined"
            ></span>
          </div>
        </div>
        <div class="panel-block">
          <span class="panel-label">Score</span>
          <span class="panel-value">{{ hud.score }}</span>
        </div>
        <div class="panel-block">
          <span class="panel-label">Level</span>
          <span class="panel-value">{{ hud.level }}</span>
        </div>
        <div class="panel-block">
          <span class="panel-label">Lines</span>
          <span class="panel-value">{{ hud.lines }}</span>
        </div>
      </aside>
    </div>

    <p v-if="status === 'playing'" class="hint">
      Move ← → · Soft drop ↓ · Rotate ↑ / X · Pause P
    </p>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { GameStatus, HudState } from '@/games/tetris/interfaces/game'
import { TetrisGame } from '@/games/tetris/game/engine'
import { getTetromino, trimCells } from '@/games/tetris/game/pieces'

const canvasRef = ref<HTMLCanvasElement | null>(null)
const hud = ref<HudState>({ score: 0, level: 1, lines: 0, next: 'T' })
const status = ref<GameStatus>('idle')

let game: TetrisGame | null = null

onMounted(() => {
  if (!canvasRef.value) return
  game = new TetrisGame(canvasRef.value, {
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

const trimmedNext = computed(() => trimCells(getTetromino(hud.value.next).rotations[0]))
const nextCells = computed(() => trimmedNext.value.flat())
const nextWidth = computed(() => trimmedNext.value[0]?.length ?? 4)
const nextColor = computed(() => getTetromino(hud.value.next).color)

function handlePrimaryAction(): void {
  game?.primaryAction()
}
</script>

<style scoped>
.shell {
  width: min(100%, 620px);
  margin-inline: auto;
}

.stage {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: flex-start;
  gap: 16px;
}

.board {
  position: relative;
  flex: 0 1 auto;
  width: min(100%, 340px);
  /* Cap by viewport height so the tall board always fits */
  width: min(100%, calc((100dvh - 210px) / 2));
  aspect-ratio: 1 / 2;
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 12px;
  box-shadow: 0 24px 60px rgb(0 0 0 / 0.5);
  touch-action: none;
}

.panel {
  flex: 0 1 auto;
  width: min(190px, 100%);
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.panel-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px;
  background: rgb(20 27 52 / 0.7);
  border: 1px solid rgb(148 163 184 / 0.16);
  border-radius: 12px;
}

.panel-label {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #64748b;
}

.panel-value {
  font-size: 1.15rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.next-grid {
  display: grid;
  gap: 3px;
  width: min(100%, 64px);
  margin-inline: auto;
}

.next-cell {
  aspect-ratio: 1;
  border-radius: 3px;
  background: rgb(148 163 184 / 0.12);
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
