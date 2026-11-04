import Phaser from 'phaser';
import { STAIRS } from '../content/world';
import type { WorldRoom } from '../content/world';
import { frame } from '../art/manifest';
import { UNIT } from './homeWorld';
import { FLOOR1_RAISE, HOUSE_WORLD, project } from './homeWorld';
import type { Pt } from './homeWorld';
import { RISE_UNITS, STEPS, shade, slotOf, stairsPolygon, stairsTarget } from './homeGeometry';
export { stairsPolygon, stairsTarget };

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
