export const AMBIENCES = [
  { id: 'rain', label: 'Rain' },
  { id: 'birds', label: 'Birds' },
  { id: 'fire', label: 'Fire' },
  { id: 'night', label: 'Night' },
] as const;
export type AmbienceId = (typeof AMBIENCES)[number]['id'];

export const isAmbience = (id: string): id is AmbienceId => AMBIENCES.some((a) => a.id === id);

export const SLEEP_STEPS = [0, 15, 30, 60] as const; // minutes, 0 = off
export const sleepLabel = (m: number): string => (m === 0 ? 'Off' : `${m} min`);

const IN_MS = 4000;
const OUT_MS = 4000;

/** Paced breathing, 4 s in / 4 s out. k is the circle size 0..1. A relaxation aid, no health claims. */
export function breath(tMs: number): { label: 'Breathe in' | 'Breathe out'; k: number } {
  const t = ((tMs % (IN_MS + OUT_MS)) + IN_MS + OUT_MS) % (IN_MS + OUT_MS);
  if (t < IN_MS) return { label: 'Breathe in', k: t / IN_MS };
  return { label: 'Breathe out', k: 1 - (t - IN_MS) / OUT_MS };
}

export const FOCUS_MIN = 25;
export const BREAK_MIN = 5;

/** Focus 25 / break 5, repeating; nothing ever fails. */
export function focusState(elapsedSec: number): { phase: 'focus' | 'break'; remainingSec: number; round: number } {
  const f = FOCUS_MIN * 60;
  const cycle = f + BREAK_MIN * 60;
  const e = Math.max(0, elapsedSec);
  const round = Math.floor(e / cycle) + 1;
  const into = e % cycle;
  return into < f ? { phase: 'focus', remainingSec: f - into, round } : { phase: 'break', remainingSec: cycle - into, round };
}

/** Whole minutes spent, for the profile counter. */
export const wholeMinutes = (ms: number): number => Math.max(0, Math.floor(ms / 60000));
