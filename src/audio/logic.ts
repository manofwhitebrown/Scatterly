/** Pure audio decisions (no AudioContext) so they can be unit-tested. */
import { AMBIENCE_LOOPS, ROOM_AMBIENCE } from './manifest';
import type { AmbienceLoop } from './manifest';

/** Picks a variant 1..count that differs from the last one played. `rand` is injectable (0..1). */
export function pickVariant(count: number, last: number | undefined, rand: () => number = Math.random): number {
  if (count <= 1) return 1;
  let v = 1 + Math.floor(rand() * count);
  if (v > count) v = count;
  if (v === last) v = (v % count) + 1;
  return v;
}

/** Playback rate for `step` semitones (clamped 0..12) with a small random drift (+-3%). */
export function playbackRate(step: number, rand: () => number = Math.random): number {
  const s = Number.isFinite(step) ? Math.min(12, Math.max(0, Math.floor(step))) : 0;
  return Math.pow(2, s / 12) * (1 + (rand() - 0.5) * 0.06);
}

/** Rush layer gain for an intensity 0..1: silent below 0.15, then an eased rise to 0.8. */
export function tensionGain(level: number): number {
  const x = Number.isFinite(level) ? Math.min(1, Math.max(0, level)) : 0;
  if (x <= 0.15) return 0;
  return 0.8 * Math.pow((x - 0.15) / 0.85, 1.2);
}

/** The loops for a room name (case-insensitive); unknown rooms and null fall back to the outside-of-house loop. */
export function loopsFor(room: string | null): readonly AmbienceLoop[] {
  if (!room) return ROOM_AMBIENCE.overview;
  return ROOM_AMBIENCE[room.toLowerCase()] ?? [];
}

export function isLoopName(x: string): x is AmbienceLoop {
  return (AMBIENCE_LOOPS as readonly string[]).includes(x);
}

/** Track for a morning: the two lo-fi loops alternate by day number, so consecutive days do not sound the same. */
export function trackForDay(day: number): 'lofi_a' | 'lofi_b' {
  return Math.abs(Math.floor(Number.isFinite(day) ? day : 0)) % 2 === 0 ? 'lofi_a' : 'lofi_b';
}
