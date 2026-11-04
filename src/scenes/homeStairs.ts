import Phaser from 'phaser';
import { STAIRS } from '../content/world';
import type { WorldRoom } from '../content/world';
import type { RoomId } from '../shared/types';
import { frame } from '../art/manifest';
import { UNIT } from './homeProps';
import { FLOOR1_RAISE, HOUSE_WORLD, inside, project } from './homeWorld';
import type { Pt } from './homeWorld';

const STEPS = 6;
const RISE_UNITS = FLOOR1_RAISE / UNIT;

const slotOf = (room: RoomId) => HOUSE_WORLD.find((s) => s.room === room);
const shade = (c: number, k: number): number => {
  const ch = (v: number): number => Math.min(255, Math.round(v * k));
  return (ch((c >> 16) & 255) << 16) | (ch((c >> 8) & 255) << 8) | ch(c & 255);
};

/** The staircase as a tappable shape: its silhouette hexagon in art px for the room that shows it (lower = steps, upper = stairwell). */
export function stairsPolygon(room: RoomId): Pt[] | undefined {
  const slot = slotOf(room);
  if (!slot || (room !== STAIRS.lower && room !== STAIRS.upper)) return undefined;
  const { x, y, w, d } = STAIRS.footprint;
  const raise = slot.floor * FLOOR1_RAISE;
  const H = room === STAIRS.lower ? RISE_UNITS : 1;
  const P = (gx: number, gy: number, z: number): Pt => project(slot.wx + gx, slot.wy + gy, raise + z * UNIT);
  return [P(x, y, H), P(x + w, y, H), P(x + w, y, 0), P(x + w, y + d, 0), P(x, y + d, 0), P(x, y + d, H)];
}

/** Where a tap in `room` leads when it hits the staircase, or undefined. */
export function stairsTarget(room: RoomId, art: Pt): RoomId | undefined {
  const poly = stairsPolygon(room);
  if (!poly || !inside(poly, art)) return undefined;
  return room === STAIRS.lower ? STAIRS.upper : STAIRS.lower;
}

/** Draws the steps in the lower room and a dark stairwell opening in the upper room (decorative placeholder). */
export function drawStairs(g: Phaser.GameObjects.Graphics, room: WorldRoom): void {
  const slot = slotOf(room);
  if (!slot) return;
  const { x, y, w, d } = STAIRS.footprint;
  const raise = slot.floor * FLOOR1_RAISE;
  const P = (gx: number, gy: number, z: number): Pt => project(slot.wx + gx, slot.wy + gy, raise + z * UNIT);
  const quad = (col: number, pts: Pt[]): void => { g.fillStyle(col, 1).fillPoints(pts, true); g.lineStyle(1, 0x16252a, 0.9).strokePoints(pts, true); };
  if (room === STAIRS.upper) { quad(0x1f3338, [P(x, y, 0), P(x + w, y, 0), P(x + w, y + d, 0), P(x, y + d, 0)]); return; }
  if (room !== STAIRS.lower) return;
  const run = d / STEPS;
  for (let i = 0; i < STEPS; i++) {
    const y1 = y + d - i * run; const y0 = y1 - run; const h = ((i + 1) * RISE_UNITS) / STEPS;
    quad(shade(0xd9b27a, 0.8), [P(x, y1, 0), P(x + w, y1, 0), P(x + w, y1, h), P(x, y1, h)]);
    quad(shade(0xd9b27a, 1.1), [P(x, y0, h), P(x + w, y0, h), P(x + w, y1, h), P(x, y1, h)]);
    quad(shade(0xd9b27a, 0.9), [P(x + w, y0, 0), P(x + w, y1, 0), P(x + w, y1, h), P(x + w, y0, h)]);
  }
}

/** Baked staircase art (`prop/stairsUp` below, `shell/house/stairwell` above), centred on the footprint. False when no frame is loaded. */
export function drawStairsArt(scene: Phaser.Scene, c: Phaser.GameObjects.Container, room: WorldRoom): boolean {
  const art = frame(room === STAIRS.lower ? 'prop/stairsUp' : room === STAIRS.upper ? 'shell/house/stairwell' : '');
  const slot = slotOf(room);
  if (!art || !slot) return false;
  const { x, y, w, d } = STAIRS.footprint;
  const at = project(slot.wx + x + w / 2, slot.wy + y + d / 2, slot.floor * FLOOR1_RAISE);
  c.add(scene.add.image(at.x, at.y, art.atlas, art.frame).setOrigin(art.pivotX / art.w, art.pivotY / art.h));
  return true;
}
