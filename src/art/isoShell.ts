import type Phaser from 'phaser';
import { ISO, ROOM_ORDER, tex } from '../shared/types';
import type { RoomId } from '../shared/types';
import { faceShade } from './iso';
import { bake, poly, shade } from './palette';
import type { G } from './palette';

const HW = ISO.tileW / 2;
const HH = ISO.tileH / 2;
export const WALL_H = 6; // height units
export const SHELL_MAX = { w: 960, h: 640 } as const;
/** Default room size in cells until AI-2's LAYOUTS drive it. */
export const DEFAULT_ROOM = { cols: 8, rows: 8 } as const;

export const ROOM_BASE: Record<RoomId, { floor: number; wall: number }> = {
  entrance: { floor: 0xc4a37a, wall: 0xd9c9a8 },
  living: { floor: 0xbfa58a, wall: 0xa9bba0 },
  kitchen: { floor: 0xd8d2c4, wall: 0xe6cf8a },
  bedroom: { floor: 0xc9b3a4, wall: 0xe0b3b6 },
  bathroom: { floor: 0xcdd9dd, wall: 0xa6cbe0 },
};

export function shellSize(cols = DEFAULT_ROOM.cols, rows = DEFAULT_ROOM.rows): { w: number; h: number; ox: number; oy: number } {
  const wallPx = WALL_H * ISO.unitH;
  return { w: Math.ceil((cols + rows) * HW) + 2, h: Math.ceil((cols + rows) * HH + wallPx) + 2, ox: rows * HW + 1, oy: wallPx + 1 };
}

/** Kit v0 shell: floor diamond + two back walls (left wall along the gy axis, right wall along the gx axis). Origin = top vertex of the floor. */
export function drawShell(g: G, room: RoomId, cols: number, rows: number, ox: number, oy: number): void {
  const c = ROOM_BASE[room];
  const wallPx = WALL_H * ISO.unitH;
  const T = [ox, oy];
  const R = [ox + cols * HW, oy + cols * HH];
  const L = [ox - rows * HW, oy + rows * HH];
  const B = [ox + (cols - rows) * HW, oy + (cols + rows) * HH];
  const wl = faceShade(c.wall);
  poly(g, [L[0], L[1] - wallPx, T[0], T[1] - wallPx, T[0], T[1], L[0], L[1]], wl.left, null);
  poly(g, [T[0], T[1] - wallPx, R[0], R[1] - wallPx, R[0], R[1], T[0], T[1]], wl.right, null);
  poly(g, [L[0], L[1] - 6, T[0], T[1] - 6, T[0], T[1], L[0], L[1]], shade(c.wall, -0.2), null);
  poly(g, [T[0], T[1] - 6, R[0], R[1] - 6, R[0], R[1], T[0], T[1]], shade(c.wall, -0.4), null);
  poly(g, [...T, ...R, ...B, ...L], faceShade(c.floor).top, null);
}

const baked = new Set<string>();
const queue: RoomId[] = [];
let pumping = false;

/** Bakes one room shell if missing. A single Graphics + generateTexture call per room (well under 8 ms of work). */
export function ensureRoomShell(scene: Phaser.Scene, room: RoomId): void {
  const key = tex.isoShell(room);
  if (scene.textures.exists(key)) return;
  try {
    const s = shellSize();
    bake(scene, key, s.w, s.h, (g) => drawShell(g, room, DEFAULT_ROOM.cols, DEFAULT_ROOM.rows, s.ox, s.oy));
    baked.add(key);
  } catch {
    /* callers guard with textures.exists */
  }
}

/** Queues shells and bakes them one per frame so no frame does more than one room's work. */
export function prefetchRoomShells(scene: Phaser.Scene, rooms: readonly RoomId[] = ROOM_ORDER): void {
  for (const r of rooms) if (!queue.includes(r) && !scene.textures.exists(tex.isoShell(r))) queue.push(r);
  if (pumping) return;
  pumping = true;
  const tick = (): void => {
    const next = queue.shift();
    if (!next || !scene.sys?.isActive()) {
      pumping = false;
      queue.length = 0;
      return;
    }
    ensureRoomShell(scene, next);
    scene.time.delayedCall(0, tick);
  };
  scene.time.delayedCall(0, tick);
}
