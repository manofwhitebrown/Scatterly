import type Phaser from 'phaser';
import { ISO, ROOM_ORDER, tex } from '../shared/types';
import type { RoomId } from '../shared/types';
import { faceShade } from './iso';
import { box, flat, mkCtx, P, quad } from './isoCtx';
import type { Ctx } from './isoCtx';
import { DEFAULT_SPECS, THEMES } from './isoTheme';
import type { ShellSpec, Theme } from './isoTheme';
import { bake, shade } from './palette';
import type { G } from './palette';

const HW = ISO.tileW / 2;
const HH = ISO.tileH / 2;
export const WALL_H = 6; // height units
export const SHELL_MAX = { w: 960, h: 640 } as const;
export const DEFAULT_ROOM = { cols: 8, rows: 8 } as const;
const PADS = 4;

export function shellSize(cols: number = DEFAULT_ROOM.cols, rows: number = DEFAULT_ROOM.rows): { w: number; h: number; ox: number; oy: number } {
  const wallPx = WALL_H * ISO.unitH;
  return { w: Math.ceil((cols + rows) * HW) + 2 * PADS, h: Math.ceil((cols + rows) * HH + wallPx) + 2 * PADS, ox: rows * HW + PADS, oy: wallPx + PADS };
}

/** Point on the left wall (plane a = 0): u = b along the wall. */
const lw = (c: Ctx, u: number, v: number): [number, number] => P(c, 0, u, v);
/** Point on the right wall (plane b = 0): u = a along the wall. */
const rw = (c: Ctx, u: number, v: number): [number, number] => P(c, u, 0, v);
const wallPt = (c: Ctx, wall: 'left' | 'right', u: number, v: number): [number, number] => (wall === 'left' ? lw(c, u, v) : rw(c, u, v));

function floor(c: Ctx, s: ShellSpec, t: Theme): void {
  for (let b = 0; b < s.rows; b++) {
    for (let a = 0; a < s.cols; a++) {
      if (t.floor === 'tiles') flat(c, a, b, a + 1, b + 1, 0, (a + b) % 2 === 0 ? t.floorA : t.floorB);
      else flat(c, a, b, a + 1, b + 1, 0, b % 2 === 0 ? t.floorA : t.floorB);
    }
  }
  if (t.floor === 'planks') {
    for (let b = 0; b < s.rows; b++) for (let a = 1 + (b % 3); a < s.cols; a += 3) flat(c, a - 0.04, b, a, b + 1, 0, shade(t.floorB, -0.12));
  }
  if (s.rug) {
    const r = s.rug;
    flat(c, r.a, r.b, r.a + r.w, r.b + r.d, 0, shade(t.rug, -0.2));
    flat(c, r.a + 0.12, r.b + 0.12, r.a + r.w - 0.12, r.b + r.d - 0.12, 0, t.rug);
    flat(c, r.a + 0.4, r.b + 0.4, r.a + r.w - 0.4, r.b + r.d - 0.4, 0, t.rugB);
    for (let a = r.a + 0.7; a < r.a + r.w - 0.5; a += 0.6) flat(c, a, r.b + 0.5, a + 0.2, r.b + r.d - 0.5, 0, t.rug, 0.7);
  }
}

function walls(c: Ctx, s: ShellSpec, t: Theme): void {
  const f = faceShade(t.wall);
  quad(c, [lw(c, 0, 0), lw(c, s.rows, 0), lw(c, s.rows, WALL_H), lw(c, 0, WALL_H)], f.left);
  quad(c, [rw(c, 0, 0), rw(c, s.cols, 0), rw(c, s.cols, WALL_H), rw(c, 0, WALL_H)], f.right);
  if (t.floor === 'tiles') {
    quad(c, [lw(c, 0, 0), lw(c, s.rows, 0), lw(c, s.rows, 2.2), lw(c, 0, 2.2)], shade(t.trim, -0.08));
    quad(c, [rw(c, 0, 0), rw(c, s.cols, 0), rw(c, s.cols, 2.2), rw(c, 0, 2.2)], shade(t.trim, -0.32));
  }
  quad(c, [lw(c, 0, 0), lw(c, s.rows, 0), lw(c, s.rows, 0.5), lw(c, 0, 0.5)], shade(t.trim, -0.05));
  quad(c, [rw(c, 0, 0), rw(c, s.cols, 0), rw(c, s.cols, 0.5), rw(c, 0, 0.5)], shade(t.trim, -0.3));
  quad(c, [lw(c, 0, WALL_H - 0.2), lw(c, s.rows, WALL_H - 0.2), lw(c, s.rows, WALL_H), lw(c, 0, WALL_H)], t.trim);
  quad(c, [rw(c, 0, WALL_H - 0.2), rw(c, s.cols, WALL_H - 0.2), rw(c, s.cols, WALL_H), rw(c, 0, WALL_H)], shade(t.trim, -0.25));
}

function lightPatch(c: Ctx, w: ShellSpec['windows'][number], u0: number, u1: number): void {
  const r = 1.5;
  const k = 0.8;
  if (w.wall === 'left') quad(c, [P(c, 0.05, u0, 0), P(c, 0.05, u1, 0), P(c, r, u1 + k, 0), P(c, r, u0 + k, 0)], 0xfff4cf, 0.17);
  else quad(c, [P(c, u0, 0.05, 0), P(c, u1, 0.05, 0), P(c, u1 + k, r, 0), P(c, u0 + k, r, 0)], 0xfff4cf, 0.15);
}

function windows(c: Ctx, s: ShellSpec, t: Theme, pass: 'wall' | 'light'): void {
  for (const w of s.windows) {
    const shadeK = w.wall === 'left' ? 0 : -0.25;
    const u0 = w.at;
    const u1 = w.at + w.w;
    if (pass === 'light') {
      lightPatch(c, w, u0, u1);
      continue;
    }
    quad(c, [wallPt(c, w.wall, u0 - 0.08, 2.4), wallPt(c, w.wall, u1 + 0.08, 2.4), wallPt(c, w.wall, u1 + 0.08, 5.2), wallPt(c, w.wall, u0 - 0.08, 5.2)], shade(t.trim, shadeK));
    quad(c, [wallPt(c, w.wall, u0, 2.55), wallPt(c, w.wall, u1, 2.55), wallPt(c, w.wall, u1, 5.05), wallPt(c, w.wall, u0, 5.05)], shade(0xbfe0f2, shadeK));
    quad(c, [wallPt(c, w.wall, u0, 3.8), wallPt(c, w.wall, u1, 3.8), wallPt(c, w.wall, u1, 5.05), wallPt(c, w.wall, u0, 5.05)], shade(0xe6f4fb, shadeK));
    const mid = (u0 + u1) / 2;
    quad(c, [wallPt(c, w.wall, mid - 0.04, 2.55), wallPt(c, w.wall, mid + 0.04, 2.55), wallPt(c, w.wall, mid + 0.04, 5.05), wallPt(c, w.wall, mid - 0.04, 5.05)], shade(t.trim, shadeK));
  }
}

function doors(c: Ctx, s: ShellSpec, t: Theme): void {
  for (const d of s.doors) {
    const k = d.wall === 'left' ? 0 : -0.25;
    const u0 = d.at;
    const u1 = d.at + 1.3;
    quad(c, [wallPt(c, d.wall, u0 - 0.1, 0.5), wallPt(c, d.wall, u1 + 0.1, 0.5), wallPt(c, d.wall, u1 + 0.1, 4.5), wallPt(c, d.wall, u0 - 0.1, 4.5)], shade(t.trim, k));
    quad(c, [wallPt(c, d.wall, u0, 0.5), wallPt(c, d.wall, u1, 0.5), wallPt(c, d.wall, u1, 4.3), wallPt(c, d.wall, u0, 4.3)], shade(t.accent, k));
    quad(c, [wallPt(c, d.wall, u0 + 0.15, 2.6), wallPt(c, d.wall, u1 - 0.15, 2.6), wallPt(c, d.wall, u1 - 0.15, 4.0), wallPt(c, d.wall, u0 + 0.15, 4.0)], shade(t.accent, k - 0.12));
    const kn = wallPt(c, d.wall, u1 - 0.2, 2.2);
    c.g.fillStyle(0xe8b84a, 1);
    c.g.fillCircle(kn[0], kn[1], 2.4);
  }
}

function stairs(c: Ctx, t: Theme): void {
  for (let i = 4; i >= 0; i--) box(c, 0.15, 0.7 + i * 0.55, 0, 1.55, 1.25 + i * 0.55, (i + 1) * 0.55, shade(t.accent, 0.1 - i * 0.02));
}

function decor(c: Ctx, s: ShellSpec, t: Theme): void {
  const col = shade(t.accent, 0.15);
  quad(c, [rw(c, s.cols - 2.6, 2.8), rw(c, s.cols - 1.6, 2.8), rw(c, s.cols - 1.6, 4.4), rw(c, s.cols - 2.6, 4.4)], shade(t.trim, -0.3));
  quad(c, [rw(c, s.cols - 2.5, 2.9), rw(c, s.cols - 1.7, 2.9), rw(c, s.cols - 1.7, 4.3), rw(c, s.cols - 2.5, 4.3)], shade(col, -0.25));
  quad(c, [lw(c, s.rows - 2.4, 3.0), lw(c, s.rows - 1.6, 3.0), lw(c, s.rows - 1.6, 4.4), lw(c, s.rows - 2.4, 4.4)], t.trim);
  quad(c, [lw(c, s.rows - 2.3, 3.1), lw(c, s.rows - 1.7, 3.1), lw(c, s.rows - 1.7, 4.3), lw(c, s.rows - 2.3, 4.3)], col);
  const lamp = lw(c, 0.8, 4.6);
  c.g.fillStyle(0xfff1b8, 0.25);
  c.g.fillCircle(lamp[0], lamp[1], 14);
  c.g.fillStyle(0xfff1b8, 0.8);
  c.g.fillCircle(lamp[0], lamp[1], 4);
}

/** Kit v1 shell: floor material, rug, walls with skirting, windows with light patches, doors, stairs, wall decor. Origin = top vertex of the floor. */
export function drawShell(g: G, spec: ShellSpec, ox: number, oy: number): void {
  const c = mkCtx(g, { w: spec.cols, d: spec.rows, h: WALL_H }, 0, false, ox, oy);
  const t = THEMES[spec.theme];
  walls(c, spec, t);
  decor(c, spec, t);
  doors(c, spec, t);
  windows(c, spec, t, 'wall');
  floor(c, spec, t);
  windows(c, spec, t, 'light');
  if (spec.stairs) stairs(c, t);
}

const queue: RoomId[] = [];
let pumping = false;

/** Bakes one room shell if missing. A single Graphics + generateTexture call per room. Pass a layout-derived spec to override defaults. */
export function ensureRoomShell(scene: Phaser.Scene, room: RoomId, spec: ShellSpec = DEFAULT_SPECS[room]): void {
  const key = tex.isoShell(room);
  if (scene.textures.exists(key)) return;
  try {
    const s = shellSize(spec.cols, spec.rows);
    bake(scene, key, s.w, s.h, (g) => drawShell(g, spec, s.ox, s.oy));
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
