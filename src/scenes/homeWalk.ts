import type { Cell } from '../logic/path';

export const MAX_WALK_MS = 600;
export const STEP_MS = 110;

/** Total walk time for a path of `cells` cells; 0 (instant) when calm, in Rush, or with walking switched off. */
export function walkMs(cells: number, instant: boolean): number {
  if (instant || cells <= 1) return 0;
  return Math.min(MAX_WALK_MS, (cells - 1) * STEP_MS);
}

/** Facing from the screen-x change of a step: right = 'se', left = 'sw' (the two drawn directions). */
export function facingOf(dsx: number, prev: 'se' | 'sw' = 'se'): 'se' | 'sw' {
  return dsx > 0 ? 'se' : dsx < 0 ? 'sw' : prev;
}

/** Cell where the avatar stands after entering a room: front-centre of the floor. */
export function entryCell(w: number, d: number): Cell {
  return { x: Math.floor(w / 2), y: Math.max(0, d - 2) };
}

/** Next cat wander delay (ms) from a 0..1 roll: 8 to 14 s. */
export const catDelay = (roll: number): number => 8000 + Math.round(Math.min(1, Math.max(0, roll)) * 6000);
