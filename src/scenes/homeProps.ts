import Phaser from 'phaser';
import { PROP_KINDS, footprint } from '../content/worldKinds';
import { WORLD_DECOR, doorSpans, worldProps } from '../content/worldProps';
import type { WorldRoom } from '../content/world';
import { FLOOR1_RAISE, HOUSE_WORLD, project } from './homeWorld';
import type { Pt } from './homeWorld';
import { frame } from '../art/manifest';

export const UNIT = 6; // art px per layout height unit
const PALETTE = [0xb08a5c, 0x9c7a52, 0xc2a070, 0x8f6f4c, 0xa9b08a, 0xc99a8a, 0x8aa5b0, 0xd6c08a];

const shade = (c: number, k: number): number => {
  const ch = (v: number): number => Math.min(255, Math.round(v * k));
  return (ch((c >> 16) & 255) << 16) | (ch((c >> 8) & 255) << 8) | ch(c & 255);
};
const hash = (s: string): number => { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };

/**
 * Placeholder decor for one room: every prop of AI-2's `WORLD_DECOR` as a shaded iso box (its FRONT face is lighter, so a
 * wrong facing is visible), wall windows and door gaps. Painter order is by gx + gy. Replaced by baked `prop/<id>` frames.
 */
export function drawRoomProps(scene: Phaser.Scene, c: Phaser.GameObjects.Container, room: WorldRoom): void {
  let g = scene.add.graphics();
  c.add(g);
  const slot = HOUSE_WORLD.find((s) => s.room === room);
  if (!slot) return;
  const raise = slot.floor * FLOOR1_RAISE;
  const P = (x: number, y: number, z: number): Pt => project(slot.wx + x, slot.wy + y, raise + z * UNIT);
  const quad = (col: number, pts: Pt[]): void => { g.fillStyle(col, 1).fillPoints(pts, true); g.lineStyle(1, 0x2a1d14, 0.8).strokePoints(pts, true); };
  const decor = WORLD_DECOR[room];
  for (const w of decor.windows) {
    const t0 = w.t; const t1 = w.t + w.w;
    quad(0xcfe6f0, w.wall === 'R' ? [P(t0, 0, 3), P(t1, 0, 3), P(t1, 0, 8), P(t0, 0, 8)] : [P(0, t0, 3), P(0, t1, 3), P(0, t1, 8), P(0, t0, 8)]);
  }
  for (const d of doorSpans(room)) {
    quad(0x3a281c, d.wall === 'R' ? [P(d.t, 0, 0), P(d.t + 1, 0, 0), P(d.t + 1, 0, 7), P(d.t, 0, 7)] : [P(0, d.t, 0), P(0, d.t + 1, 0), P(0, d.t + 1, 7), P(0, d.t, 7)]);
  }
  for (const m of decor.mounts) {
    const [, wall, t, base] = m;
    quad(0xe0c48a, wall === 'R' ? [P(t, 0, base), P(t + 1, 0, base), P(t + 1, 0, base + 1.5), P(t, 0, base + 1.5)] : [P(0, t, base), P(0, t + 1, base), P(0, t + 1, base + 1.5), P(0, t, base + 1.5)]);
  }
  const props = worldProps(room);
  const topOf = new Map(props.map((p) => [p.id, footprint(p.kind, p.gx, p.gy, p.rot).h]));
  const order = [...props].sort((a, b) => a.gx + a.gy + (a.onTop ? 0.5 : 0) - (b.gx + b.gy + (b.onTop ? 0.5 : 0)));
  for (const p of order) {
    if (!PROP_KINDS[p.kind] || PROP_KINDS[p.kind].mount) continue;
    const f = footprint(p.kind, p.gx, p.gy, p.rot);
    const z0 = p.onTop ? topOf.get(p.onTop) ?? 0 : 0;
    const h = PROP_KINDS[p.kind].flat ? 0.15 : f.h;
    const { gx, gy, w, d } = f;
    const art = frame(`prop/${p.kind}`);
    if (art) {
      // Baked art: ground-anchored at the footprint centre; rot 1 faces +gx, so the rot-0 render is mirrored.
      const at = P(gx + w / 2, gy + d / 2, z0);
      const flip = p.rot === 1;
      const img = scene.add.image(at.x, at.y, art.atlas, art.frame).setOrigin((flip ? art.w - art.pivotX : art.pivotX) / art.w, art.pivotY / art.h).setFlipX(flip);
      c.add(img);
      g = scene.add.graphics();
      c.add(g);
      continue;
    }
    const base = PALETTE[hash(p.kind) % PALETTE.length];
    const frontIsDown = p.rot === 0; const frontIsRight = p.rot === 1;
    quad(shade(base, frontIsDown ? 1 : 0.76), [P(gx, gy + d, z0), P(gx + w, gy + d, z0), P(gx + w, gy + d, z0 + h), P(gx, gy + d, z0 + h)]);
    quad(shade(base, frontIsRight ? 1 : 0.88), [P(gx + w, gy, z0), P(gx + w, gy + d, z0), P(gx + w, gy + d, z0 + h), P(gx + w, gy, z0 + h)]);
    quad(shade(base, 1.14), [P(gx, gy, z0 + h), P(gx + w, gy, z0 + h), P(gx + w, gy + d, z0 + h), P(gx, gy + d, z0 + h)]);
  }
}
