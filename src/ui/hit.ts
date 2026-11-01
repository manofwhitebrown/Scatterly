import type { Spot } from '../shared/types';

export const PAD = 8;
export const MIN_HIT = 96;

/** Spot whose centre is nearest the point among those whose >=96x96 hit area (centred on the art) contains it. */
export function pickSpot(list: readonly Spot[], px: number, py: number): Spot | null {
  let best: Spot | null = null;
  let bestD = Infinity;
  for (const spot of list) {
    const hw = Math.max(spot.w + PAD * 2, MIN_HIT) / 2;
    const hh = Math.max(spot.h + PAD * 2, MIN_HIT) / 2;
    const dx = px - (spot.x + spot.w / 2);
    const dy = py - (spot.y + spot.h / 2);
    if (Math.abs(dx) > hw || Math.abs(dy) > hh) continue;
    const d = dx * dx + dy * dy;
    if (d < bestD) {
      bestD = d;
      best = spot;
    }
  }
  return best;
}
