import { getCtx } from './engine';

/** One gapless looping buffer on a bus, with its own fade gain. Created per play; `stop` fades and frees it. */
export class Loop {
  private src: AudioBufferSourceNode | null = null;
  private gain: GainNode | null = null;

  constructor(readonly file: string) {}

  get playing(): boolean {
    return this.src !== null;
  }

  start(buf: AudioBuffer, dest: GainNode, level: number, fade: number): boolean {
    const c = getCtx();
    if (!c || this.src) return false;
    try {
      const src = c.createBufferSource();
      src.buffer = buf;
      src.loop = true; // the files are rendered with whole bars and a circular reverb: the wrap point has no click
      const g = c.createGain();
      g.gain.setValueAtTime(0, c.currentTime);
      g.gain.setTargetAtTime(level, c.currentTime, Math.max(0.02, fade / 3));
      src.connect(g);
      g.connect(dest);
      src.start();
      this.src = src;
      this.gain = g;
      return true;
    } catch {
      return false;
    }
  }

  setLevel(level: number, seconds = 0.4): void {
    const c = getCtx();
    if (!c || !this.gain) return;
    this.gain.gain.setTargetAtTime(level, c.currentTime, Math.max(0.02, seconds / 3));
  }

  stop(fade: number): void {
    const c = getCtx();
    const { src, gain } = this;
    this.src = null;
    this.gain = null;
    if (!c || !src || !gain) return;
    try {
      const t = c.currentTime;
      gain.gain.cancelScheduledValues(t);
      gain.gain.setTargetAtTime(0, t, Math.max(0.02, fade / 3));
      src.stop(t + fade + 0.15);
      window.setTimeout(() => {
        try {
          src.disconnect();
          gain.disconnect();
        } catch {
          /* already gone */
        }
      }, (fade + 0.3) * 1000);
    } catch {
      /* ignore */
    }
  }
}
