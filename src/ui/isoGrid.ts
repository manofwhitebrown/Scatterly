import { ISO_DIMS, isoToScreen } from '../art/iso';
import type { IsoPlacement, Spot } from '../shared/types';

/** Where grid cell (0,0)'s top vertex sits on screen for a room view. */
export interface IsoOrigin { x: number; y: number }
export const ROOM_ORIGIN: IsoOrigin = { x: 640, y: 200 };

export interface ScreenBox { x: number; y: number; w: number; h: number }

/** Screen position of a grid point for a room whose origin is `o` (AI-4's projection, offset). */
export function project(o: IsoOrigin, gx: number, gy: number, gz = 0): { x: number; y: number } {
  const p = isoToScreen(gx, gy, gz);
  return { x: o.x + p.x, y: o.y + p.y };
}

/** The footprint a spot is drawn and hit-tested with: its grid cell plus the canonical size of its kind. */
export function placementOf(s: Pick<Spot, 'kind' | 'iso'>): IsoPlacement {
  const d = ISO_DIMS[s.kind];
  return { gx: s.iso.gx, gy: s.iso.gy, gz: s.iso.gz, w: d.w, d: d.d, h: d.h };
}

/** Screen bounding box of an extruded footprint (left and right corners, top and bottom of the box). */
export function isoBox(o: IsoOrigin, p: IsoPlacement): ScreenBox {
  const gz = p.gz ?? 0;
  const left = project(o, p.gx, p.gy + p.d, gz);
  const right = project(o, p.gx + p.w, p.gy, gz);
  const top = project(o, p.gx, p.gy, gz + p.h);
  const bottom = project(o, p.gx + p.w, p.gy + p.d, gz);
  return { x: left.x, y: top.y, w: right.x - left.x, h: bottom.y - top.y };
}

/** Spot copies whose x,y,w,h are the iso footprint's screen box, so `pickSpot` (>= 96x96, nearest centre) is reused. */
export function screenSpots(o: IsoOrigin, spots: readonly Spot[]): Spot[] {
  return spots.map((s) => {
    const b = isoBox(o, placementOf(s));
    return { ...s, x: b.x, y: b.y, w: b.w, h: b.h };
  });
}

/** Nearest unsearched container (capacity > 0) to `from`, by box centre. Used for the idle shimmer; says nothing about contents. */
export function nearestUnsearched(list: readonly Spot[], searched: (id: Spot['id']) => boolean, from: { x: number; y: number }): Spot | null {
  let best: Spot | null = null;
  let bestD = Infinity;
  for (const s of list) {
    if (s.capacity <= 0 || searched(s.id)) continue;
    const d = (s.x + s.w / 2 - from.x) ** 2 + (s.y + s.h / 2 - from.y) ** 2;
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }
  return best;
}
