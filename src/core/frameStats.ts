import Phaser from 'phaser';

const RING = 600; // about 10 s at 60 fps
const SLOW_FRAME_MS = 100;

export interface FrameSummary {
  fps: number; p5Fps: number; p95Ms: number; maxMs: number; slowFrames: number; frames: number;
}

/** Ring buffer of frame times. Recording allocates nothing; summary() is meant for 2 Hz use. */
export class FrameStats {
  private readonly ring = new Float32Array(RING);
  private readonly scratch = new Float32Array(RING);
  private head = 0;
  private filled = 0;
  private last = 0;
  private slow = 0;
  private total = 0;
  private readonly out: FrameSummary = { fps: 0, p5Fps: 0, p95Ms: 0, maxMs: 0, slowFrames: 0, frames: 0 };
  private readonly tick = (): void => this.record(performance.now());

  constructor(private readonly game: Phaser.Game) {
    game.events.on(Phaser.Core.Events.PRE_STEP, this.tick);
  }

  record(now: number): void {
    if (this.last > 0 && !document.hidden) {
      const dt = now - this.last;
      if (dt < 2000) {
        this.ring[this.head] = dt;
        this.head = (this.head + 1) % RING;
        if (this.filled < RING) this.filled++;
        this.total++;
        if (dt > SLOW_FRAME_MS) this.slow++;
      }
    }
    this.last = now;
  }

  /** Forget history, e.g. when Menu is first shown, so boot cost does not pollute the numbers. */
  reset(): void {
    this.head = 0;
    this.filled = 0;
    this.slow = 0;
    this.total = 0;
  }

  summary(): FrameSummary {
    const n = this.filled;
    const o = this.out;
    o.fps = this.game.loop.actualFps;
    o.slowFrames = this.slow;
    o.frames = this.total;
    if (n === 0) {
      o.p5Fps = 0;
      o.p95Ms = 0;
      o.maxMs = 0;
      return o;
    }
    const s = this.scratch.subarray(0, n);
    s.set(this.ring.subarray(0, n));
    s.sort();
    const p95 = s[Math.min(n - 1, Math.floor(n * 0.95))] ?? 0;
    o.p95Ms = p95;
    o.maxMs = s[n - 1] ?? 0;
    o.p5Fps = p95 > 0 ? 1000 / p95 : 0;
    return o;
  }

  destroy(): void {
    this.game.events.off(Phaser.Core.Events.PRE_STEP, this.tick);
  }
}
