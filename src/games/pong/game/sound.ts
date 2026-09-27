/**
 * The original Pong's beeps, synthesized with WebAudio so no assets are
 * needed: one blip on a paddle hit, a lower one on a wall bounce, and a
 * double blip when a point is scored.
 */
export class PongSound {
  private ctx: AudioContext | null = null

  /**
   * Browsers only allow audio after a user gesture; call from the first
   * input so beeps are ready when the ball starts moving.
   */
  unlock(): void {
    if (!this.ctx) this.ctx = new AudioContext()
    if (this.ctx.state === 'suspended') void this.ctx.resume()
  }

  destroy(): void {
    if (this.ctx) void this.ctx.close()
    this.ctx = null
  }

  private beep(frequency: number, duration: number, delay = 0): void {
    if (!this.ctx || this.ctx.state !== 'running') return

    const time = this.ctx.currentTime + delay
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = 'square'
    osc.frequency.value = frequency
    gain.gain.setValueAtTime(0.08, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration)
    osc.connect(gain).connect(this.ctx.destination)
    osc.start(time)
    osc.stop(time + duration)
  }

  paddleHit(): void {
    this.beep(440, 0.06)
  }

  wallHit(): void {
    this.beep(330, 0.06)
  }

  score(): void {
    this.beep(220, 0.09)
    this.beep(220, 0.09, 0.12)
  }
}
