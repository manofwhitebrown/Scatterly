import Phaser from 'phaser';
import type { WorldRoom } from '../content/world';
import type { RoomId } from '../shared/types';
import { FLOOR1_RAISE, HOUSE_WORLD, ROOM_SIZE, SLAB_PX, WALL_PX, project } from './homeWorld';

const TINT: Record<string, { floor: number; wallL: number; wallR: number }> = {
  entrance: { floor: 0xc99a62, wallL: 0xe3c28f, wallR: 0xd9b27a },
  living: { floor: 0xb97a4c, wallL: 0xe8b98a, wallR: 0xdba878 },
  kitchen: { floor: 0xd9c28a, wallL: 0xf1dca0, wallR: 0xe6cb86 },
  bathroom: { floor: 0x9bc3b8, wallL: 0xc9e3da, wallR: 0xb7d6cb },
  bedroom: { floor: 0xa8704a, wallL: 0xd99aa0, wallR: 0xc98890 },
  study: { floor: 0x8d6a4a, wallL: 0xb8a37a, wallR: 0xa89466 },
};
const poly = (g: Phaser.GameObjects.Graphics, c: number, pts: Array<{ x: number; y: number }>): void => {
  g.fillStyle(c, 1).fillPoints(pts, true);
  g.lineStyle(1, 0x3b2a1c, 1).strokePoints(pts, true);
};

/** Placeholder cutaway shell for one room (floor slab, two back walls) in art px; replaced by shell frames when art lands. */
export function drawRoomShell(g: Phaser.GameObjects.Graphics, room: RoomId): void {
  const slot = HOUSE_WORLD.find((s) => s.room === room);
  const size = ROOM_SIZE[room as WorldRoom] as { w: number; d: number } | undefined;
  if (!slot || !size) return;
  const t = TINT[room] ?? TINT.living;
  const h = slot.floor * FLOOR1_RAISE;
  const P = (gx: number, gy: number, z = 0) => project(slot.wx + gx, slot.wy + gy, h + z);
  const { w, d } = size;
  poly(g, 0x5a4030, [P(0, d), P(w, d), { x: P(w, d).x, y: P(w, d).y + SLAB_PX }, { x: P(0, d).x, y: P(0, d).y + SLAB_PX }]);
  poly(g, t.floor, [P(0, 0), P(w, 0), P(w, d), P(0, d)]);
  poly(g, t.wallL, [P(0, 0), P(0, d), P(0, d, WALL_PX), P(0, 0, WALL_PX)]);
  poly(g, t.wallR, [P(0, 0), P(w, 0), P(w, 0, WALL_PX), P(0, 0, WALL_PX)]);
  g.lineStyle(1, 0x3b2a1c, 0.35);
  for (let i = 1; i < w; i++) g.lineBetween(P(i, 0).x, P(i, 0).y, P(i, d).x, P(i, d).y);
  for (let j = 1; j < d; j++) g.lineBetween(P(0, j).x, P(0, j).y, P(w, j).x, P(w, j).y);
}
