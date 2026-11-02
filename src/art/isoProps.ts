import type { IsoPlacement, RoomId } from '../shared/types';
import { tex } from '../shared/types';
import { DECOR } from '../content/decor';
import { DECOR_ISO, PROPS } from '../content/layout';
import type { Prop } from '../content/layout';
import { isLeftWall, spriteInfo } from './iso';
import type { IsoDims } from './iso';
import { box, dot, flat, front, mkCtx, P, shadow } from './isoCtx';
import type { Ctx } from './isoCtx';
import { boxTexture } from './iso';
import { drawFurniture, furnitureSize } from './isoFurniture';
import { KIND_COLOR } from './isoBox';
import { shade } from './palette';
import type { G } from './palette';

export interface PropTask { key: string; w: number; h: number; draw: (g: G) => void }

const WOOD = 0xc9a47a;
const CREAM = 0xf1e8d6;
const STEEL = 0xaab4bd;

/** Extra headroom for pieces that rise above their footprint height (hanging lamp cord, stair rise). */
function extraH(kind: string): number {
  return kind === 'lampHang' ? 3 : kind === 'stairsUp' ? 2 : 0;
}

/** Texture key of one prop variant. Prop ids repeat across rooms with different sizes, so the key includes the footprint. */
export function propKey(p: Pick<Prop, 'id' | 'iso'>): string {
  const i = p.iso;
  return tex.isoProp(`${p.id}_${i.w}x${i.d}x${i.h}`);
}

/** Everything AI-3 needs to place a prop: texture key, flipX, origin fractions. Place at isoToScreen(gx, gy, gz). */
export function propSpriteInfo(p: Prop): { key: string; flip: boolean; originX: number; originY: number } {
  const s = spriteInfo(p.iso, extraH(p.kind));
  return { key: propKey(p), flip: s.flip, originX: s.originX, originY: s.originY };
}

/** Wall-plate context: front() and side() work against the wall at a given thickness. */
const plate = (c: Ctx, t: number): Ctx => ({ ...c, d: t });

function frame(c: Ctx): void {
  const pc = plate(c, 0.12);
  box(c, 0.02, 0, 0.02, c.w - 0.02, 0.12, c.h - 0.02, shade(WOOD, -0.2));
  front(pc, 0.12, 0.14, c.w - 0.12, c.h - 0.14, CREAM);
  front(pc, 0.22, 0.24, c.w - 0.22, c.h - 0.24, 0xbfe0f2);
  front(pc, 0.22, 0.24, c.w - 0.22, (c.h - 0.24) * 0.45 + 0.1, 0x8fbf8a);
  dot(c, P(pc, c.w * 0.7, 0.12, c.h * 0.72), 3, 0xfff1b8);
}

function lampFloor(c: Ctx): void {
  box(c, 0.3, 0.3, 0, 0.7, 0.7, 0.12, shade(WOOD, -0.3));
  box(c, 0.46, 0.46, 0.12, 0.54, 0.54, 2.7, shade(WOOD, -0.35));
  box(c, 0.2, 0.2, 2.7, 0.8, 0.8, 3.7, 0xf6e7b4);
  flat(c, 0.25, 0.25, 0.75, 0.75, 3.7, 0xfff6cf);
}

function lampHang(c: Ctx): void {
  const top = c.h + 3;
  box(c, 0.94, 0.94, c.h + 0.3, 1.06, 1.06, top, 0x7b8188);
  box(c, 0.7, 0.7, c.h, 1.3, 1.3, c.h + 0.35, 0x5a5f66);
  box(c, 0.35, 0.35, 0, 1.65, 1.65, 0.5, 0xe8b84a);
  box(c, 0.5, 0.5, 0.5, 1.5, 1.5, 0.75, 0xf2cf6a);
  flat(c, 0.45, 0.45, 1.55, 1.55, 0.02, 0xfff3c4, 0.7);
}

function stool(c: Ctx): void {
  for (const [a, b] of [[0.2, 0.2], [0.68, 0.2], [0.2, 0.68], [0.68, 0.68]]) box(c, a, b, 0, a + 0.12, b + 0.12, 1.5, shade(WOOD, -0.25));
  box(c, 0.12, 0.12, 1.5, 0.88, 0.88, 1.9, WOOD);
}

function pot(c: Ctx): void {
  box(c, 0.2, 0.2, 0, 0.8, 0.8, 1.2, 0xc4785a);
  box(c, 0.15, 0.15, 1.2, 0.85, 0.85, 1.4, shade(0xc4785a, 0.1));
  if (c.h >= 3) {
    box(c, 0.25, 0.3, 1.4, 0.75, 0.7, 2.4, 0x7fb08a);
    box(c, 0.35, 0.38, 2.4, 0.65, 0.62, 3, 0x93c79c);
  } else box(c, 0.45, 0.45, 1.4, 0.55, 0.55, 2.1, 0x3a3f44);
}

function pouf(c: Ctx): void {
  box(c, 0.12, 0.12, 0, 0.88, 0.88, 1.6, 0xb48fa0);
  box(c, 0.08, 0.08, 1.6, 0.92, 0.92, 1.95, shade(0xb48fa0, 0.18));
}

function mat(c: Ctx, id: string): void {
  if (id === 'scale') {
    box(c, 0.15, 0.15, 0, 0.85, 0.85, 0.22, 0xe8eef0);
    flat(c, 0.38, 0.55, 0.62, 0.75, 0.22, 0x8fa9b8);
    return;
  }
  const col = 0xa88f7a;
  flat(c, 0.04, 0.04, c.w - 0.04, c.d - 0.04, 0.1, shade(col, -0.2));
  flat(c, 0.12, 0.12, c.w - 0.12, c.d - 0.12, 0.1, col);
  flat(c, 0.28, 0.28, c.w - 0.28, c.d - 0.28, 0.1, shade(col, 0.2));
}

function stairsUp(c: Ctx): void {
  for (let i = 3; i >= 0; i--) box(c, i * 0.5, 0.1, 0, i * 0.5 + 0.5, 0.9, (i + 1) * 0.55, shade(WOOD, 0.1 - i * 0.05));
  box(c, 0, 0.88, 0, 2, 0.98, 0.1, shade(WOOD, -0.3));
}

function frontDoor(c: Ctx): void {
  const pc = plate(c, 0.12);
  box(c, 0.04, 0, 0, 0.96, 0.14, 7.6, CREAM);
  front(pc, 0.12, 0.2, 0.88, 7.3, 0x8a5a45);
  front(pc, 0.22, 4.2, 0.78, 6.8, 0xbfe0f2, 0.9);
  front(pc, 0.22, 0.5, 0.78, 3.6, shade(0x8a5a45, -0.12));
  dot(c, P(pc, 0.8, 0.12, 3.8), 2.6, 0xe8b84a);
}

function mirror(c: Ctx): void {
  box(c, 0.1, 0, 0.1, 0.9, 0.12, c.h - 0.1, shade(WOOD, -0.1));
  front(plate(c, 0.12), 0.2, 0.2, 0.8, c.h - 0.2, 0xcfe6f0);
  front(plate(c, 0.12), 0.2, c.h * 0.5, 0.8, c.h - 0.2, 0xeaf6fb);
}

function clock(c: Ctx): void {
  const m = P(plate(c, 0.12), 0.5, 0.12, 0.5);
  c.g.fillStyle(0x3a2c24, 1);
  c.g.fillCircle(m[0], m[1], 11);
  c.g.fillStyle(0xf6efe0, 1);
  c.g.fillCircle(m[0], m[1], 9);
  c.g.lineStyle(2, 0x3a2c24, 1);
  c.g.beginPath();
  c.g.moveTo(m[0], m[1]);
  c.g.lineTo(m[0], m[1] - 6);
  c.g.strokePath();
  c.g.beginPath();
  c.g.moveTo(m[0], m[1]);
  c.g.lineTo(m[0] + 4, m[1] + 2);
  c.g.strokePath();
}

function plantHerbs(c: Ctx): void {
  box(c, 0.2, 0, 0, 0.8, 0.3, 0.12, shade(WOOD, -0.2));
  box(c, 0.3, 0.05, 0.12, 0.7, 0.28, 0.5, 0xc4785a);
  box(c, 0.32, 0.08, 0.5, 0.68, 0.24, 0.9, 0x7fb08a);
}

function curtains(c: Ctx): void {
  box(c, 0, 0, c.h - 0.2, c.w, 0.12, c.h, shade(WOOD, -0.3));
  for (const [a0, a1] of [[0.0, 0.5], [c.w - 0.5, c.w]]) {
    box(c, a0, 0.02, 0.2, a1, 0.2, c.h - 0.2, 0xd9a0a0);
    for (let k = 1; k < 3; k++) front(plate(c, 0.2), a0 + (k * (a1 - a0)) / 3, 0.3, a0 + (k * (a1 - a0)) / 3 + 0.04, c.h - 0.3, shade(0xd9a0a0, -0.15));
  }
}

function lampLights(c: Ctx): void {
  for (let i = 0; i < c.w * 2; i++) {
    const a = 0.2 + (i * (c.w - 0.4)) / (c.w * 2 - 1);
    const pt = P(plate(c, 0.1), a, 0.1, 0.35 + (i % 2) * 0.15);
    c.g.fillStyle(0xfff1b8, 0.25);
    c.g.fillCircle(pt[0], pt[1], 6);
    c.g.fillStyle(0xfff8dc, 1);
    c.g.fillCircle(pt[0], pt[1], 2.4);
  }
}

function shelfTowels(c: Ctx): void {
  box(c, 0, 0, 0.05, c.w, 0.4, 0.2, shade(WOOD, -0.1));
  box(c, 0.2, 0.05, 0.25, 0.8, 0.35, 0.65, 0x8fc0c8);
  box(c, 0.9, 0.05, 0.25, 1.5, 0.35, 0.65, 0xe8a9a0);
}

function drawProp(g: G, kind: string, id: string, dims: IsoDims, extra: number): void {
  const t = boxTexture({ ...dims, h: dims.h + extra });
  const c = mkCtx(g, dims, WOOD, false, t.ox, t.oy);
  const floorPiece = !['frame', 'frontDoor', 'mirror', 'clock', 'plantHerbs', 'curtains', 'lampLights', 'shelfTowels', 'lampHang'].includes(kind);
  if (floorPiece && kind !== 'mat' && kind !== 'runner') shadow(c);
  switch (kind) {
    case 'frame': return frame(c);
    case 'lampFloor': return lampFloor(c);
    case 'lampHang': return lampHang(c);
    case 'stool': return stool(c);
    case 'pot': return pot(c);
    case 'pouf': return pouf(c);
    case 'mat': case 'runner': case 'rugBathMat': return mat(c, id);
    case 'stairsUp': return stairsUp(c);
    case 'frontDoor': return frontDoor(c);
    case 'mirror': return mirror(c);
    case 'clock': return clock(c);
    case 'plantHerbs': return plantHerbs(c);
    case 'curtains': return curtains(c);
    case 'lampLights': return lampLights(c);
    case 'shelfTowels': return shelfTowels(c);
    default: box(c, 0.1, 0.1, 0, c.w - 0.1, c.d - 0.1, c.h, WOOD);
  }
}

function taskFor(key: string, kind: string, id: string, iso: IsoPlacement): PropTask {
  const flip = isLeftWall(iso);
  const dims = flip ? { w: iso.d, d: iso.w, h: iso.h } : { w: iso.w, d: iso.d, h: iso.h };
  const e = extraH(kind);
  const t = boxTexture({ ...dims, h: dims.h + e });
  return { key, w: t.w, h: t.h, draw: (g) => drawProp(g, kind, id, dims, e) };
}

/** Every PROPS variant (keyed by id + footprint), the 8 cosmetic decor pieces and the storage decor (keyed by decor id; same art as tex.isoSpot(spotKind), which is the cheaper alias). */
export function propTasks(): PropTask[] {
  const out = new Map<string, PropTask>();
  for (const room of Object.keys(PROPS) as RoomId[]) for (const p of PROPS[room]) out.set(propKey(p), taskFor(propKey(p), p.kind, p.id, p.iso));
  for (const [id, iso] of Object.entries(DECOR_ISO)) out.set(tex.isoProp(id), taskFor(tex.isoProp(id), id === 'rugBathMat' ? 'rugBathMat' : id, id, iso));
  for (const d of DECOR) {
    if (d.kind !== 'storage' || !d.spotKind) continue;
    const kind = d.spotKind;
    const { w, h } = furnitureSize(kind);
    out.set(tex.isoProp(d.id), { key: tex.isoProp(d.id), w, h, draw: (g) => drawFurniture(g, kind, KIND_COLOR[kind], false) });
  }
  return [...out.values()];
}
