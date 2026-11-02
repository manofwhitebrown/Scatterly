import { ISO } from '../shared/types';
import type { IsoPlacement, Spot } from '../shared/types';

/** Where grid cell (0,0) sits on screen for a room view. */
export interface IsoOrigin { x: number; y: number }
export const ROOM_ORIGIN: IsoOrigin = { x: 520, y: 190 };

export interface ScreenBox { x: number; y: number; w: number; h: number }

/**
 * Local 2:1 projection of a grid point. Interim helper: AI-4's `src/art/iso.ts` owns
 * `isoToScreen`; swap this for it once it lands (same maths).
 */
export function project(o: IsoOrigin, gx: number, gy: number, gz = 0): { x: number; y: number } {
  return { x: o.x + ((gx - gy) * ISO.tileW) / 2, y: o.y + ((gx + gy) * ISO.tileH) / 2 - gz * ISO.unitH };
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
    const b = isoBox(o, s.iso);
    return { ...s, x: b.x, y: b.y, w: b.w, h: b.h };
  });
}
