/** Shared AudioContext, master gain and limiter. Everything is lazy and silent-safe before the first user gesture. */
const SFX_GAIN = 0.25;
const MASTER_GAIN = 0.9;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let sfxBus: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;
let bedBuf: AudioBuffer | null = null;

export function getCtx(): AudioContext | null {
  if (ctx) return ctx;
  try {
    const w = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
    const Ctor = w.AudioContext ?? w.webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = MASTER_GAIN;
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -8;
    limiter.knee.value = 0;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.002;
    limiter.release.value = 0.12;
    master.connect(limiter);
    limiter.connect(ctx.destination);
    sfxBus = ctx.createGain();
    sfxBus.gain.value = SFX_GAIN;
    sfxBus.connect(master);
    return ctx;
  } catch {
    ctx = null;
    master = null;
    sfxBus = null;
    return null;
  }
}

/** A new bus into the limited master (music, ambience). Caller owns disconnect. */
export function makeBus(c: AudioContext, gain: number): GainNode {
  getCtx();
  const g = c.createGain();
  g.gain.value = gain;
  g.connect(master ?? c.destination);
  return g;
}

export function getSfxBus(): GainNode | null {
  return sfxBus;
}

export function noiseBuffer(c: AudioContext): AudioBuffer {
  if (noiseBuf) return noiseBuf;
  const len = Math.floor(c.sampleRate * 0.4);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  noiseBuf = buf;
  return buf;
}

/** Two seconds of noise for looping ambience beds (avoids an audible 0.4 s loop). */
export function bedBuffer(c: AudioContext): AudioBuffer {
  if (bedBuf) return bedBuf;
  const len = Math.floor(c.sampleRate * 2);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    last = last * 0.96 + (Math.random() * 2 - 1) * 0.04;
    d[i] = last * 6;
  }
  bedBuf = buf;
  return buf;
}

export function envelope(g: GainNode, t: number, d: number, peak: number, attack = 0.006): void {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + d);
}

export function isRunning(): boolean {
  return !!ctx && ctx.state === 'running';
}

export function suspendCtx(): void {
  try {
    if (ctx && ctx.state === 'running') void ctx.suspend().catch(() => undefined);
  } catch {
    /* ignore */
  }
}

export function resumeCtx(): void {
  try {
    if (ctx && ctx.state === 'suspended') void ctx.resume().catch(() => undefined);
  } catch {
    /* ignore */
  }
}
