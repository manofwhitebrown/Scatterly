import { ISO } from '../shared/types';
import type { SpotKind } from '../shared/types';
import { boxTexture, faceShade } from './iso';
import type { IsoDims } from './iso';
import { poly, shade, softShadow } from './palette';
import type { G } from './palette';

const HW = ISO.tileW / 2;
const HH = ISO.tileH / 2;

/** Base colour per kind for kit v0 (plain extruded boxes). Greyish so setTint can vary pieces between rooms. */
export const KIND_COLOR: Record<SpotKind, number> = {
  drawer: 0xc9a47a, cabinet: 0xd0b08a, fridge: 0xd8dde0, sofa: 0xa9b8a0, table: 0xc9a47a, shelf: 0xbf9a70,
  bed: 0xd9c3b8, wardrobe: 0xb48c64, jacket: 0xa8a29a, bagSpot: 0xb59f86, basket: 0xcfae78, keyHook: 0xb8956a,
  shoeRack: 0xa98a64, sink: 0xdfe6ea, tv: 0x6f7780, charger: 0xbfc4c8, rug: 0xc9a0a0, plant: 0x93b585,
  papers: 0xeee6d2, bin: 0x9aa4ab,
};

/** Draws one extruded box at the texture anchor. open = door ajar: dark opening on the faces plus a pulled-out slab. */
export function drawBox(g: G, dims: IsoDims, base: number, open: boolean, ox: number, oy: number): void {
  const { w, d } = dims;
  const hh = Math.max(0, dims.h) * ISO.unitH;
  const f = faceShade(base);
  const T = [ox, oy];
  const R = [ox + w * HW, oy + w * HH];
  const L = [ox - d * HW, oy + d * HH];
  const B = [ox + (w - d) * HW, oy + (w + d) * HH];
  softShadow(g, B[0], B[1] - 2, (w + d) * HW * 1.1, 10, 0.18);
  if (hh <= 0) {
    poly(g, [...T, ...R, ...B, ...L], f.top, null);
    return;
  }
  poly(g, [L[0], L[1] - hh, B[0], B[1] - hh, B[0], B[1], L[0], L[1]], f.left, null);
  poly(g, [B[0], B[1] - hh, R[0], R[1] - hh, R[0], R[1], B[0], B[1]], f.right, null);
  poly(g, [T[0], T[1] - hh, R[0], R[1] - hh, B[0], B[1] - hh, L[0], L[1] - hh], f.top, null);
  if (!open) return;
  const dark = shade(base, -0.55);
  const m = 0.18;
  const lx0 = L[0] + (B[0] - L[0]) * m;
  const lx1 = L[0] + (B[0] - L[0]) * (1 - m);
  const ly0 = L[1] + (B[1] - L[1]) * m;
  const ly1 = L[1] + (B[1] - L[1]) * (1 - m);
  poly(g, [lx0, ly0 - hh * 0.9, lx1, ly1 - hh * 0.9, lx1, ly1 - hh * 0.15, lx0, ly0 - hh * 0.15], dark, null);
  poly(g, [lx0, ly0 - hh * 0.15, lx1, ly1 - hh * 0.15, lx1 - 10, ly1 - hh * 0.15 + 6, lx0 - 10, ly0 - hh * 0.15 + 6], f.top, null);
}

export function boxTextureFor(dims: IsoDims): { w: number; h: number; draw: (g: G, base: number, open: boolean) => void } {
  const t = boxTexture(dims);
  return { w: t.w, h: t.h, draw: (g, base, open) => drawBox(g, dims, base, open, t.ox, t.oy) };
}
