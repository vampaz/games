<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { ArkanoidGame } from '@/game/engine'

const canvasRef = ref<HTMLCanvasElement | null>(null)
let game: ArkanoidGame | null = null

onMounted(() => {
  if (!canvasRef.value) return
  game = new ArkanoidGame(canvasRef.value, { onHud: () => {}, onStatus: () => {} })
  game.start()
})

onBeforeUnmount(() => {
  game?.destroy()
  game = null
})
</script>

<template>
  <main class="stage">
    <canvas ref="canvasRef" aria-label="Arkanoid game area"></canvas>
  </main>
</template>

<style scoped>
.stage {
  width: min(100%, 840px);
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
</style>
