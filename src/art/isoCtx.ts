import { ISO_LEGACY } from '../shared/types';
import { faceShade } from './iso';
import type { IsoDims } from './iso';
import { poly, softShadow } from './palette';
import type { G } from './palette';

const HW = ISO_LEGACY.tileW / 2;
const HH = ISO_LEGACY.tileH / 2;
const U = ISO_LEGACY.unitH;

/** Drawing context for one furniture piece. a runs along gx, b along gy, z is height in units. */
export interface Ctx { g: G; w: number; d: number; h: number; ox: number; oy: number; base: number; open: boolean; k?: number }
export type Pt = [number, number];

export function mkCtx(g: G, dims: IsoDims, base: number, open: boolean, ox: number, oy: number, k = 1): Ctx {
  return { g, w: dims.w, d: dims.d, h: dims.h, ox, oy, base, open, k };
}

/** Screen point of footprint coordinate (a, b) at height z. */
export function P(c: Ctx, a: number, b: number, z: number): Pt {
  const k = c.k ?? 1;
  return [c.ox + (a - b) * HW * k, c.oy + (a + b) * HH * k - z * U * k];
}

export function quad(c: Ctx, pts: Pt[], color: number, alpha = 1): void {
  poly(c.g, pts.flatMap((p) => p), color, null, alpha);
}

/** Sub-box in footprint coordinates with 3-tone faces (left face = front, plane b = b1). */
export function box(c: Ctx, a0: number, b0: number, z0: number, a1: number, b1: number, z1: number, color: number): void {
  const f = faceShade(color);
  quad(c, [P(c, a0, b1, z0), P(c, a1, b1, z0), P(c, a1, b1, z1), P(c, a0, b1, z1)], f.left);
  quad(c, [P(c, a1, b1, z0), P(c, a1, b0, z0), P(c, a1, b0, z1), P(c, a1, b1, z1)], f.right);
  quad(c, [P(c, a0, b0, z1), P(c, a1, b0, z1), P(c, a1, b1, z1), P(c, a0, b1, z1)], f.top);
}

/** Rectangle on the front (left) face, u along the face in cells, v in height units. */
export function front(c: Ctx, u0: number, v0: number, u1: number, v1: number, color: number, alpha = 1): void {
  quad(c, [P(c, u0, c.d, v0), P(c, u1, c.d, v0), P(c, u1, c.d, v1), P(c, u0, c.d, v1)], color, alpha);
}

/** Rectangle on the side (right) face, u along the face from front to back. */
export function side(c: Ctx, u0: number, v0: number, u1: number, v1: number, color: number, alpha = 1): void {
  quad(c, [P(c, c.w, c.d - u0, v0), P(c, c.w, c.d - u1, v0), P(c, c.w, c.d - u1, v1), P(c, c.w, c.d - u0, v1)], color, alpha);
}

/** Flat rectangle on the horizontal plane z. */
export function flat(c: Ctx, a0: number, b0: number, a1: number, b1: number, z: number, color: number, alpha = 1): void {
  quad(c, [P(c, a0, b0, z), P(c, a1, b0, z), P(c, a1, b1, z), P(c, a0, b1, z)], color, alpha);
}

export function dot(c: Ctx, p: Pt, r: number, color: number): void {
  c.g.fillStyle(color, 1);
  c.g.fillCircle(p[0], p[1], r);
}

/** Door on the front face hinged at u0 and swung open (free edge moves toward the viewer). */
export function ajar(c: Ctx, u0: number, u1: number, v0: number, v1: number, color: number, swing = 15): void {
  const [dx, dy] = [-swing, swing * 0.5];
  const a = P(c, u0, c.d, v0);
  const b = P(c, u1, c.d, v0);
  const e = P(c, u1, c.d, v1);
  const d = P(c, u0, c.d, v1);
  quad(c, [a, [b[0] + dx, b[1] + dy], [e[0] + dx, e[1] + dy], d], color);
}

export function shadow(c: Ctx): void {
  const b = P(c, c.w, c.d, 0);
  softShadow(c.g, b[0] - (c.w - c.d) * HW * 0, b[1] - 3, (c.w + c.d) * HW * 1.05, 10, 0.2);
}
