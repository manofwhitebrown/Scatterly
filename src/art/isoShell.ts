import type Phaser from 'phaser';
import { WALL_H, WINDOW_Z } from '../content/layout';
import { ISO, ROOM_ORDER, tex } from '../shared/types';
import type { RoomId } from '../shared/types';
import { faceShade } from './iso';
import { flat, mkCtx, P, quad } from './isoCtx';
import type { Ctx } from './isoCtx';
import { specFor, THEMES } from './isoTheme';
import type { ShellSpec, Theme } from './isoTheme';
import { bake, shade } from './palette';
import type { G } from './palette';

const HW = ISO.tileW / 2;
const HH = ISO.tileH / 2;
export const SHELL_MAX = { w: 960, h: 640 } as const;
export const DEFAULT_ROOM = { cols: 8, rows: 8 } as const;
export { WALL_H };
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
    quad(c, [wallPt(c, w.wall, u0 - 0.08, WINDOW_Z.from - 0.6), wallPt(c, w.wall, u1 + 0.08, WINDOW_Z.from - 0.6), wallPt(c, w.wall, u1 + 0.08, WINDOW_Z.to + 0.2), wallPt(c, w.wall, u0 - 0.08, WINDOW_Z.to + 0.2)], shade(t.trim, shadeK));
    quad(c, [wallPt(c, w.wall, u0, WINDOW_Z.from - 0.45), wallPt(c, w.wall, u1, WINDOW_Z.from - 0.45), wallPt(c, w.wall, u1, WINDOW_Z.to), wallPt(c, w.wall, u0, WINDOW_Z.to)], shade(0xbfe0f2, shadeK));
    quad(c, [wallPt(c, w.wall, u0, (WINDOW_Z.from + WINDOW_Z.to) / 2 + 0.6), wallPt(c, w.wall, u1, (WINDOW_Z.from + WINDOW_Z.to) / 2 + 0.6), wallPt(c, w.wall, u1, WINDOW_Z.to), wallPt(c, w.wall, u0, WINDOW_Z.to)], shade(0xe6f4fb, shadeK));
    const mid = (u0 + u1) / 2;
    quad(c, [wallPt(c, w.wall, mid - 0.04, WINDOW_Z.from - 0.45), wallPt(c, w.wall, mid + 0.04, WINDOW_Z.from - 0.45), wallPt(c, w.wall, mid + 0.04, WINDOW_Z.to), wallPt(c, w.wall, mid - 0.04, WINDOW_Z.to)], shade(t.trim, shadeK));
  }
}

function doors(c: Ctx, s: ShellSpec, t: Theme): void {
  const H = 5.6;
  for (const d of s.doors) {
    const k = d.wall === 'left' ? 0 : -0.25;
    const u0 = d.at + 0.08;
    const u1 = d.at + 0.92;
    quad(c, [wallPt(c, d.wall, u0 - 0.06, 0.5), wallPt(c, d.wall, u1 + 0.06, 0.5), wallPt(c, d.wall, u1 + 0.06, H + 0.25), wallPt(c, d.wall, u0 - 0.06, H + 0.25)], shade(t.trim, k));
    quad(c, [wallPt(c, d.wall, u0, 0.5), wallPt(c, d.wall, u1, 0.5), wallPt(c, d.wall, u1, H), wallPt(c, d.wall, u0, H)], shade(t.accent, k));
    quad(c, [wallPt(c, d.wall, u0 + 0.12, 3.2), wallPt(c, d.wall, u1 - 0.12, 3.2), wallPt(c, d.wall, u1 - 0.12, H - 0.5), wallPt(c, d.wall, u0 + 0.12, H - 0.5)], shade(t.accent, k - 0.12));
    const kn = wallPt(c, d.wall, u1 - 0.14, 2.8);
    c.g.fillStyle(0xe8b84a, 1);
    c.g.fillCircle(kn[0], kn[1], 2.4);
  }
}

/** Kit v1 shell: floor material, walls with skirting, windows with light patches, doors. Rugs, stairs, frames and lamps are PROPS. Origin = top vertex of the floor. */
export function drawShell(g: G, spec: ShellSpec, ox: number, oy: number): void {
  const c = mkCtx(g, { w: spec.cols, d: spec.rows, h: WALL_H }, 0, false, ox, oy);
  const t = THEMES[spec.theme];
  walls(c, spec, t);
  doors(c, spec, t);
  windows(c, spec, t, 'wall');
  floor(c, spec, t);
  windows(c, spec, t, 'light');
}

const queue: RoomId[] = [];
let pumping = false;

/** Bakes one room shell if missing. A single Graphics + generateTexture call per room. Pass a layout-derived spec to override defaults. */
export function ensureRoomShell(scene: Phaser.Scene, room: RoomId, spec: ShellSpec = specFor(room)): void {
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
