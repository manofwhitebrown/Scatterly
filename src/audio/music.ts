import { getCtx, isRunning, makeBus, noiseBuffer } from './engine';

const MUSIC_GAIN = 0.12;
const LOOKAHEAD = 0.5;
const EIGHTH = 0.36;
const CHORDS: number[][] = [
  [130.81, 196.0],
  [110.0, 164.81],
  [87.31, 130.81],
  [98.0, 146.83],
];
const PENTA = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];

let bus: GainNode | null = null;
let timer: number | null = null;
let nextTime = 0;
let step = 0;
let intensity = 0;

/** About +8% tempo at full intensity. */
export function tempoFactor(level: number): number {
  return 1 + 0.08 * Math.min(1, Math.max(0, level));
}

export function setMusicIntensity(level: number): void {
  intensity = Number.isFinite(level) ? Math.min(1, Math.max(0, level)) : 0;
}

export function musicIntensity(): number {
  return intensity;
}

function note(c: AudioContext, out: GainNode, f: number, t: number, d: number, peak: number, type: OscillatorType, attack: number): void {
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = f;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  osc.connect(g);
  g.connect(out);
  osc.start(t);
  osc.stop(t + d + 0.05);
}

function kick(c: AudioContext, out: GainNode, t: number): void {
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.frequency.setValueAtTime(130, t);
  osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.5, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
  osc.connect(g);
  g.connect(out);
  osc.start(t);
  osc.stop(t + 0.16);
}

function hat(c: AudioContext, out: GainNode, t: number): void {
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c);
  const f = c.createBiquadFilter();
  f.type = 'highpass';
  f.frequency.value = 6000;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.12, t + 0.003);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
  src.connect(f);
  f.connect(g);
  g.connect(out);
  src.start(t);
  src.stop(t + 0.05);
}

function schedule(): void {
  const c = getCtx();
  if (!c || !bus || !isRunning()) return;
  const eighth = EIGHTH / tempoFactor(intensity);
  while (nextTime < c.currentTime + LOOKAHEAD) {
    const bar = Math.floor(step / 8) % CHORDS.length;
    if (step % 8 === 0) {
      for (const f of CHORDS[bar]) note(c, bus, f, nextTime, eighth * 8 + 0.2, 0.08, 'triangle', 0.6);
    }
    if (Math.random() < 0.3) note(c, bus, PENTA[Math.floor(Math.random() * PENTA.length)], nextTime, 0.5, 0.09, 'sine', 0.01);
    if (intensity > 0.3 && step % 4 === 0) kick(c, bus, nextTime);
    if (intensity > 0.6 && step % 2 === 1) hat(c, bus, nextTime);
    nextTime += eighth;
    step++;
  }
}

export function stopMusic(): void {
  if (timer !== null) {
    window.clearInterval(timer);
    timer = null;
  }
  const b = bus;
  const c = getCtx();
  if (b && c) {
    try {
      b.gain.setTargetAtTime(0, c.currentTime, 0.04);
    } catch {
      /* ignore */
    }
    window.setTimeout(() => {
      try {
        b.disconnect();
      } catch {
        /* ignore */
      }
    }, 300);
  }
  bus = null;
}

export function runMusic(allowed: boolean): void {
  const c = getCtx();
  if (!c || timer !== null || !allowed || document.hidden) return;
  try {
    stopMusic();
    bus = makeBus(c, MUSIC_GAIN, 'music');
    nextTime = c.currentTime + 0.05;
    step = 0;
    timer = window.setInterval(schedule, 100);
    schedule();
  } catch {
    /* ignore */
  }
}
