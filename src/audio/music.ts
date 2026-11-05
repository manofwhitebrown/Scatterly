import { getCtx, isRunning, makeBus } from './engine';
import { getBuffer, hasBuffer, loadFile } from './bank';
import { Loop } from './loops';
import { tensionGain } from './logic';
import { STING_FILE, TENSION_FILE, musicFile } from './manifest';
import type { MusicTrack } from './manifest';
import { runSynth, setSynthIntensity, stopSynth, synthIntensity, tempoFactor } from './musicSynth';

export { tempoFactor };

const MUSIC_LEVEL = 0.55; // loops are at -16 LUFS; the music bus sits under the sound effects
const FADE = 1.6;

let track: MusicTrack = 'lofi_a';
let running = false; // runMusic called and allowed
let loop: Loop | null = null;
let loopTrack: MusicTrack | null = null;
let tension: Loop | null = null;
let intensity = 0;
let bedTimer: number | null = null;
let ticket = 0; // bumped on every change so a slow download cannot start an outdated track

export function musicTrack(): MusicTrack {
  return track;
}

export function musicIntensity(): number {
  return intensity || synthIntensity();
}

function bus(): GainNode | null {
  const c = getCtx();
  return c ? makeBus(c, MUSIC_LEVEL, 'music') : null;
}

function stopLoop(fade: number): void {
  loop?.stop(fade);
  loop = null;
  loopTrack = null;
}

function startTrack(t: MusicTrack): void {
  const my = ++ticket;
  const buf = getBuffer(musicFile(t));
  const go = (b: AudioBuffer): void => {
    if (my !== ticket || !running || document.hidden) return;
    const dest = bus();
    if (!dest) return;
    stopLoop(FADE);
    stopSynth();
    const l = new Loop(musicFile(t));
    if (l.start(b, dest, 1, FADE)) {
      loop = l;
      loopTrack = t;
      syncTension();
    } else runSynth(true);
  };
  if (buf) go(buf);
  else {
    if (!loop) runSynth(true); // synthesised music until the file arrives
    void loadFile(musicFile(t)).then((b) => {
      if (b) go(b);
    });
  }
}

function syncTension(): void {
  const g = tensionGain(intensity);
  if (g <= 0) {
    tension?.setLevel(0, 0.6);
    return;
  }
  const buf = getBuffer(TENSION_FILE);
  if (!buf) {
    void loadFile(TENSION_FILE).then((b) => {
      if (b) syncTension();
    });
    return;
  }
  if (!tension?.playing) {
    const dest = bus();
    const l = new Loop(TENSION_FILE);
    if (dest && l.start(buf, dest, 0, 1)) tension = l;
  }
  tension?.setLevel(g, 0.8);
}

/** Rush tension 0..1: opens the pulse layer on top of the track (and speeds the synth fallback). */
export function setMusicIntensity(level: number): void {
  intensity = Number.isFinite(level) ? Math.min(1, Math.max(0, level)) : 0;
  setSynthIntensity(intensity);
  if (running && loop) syncTension();
}

/** Switches the background track (crossfade). Remembered, so it also applies when music starts later. */
export function setMusicTrack(t: MusicTrack): void {
  if (t === track && (loopTrack === t || !running)) return;
  track = t;
  if (running) startTrack(t);
}

export function stopMusic(): void {
  running = false;
  ticket++;
  if (bedTimer !== null) window.clearTimeout(bedTimer);
  bedTimer = null;
  stopLoop(0.4);
  tension?.stop(0.4);
  tension = null;
  stopSynth();
}

export function runMusic(allowed: boolean): void {
  if (!allowed || document.hidden || !getCtx() || running) return;
  running = true;
  startTrack(track);
}

/** The win moment: the 6 s sting plays once over a ducked bed, then the calm result bed fades in. Falls back to nothing special. */
export function playResultMoment(): void {
  const c = getCtx();
  if (!running || !c || !isRunning()) return;
  const sting = getBuffer(STING_FILE);
  if (!sting) {
    void loadFile(STING_FILE);
    void loadFile(musicFile('result'));
    setMusicTrack('result');
    return;
  }
  const my = ++ticket;
  stopLoop(0.8);
  tension?.setLevel(0, 0.4);
  stopSynth();
  const dest = bus();
  if (!dest) return;
  const src = c.createBufferSource();
  src.buffer = sting;
  src.connect(dest);
  src.start();
  track = 'result';
  if (bedTimer !== null) window.clearTimeout(bedTimer);
  bedTimer = window.setTimeout(() => {
    bedTimer = null;
    if (my === ticket && running) startTrack('result');
  }, 4500);
}

export function musicLoaded(t: MusicTrack): boolean {
  return hasBuffer(musicFile(t));
}
