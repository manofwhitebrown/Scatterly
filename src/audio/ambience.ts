import { bedBuffer, getCtx, isRunning, makeBus } from './engine';
import { getBuffer, loadFile } from './bank';
import { Loop } from './loops';
import { loopsFor } from './logic';
import { AMBIENCE_LEVEL, ambFile } from './manifest';

interface BedSpec { lo: number; q: number; level: number; hum?: number; humLevel?: number }

/** One quiet bed per room: filtered noise plus an optional low hum. At most 2 sources per bed. */
const BEDS: Record<string, BedSpec> = {
  entrance: { lo: 500, q: 0.4, level: 0.05 },
  living: { lo: 320, q: 0.5, level: 0.04, hum: 110, humLevel: 0.012 },
  kitchen: { lo: 260, q: 0.6, level: 0.035, hum: 55, humLevel: 0.03 },
  bedroom: { lo: 220, q: 0.5, level: 0.035 },
  bathroom: { lo: 900, q: 0.8, level: 0.03, hum: 82, humLevel: 0.01 },
  // Chill beds (synthesised stand-ins until recorded loops are packed): rain, birds (airy), fire, night.
  rain: { lo: 2600, q: 0.3, level: 0.06 },
  birds: { lo: 4200, q: 1.1, level: 0.02, hum: 330, humLevel: 0.004 },
  fire: { lo: 700, q: 0.7, level: 0.045, hum: 70, humLevel: 0.012 },
  night: { lo: 180, q: 0.4, level: 0.03, hum: 58, humLevel: 0.01 },
};

interface Bed { bus: GainNode; src: AudioBufferSourceNode; hum: OscillatorNode | null }

let current: Bed | null = null;
let wanted: string | null = null;

function stopBed(bed: Bed, fade: number): void {
  const c = getCtx();
  if (!c) return;
  try {
    const t = c.currentTime;
    bed.bus.gain.cancelScheduledValues(t);
    bed.bus.gain.setTargetAtTime(0, t, fade / 3);
    const end = t + fade + 0.1;
    bed.src.stop(end);
    bed.hum?.stop(end);
    window.setTimeout(() => {
      try {
        bed.bus.disconnect();
      } catch {
        /* ignore */
      }
    }, (fade + 0.2) * 1000);
  } catch {
    /* ignore */
  }
}

function startBed(room: string): Bed | null {
  const c = getCtx();
  const spec = BEDS[room];
  if (!c || !spec) return null;
  try {
    const bus = makeBus(c, 0, 'ambience');
    const src = c.createBufferSource();
    src.buffer = bedBuffer(c);
    src.loop = true;
    const f = c.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = spec.lo;
    f.Q.value = spec.q;
    const ng = c.createGain();
    ng.gain.value = spec.level;
    src.connect(f);
    f.connect(ng);
    ng.connect(bus);
    src.start();
    let hum: OscillatorNode | null = null;
    if (spec.hum) {
      hum = c.createOscillator();
      hum.type = 'sine';
      hum.frequency.value = spec.hum;
      const hg = c.createGain();
      hg.gain.value = spec.humLevel ?? 0.01;
      hum.connect(hg);
      hg.connect(bus);
      hum.start();
    }
    bus.gain.setTargetAtTime(1, c.currentTime, 0.2);
    return { bus, src, hum };
  } catch {
    return null;
  }
}

/** Crossfades to the room's bed (about 0.6 s). `null` fades out. Remembers the room so it can resume after a pause. */
export function setAmbience(room: string | null, enabled: boolean): void {
  wanted = room;
  syncAmbience(enabled);
}

let sampleLoops: Loop[] = [];
let sampleRoom: string | null = null;
let lastEnabled = true;

function stopSamples(fade: number): void {
  for (const l of sampleLoops) l.stop(fade);
  sampleLoops = [];
  sampleRoom = null;
}

/** Starts the room's recorded loops once all of them are decoded. Returns true when they are playing (the synth bed is not needed). */
function trySamples(room: string): boolean {
  const names = loopsFor(room);
  if (names.length === 0) return false;
  const bufs = names.map((n) => getBuffer(ambFile(n)));
  if (bufs.some((b) => !b)) {
    for (const n of names) void loadFile(ambFile(n)).then((b) => b && wanted === room && syncAmbience(lastEnabled));
    return false;
  }
  if (sampleRoom === room && sampleLoops.length > 0) return true;
  const c = getCtx();
  if (!c) return false;
  stopSamples(0.8);
  const bus = makeBus(c, 1, 'ambience');
  names.forEach((n, i) => {
    const l = new Loop(ambFile(n));
    if (l.start(bufs[i] as AudioBuffer, bus, AMBIENCE_LEVEL[n], 1.2)) sampleLoops.push(l);
  });
  sampleRoom = room;
  return sampleLoops.length > 0;
}

export function syncAmbience(enabled: boolean): void {
  lastEnabled = enabled;
  if (!isRunning() || document.hidden || !enabled || !wanted) {
    stopSamples(0.15);
    if (current) {
      stopBed(current, 0.15);
      current = null;
      currentRoom = null;
    }
    return;
  }
  if (trySamples(wanted)) {
    if (current) {
      stopBed(current, 0.8);
      current = null;
      currentRoom = null;
    }
    return;
  }
  if (sampleRoom !== wanted) stopSamples(0.6);
  if (current && currentRoom === wanted) return;
  if (current) stopBed(current, 0.6);
  current = startBed(wanted);
  currentRoom = current ? wanted : null;
}

let currentRoom: string | null = null;

export function ambienceRoom(): string | null {
  return wanted;
}
