export type SfxName = 'tap' | 'open' | 'close' | 'found' | 'clue' | 'error' | 'win' | 'lose' | 'tick' | 'pop' | 'swoosh' | 'coin' | 'snap';

export interface SfxApi {
  unlock(): void;
  play(name: SfxName): void;
  setEnabled(sfx: boolean, music: boolean): void;
  startMusic(): void;
  stopMusic(): void;
}

interface Blip { f: number; to?: number; d: number; at?: number; type?: OscillatorType; g?: number }
interface Recipe { blips: Blip[]; noise?: { at: number; d: number; lo: number; hi: number; g: number } }

const MAX_VOICES = 6;
const MIN_GAP = 0.04;
const SFX_GAIN = 0.25;
const MUSIC_GAIN = 0.12;
const LOOKAHEAD = 0.5;

const RECIPES: Record<SfxName, Recipe> = {
  tap: { blips: [{ f: 660, to: 560, d: 0.07 }] },
  open: { blips: [{ f: 330, to: 440, d: 0.12, type: 'triangle' }], noise: { at: 0, d: 0.06, lo: 600, hi: 1800, g: 0.25 } },
  close: { blips: [{ f: 440, to: 290, d: 0.12, type: 'triangle' }] },
  found: { blips: [{ f: 523, d: 0.09 }, { f: 659, d: 0.09, at: 0.08 }, { f: 784, d: 0.18, at: 0.16 }] },
  clue: { blips: [{ f: 880, d: 0.08 }, { f: 1175, d: 0.14, at: 0.07 }] },
  error: { blips: [{ f: 230, to: 160, d: 0.16, type: 'triangle' }] },
  win: { blips: [{ f: 523, d: 0.12 }, { f: 659, d: 0.12, at: 0.1 }, { f: 784, d: 0.12, at: 0.2 }, { f: 1047, d: 0.25, at: 0.3 }] },
  lose: { blips: [{ f: 392, d: 0.16, type: 'triangle' }, { f: 330, d: 0.16, at: 0.14, type: 'triangle' }, { f: 262, d: 0.24, at: 0.28, type: 'triangle' }] },
  tick: { blips: [{ f: 1200, d: 0.025, g: 0.6 }] },
  pop: { blips: [{ f: 400, to: 800, d: 0.07 }] },
  swoosh: { blips: [], noise: { at: 0, d: 0.2, lo: 300, hi: 2600, g: 0.5 } },
  coin: { blips: [{ f: 988, d: 0.07, type: 'triangle' }, { f: 1319, d: 0.2, at: 0.06, type: 'triangle' }] },
  snap: { blips: [{ f: 600, to: 420, d: 0.04 }], noise: { at: 0, d: 0.03, lo: 1500, hi: 4000, g: 0.5 } },
};

const CHORDS: number[][] = [
  [130.81, 196.0, 246.94, 329.63],
  [110.0, 164.81, 220.0, 261.63],
  [87.31, 130.81, 174.61, 220.0],
  [98.0, 146.83, 196.0, 246.94],
];
const PENTA = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];

let ctx: AudioContext | null = null;
let sfxGain: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;
let sfxOn = true;
let musicOn = true;
let musicWanted = false;
let musicBus: GainNode | null = null;
let timer: number | null = null;
let nextTime = 0;
let step = 0;
let hooked = false;
const voiceEnds: number[] = [];
const lastPlayed: Partial<Record<SfxName, number>> = {};

function getCtx(): AudioContext | null {
  if (ctx) return ctx;
  try {
    const w = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
    const Ctor = w.AudioContext ?? w.webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    sfxGain = ctx.createGain();
    sfxGain.gain.value = SFX_GAIN;
    sfxGain.connect(ctx.destination);
    return ctx;
  } catch {
    ctx = null;
    return null;
  }
}

function noiseBuffer(c: AudioContext): AudioBuffer {
  if (noiseBuf) return noiseBuf;
  const len = Math.floor(c.sampleRate * 0.4);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  noiseBuf = buf;
  return buf;
}

function envelope(g: GainNode, t: number, d: number, peak: number, attack = 0.006): void {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + d);
}

function activeVoices(now: number): number {
  for (let i = voiceEnds.length - 1; i >= 0; i--) if (voiceEnds[i] <= now) voiceEnds.splice(i, 1);
  return voiceEnds.length;
}

function play(name: SfxName): void {
  if (!sfxOn) return;
  const c = ctx;
  const out = sfxGain;
  if (!c || !out || c.state !== 'running') return;
  try {
    const now = c.currentTime;
    const last = lastPlayed[name];
    if (last !== undefined && now - last < MIN_GAP) return;
    if (activeVoices(now) >= MAX_VOICES) return;
    lastPlayed[name] = now;
    const r = RECIPES[name];
    const jitter = 1 + (Math.random() - 0.5) * 0.06;
    let end = now;
    for (const b of r.blips) {
      const t = now + (b.at ?? 0);
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = b.type ?? 'sine';
      osc.frequency.setValueAtTime(b.f * jitter, t);
      if (b.to) osc.frequency.exponentialRampToValueAtTime(b.to * jitter, t + b.d);
      envelope(g, t, b.d, b.g ?? 1);
      osc.connect(g);
      g.connect(out);
      osc.start(t);
      osc.stop(t + b.d + 0.02);
      end = Math.max(end, t + b.d + 0.02);
    }
    if (r.noise) {
      const n = r.noise;
      const t = now + n.at;
      const src = c.createBufferSource();
      src.buffer = noiseBuffer(c);
      const f = c.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.setValueAtTime(n.lo, t);
      f.frequency.exponentialRampToValueAtTime(n.hi, t + n.d);
      f.Q.value = 0.9;
      const g = c.createGain();
      envelope(g, t, n.d, n.g, 0.01);
      src.connect(f);
      f.connect(g);
      g.connect(out);
      src.start(t, Math.random() * 0.1);
      src.stop(t + n.d + 0.02);
      end = Math.max(end, t + n.d + 0.02);
    }
    voiceEnds.push(end);
  } catch {
    /* audio must never break gameplay */
  }
}

function note(c: AudioContext, bus: GainNode, f: number, t: number, d: number, peak: number, type: OscillatorType, attack: number): void {
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = f;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  osc.connect(g);
  g.connect(bus);
  osc.start(t);
  osc.stop(t + d + 0.05);
}

function schedule(): void {
  const c = ctx;
  const bus = musicBus;
  if (!c || !bus || c.state !== 'running') return;
  const eighth = 0.36;
  while (nextTime < c.currentTime + LOOKAHEAD) {
    const bar = Math.floor(step / 8) % CHORDS.length;
    if (step % 8 === 0) {
      for (const f of CHORDS[bar]) note(c, bus, f, nextTime, eighth * 8 + 0.8, 0.07, 'triangle', 0.7);
    }
    if (Math.random() < 0.3) {
      const f = PENTA[Math.floor(Math.random() * PENTA.length)];
      note(c, bus, f, nextTime, 0.6, 0.09, 'sine', 0.01);
    }
    nextTime += eighth;
    step++;
  }
}

function stopTimer(): void {
  if (timer !== null) {
    window.clearInterval(timer);
    timer = null;
  }
  const bus = musicBus;
  if (bus && ctx) {
    try {
      bus.gain.setTargetAtTime(0, ctx.currentTime, 0.04);
    } catch {
      /* ignore */
    }
    window.setTimeout(() => {
      try {
        bus.disconnect();
      } catch {
        /* ignore */
      }
    }, 300);
  }
  musicBus = null;
}

function runMusic(): void {
  const c = getCtx();
  if (!c || timer !== null || !musicOn || document.hidden) return;
  try {
    stopTimer();
    musicBus = c.createGain();
    musicBus.gain.value = MUSIC_GAIN;
    musicBus.connect(c.destination);
    nextTime = c.currentTime + 0.05;
    step = 0;
    timer = window.setInterval(schedule, 100);
    schedule();
  } catch {
    /* ignore */
  }
}

function hookVisibility(): void {
  if (hooked) return;
  hooked = true;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopTimer();
    } else if (musicWanted && musicOn) {
      runMusic();
    }
  });
}

export const sfx: SfxApi = {
  unlock(): void {
    try {
      const c = getCtx();
      hookVisibility();
      if (c && c.state === 'suspended') void c.resume().catch(() => undefined);
      if (c && musicWanted && musicOn) runMusic();
    } catch {
      /* ignore */
    }
  },
  play,
  setEnabled(sfxEnabled: boolean, musicEnabled: boolean): void {
    sfxOn = sfxEnabled;
    musicOn = musicEnabled;
    if (!musicOn) stopTimer();
    else if (musicWanted) runMusic();
  },
  startMusic(): void {
    musicWanted = true;
    if (!musicOn || !getCtx()) return;
    hookVisibility();
    runMusic();
  },
  stopMusic(): void {
    musicWanted = false;
    stopTimer();
  },
};
