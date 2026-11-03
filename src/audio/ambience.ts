import { bedBuffer, getCtx, isRunning, makeBus } from './engine';

interface BedSpec { lo: number; q: number; level: number; hum?: number; humLevel?: number }

/** One quiet bed per room: filtered noise plus an optional low hum. At most 2 sources per bed. */
const BEDS: Record<string, BedSpec> = {
  entrance: { lo: 500, q: 0.4, level: 0.05 },
  living: { lo: 320, q: 0.5, level: 0.04, hum: 110, humLevel: 0.012 },
  kitchen: { lo: 260, q: 0.6, level: 0.035, hum: 55, humLevel: 0.03 },
  bedroom: { lo: 220, q: 0.5, level: 0.035 },
  bathroom: { lo: 900, q: 0.8, level: 0.03, hum: 82, humLevel: 0.01 },
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

export function syncAmbience(enabled: boolean): void {
  if (!isRunning() || document.hidden || !enabled || !wanted) {
    if (current) {
      stopBed(current, 0.15);
      current = null;
    }
    return;
  }
  if (current && currentRoom === wanted) return;
  if (current) stopBed(current, 0.6);
  current = startBed(wanted);
  currentRoom = current ? wanted : null;
}

let currentRoom: string | null = null;

export function ambienceRoom(): string | null {
  return wanted;
}
