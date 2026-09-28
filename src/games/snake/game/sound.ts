/**
 * The Nokia Snake's monotone beeps, synthesized with WebAudio so no assets
 * are needed: a short blip per food and a low tone on game over. Exact Nokia
 * pitches are undocumented; these are a homage approximation.
 */
export class SnakeSound {
  private ctx: AudioContext | null = null

  /**
   * Browsers only allow audio after a user gesture; call from the first
   * input so beeps are ready when the snake starts moving.
   */
  unlock(): void {
    if (!this.ctx) this.ctx = new AudioContext()
    if (this.ctx.state === 'suspended') void this.ctx.resume()
  }

  destroy(): void {
    if (this.ctx) void this.ctx.close()
    this.ctx = null
  }

  private beep(frequency: number, duration: number): void {
    if (!this.ctx || this.ctx.state !== 'running') return

    const time = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = 'square'
    osc.frequency.value = frequency
    gain.gain.setValueAtTime(0.06, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration)
    osc.connect(gain).connect(this.ctx.destination)
    osc.start(time)
    osc.stop(time + duration)
  }

  eat(): void {
    this.beep(1200, 0.07)
  }

  gameOver(): void {
    this.beep(400, 0.25)
  }
}
