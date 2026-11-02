import { ISO } from '../shared/types';
import type { IsoPlacement, SpotKind } from '../shared/types';
import { shade } from './palette';

const HW = ISO.tileW / 2;
const HH = ISO.tileH / 2;

/** Screen position (relative to the room origin) of the TOP vertex of the cell (gx, gy) at height gz (height units). */
export function isoToScreen(gx: number, gy: number, gz = 0): { x: number; y: number } {
  return { x: (gx - gy) * HW, y: (gx + gy) * HH - gz * ISO.unitH };
}

/** Inverse of isoToScreen for a point at height gz. Returns fractional grid coordinates. */
export function screenToIso(x: number, y: number, gz = 0): { gx: number; gy: number } {
  const a = x / HW;
  const b = (y + gz * ISO.unitH) / HH;
  return { gx: (a + b) / 2, gy: (b - a) / 2 };
}

/** Painter's-algorithm key: larger draws later (in front). Uses the front corner of the footprint, then height. */
export function depthKey(iso: IsoPlacement): number {
  return (iso.gx + iso.w + iso.gy + iso.d) * 100 + (iso.gz ?? 0) + iso.h * 0.01;
}

export interface Faces { top: number; left: number; right: number }

/** Flat 3-tone shading (Ref A): light top, mid left face, dark right face. */
export function faceShade(base: number): Faces {
  return { top: shade(base, 0.22), left: base, right: shade(base, -0.3) };
}

export interface IsoDims { w: number; d: number; h: number }

/** Canonical footprint per furniture kind in cells (w along gx, d along gy) and height units. Layout data should use these. */
export const ISO_DIMS: Record<SpotKind, IsoDims> = {
  drawer: { w: 2, d: 1, h: 2 }, cabinet: { w: 2, d: 1, h: 4 }, fridge: { w: 1, d: 1, h: 6 },
  sofa: { w: 3, d: 1, h: 2 }, table: { w: 2, d: 2, h: 2 }, shelf: { w: 2, d: 1, h: 5 },
  bed: { w: 3, d: 2, h: 2 }, wardrobe: { w: 2, d: 1, h: 6 }, jacket: { w: 1, d: 1, h: 5 },
  bagSpot: { w: 1, d: 1, h: 2 }, basket: { w: 1, d: 1, h: 2 }, keyHook: { w: 1, d: 1, h: 1 },
  shoeRack: { w: 2, d: 1, h: 1 }, sink: { w: 2, d: 1, h: 2 }, tv: { w: 2, d: 1, h: 3 },
  charger: { w: 1, d: 1, h: 1 }, rug: { w: 3, d: 2, h: 0 }, plant: { w: 1, d: 1, h: 4 },
  papers: { w: 1, d: 1, h: 1 }, bin: { w: 1, d: 1, h: 2 },
};

/** Texture size and anchor for a box: origin is the TOP vertex of the footprint at floor level. */
export function boxTexture(dims: IsoDims): { w: number; h: number; ox: number; oy: number } {
  const hh = Math.max(0, dims.h) * ISO.unitH;
  return {
    w: Math.ceil((dims.w + dims.d) * HW) + 2,
    h: Math.ceil((dims.w + dims.d) * HH + hh) + 2,
    ox: dims.d * HW + 1,
    oy: hh + 1,
  };
}
