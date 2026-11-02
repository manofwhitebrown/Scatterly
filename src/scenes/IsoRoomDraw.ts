import type Phaser from 'phaser';
import type { IsoPlacement, RoomId } from '../shared/types';
import { ROOM_ORIGIN, project } from '../ui/isoGrid';
import type { ScreenBox } from '../ui/isoGrid';

const TINT: Record<RoomId, number> = {
  entrance: 0xc9a27a, living: 0x8fb3a0, kitchen: 0xd9c27a, bedroom: 0x9a9fcf, bathroom: 0x86c3cf,
};

function shade(c: number, f: number): number {
  const ch = (s: number): number => Math.min(255, Math.round(((c >> s) & 255) * f));
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
}

type P = { x: number; y: number };

/** Placeholder room shell (floor diamond + two back walls). Replaced by AI-4's baked `tex.isoShell`. */
export function drawShell(g: Phaser.GameObjects.Graphics, room: RoomId, cols: number, rows: number): void {
  const o = ROOM_ORIGIN;
  const t = TINT[room];
  const wallH = 10;
  const a = project(o, 0, 0);
  const b = project(o, cols, 0);
  const c = project(o, cols, rows);
  const d = project(o, 0, rows);
  g.fillStyle(shade(t, 0.7), 1).fillPoints([a, b, project(o, cols, 0, wallH), project(o, 0, 0, wallH)], true);
  g.fillStyle(shade(t, 0.55), 1).fillPoints([a, d, project(o, 0, rows, wallH), project(o, 0, 0, wallH)], true);
  g.fillStyle(shade(t, 1.05), 1).fillPoints([a, b, c, d], true);
}

/**
 * Placeholder extruded box, light top / mid left / dark right, no outline. Points are relative to the
 * box centre so the Graphics can sit at the centre and scale tweens pivot there. Replaced by AI-4's
 * baked `tex.isoSpot(kind, open)` textures.
 */
export function drawBox(g: Phaser.GameObjects.Graphics, room: RoomId, p: IsoPlacement, box: ScreenBox, opened: boolean, locked: boolean): void {
  const o = ROOM_ORIGIN;
  const z = p.gz ?? 0;
  const t = TINT[room];
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const at = (gx: number, gy: number, gz: number): P => {
    const s = project(o, gx, gy, gz);
    return { x: s.x - cx, y: s.y - cy };
  };
  const { gx, gy, w, d, h } = p;
  const top = [at(gx, gy, z + h), at(gx + w, gy, z + h), at(gx + w, gy + d, z + h), at(gx, gy + d, z + h)];
  const left = [at(gx, gy + d, z + h), at(gx + w, gy + d, z + h), at(gx + w, gy + d, z), at(gx, gy + d, z)];
  const right = [at(gx + w, gy + d, z + h), at(gx + w, gy, z + h), at(gx + w, gy, z), at(gx + w, gy + d, z)];
  g.clear();
  g.fillStyle(0x000000, 0.18).fillPoints([at(gx, gy + d, z), at(gx + w, gy + d, z), at(gx + w + 0.4, gy + d, z), at(gx + 0.4, gy + d, z)], true);
  g.fillStyle(shade(t, 0.8), 1).fillPoints(left, true);
  g.fillStyle(shade(t, 0.55), 1).fillPoints(right, true);
  g.fillStyle(shade(t, 1.1), 1).fillPoints(top, true);
  if (opened) {
    // door ajar: a dark slot on the left face
    const s = [at(gx + w * 0.15, gy + d, z + h * 0.8), at(gx + w * 0.85, gy + d, z + h * 0.8), at(gx + w * 0.85, gy + d, z + h * 0.15), at(gx + w * 0.15, gy + d, z + h * 0.15)];
    g.fillStyle(0x1c130d, 0.75).fillPoints(s, true);
  }
  if (locked && !opened) {
    // padlock badge on the top face, visible from the start
    const m = at(gx + w / 2, gy + d / 2, z + h);
    g.fillStyle(0xf2a93b, 1).fillRect(m.x - 9, m.y - 4, 18, 14);
    g.lineStyle(3, 0xf2a93b, 1).strokeCircle(m.x, m.y - 6, 6);
    g.fillStyle(0x3a2c1f, 1).fillRect(m.x - 2, m.y, 4, 5);
  }
}
