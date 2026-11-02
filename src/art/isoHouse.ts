import type Phaser from 'phaser';
import { bake, shade } from './palette';
import type { G } from './palette';

export interface HouseFrameOpts {
  /** Centre x of the first room column and the step between columns (screen px). */
  colX: number; colStep: number; cols: number;
  /** Centre y of the ground and upper room rows. */
  floorY: readonly [number, number];
  /** Displayed size of one room tile. */
  tileW: number; tileH: number;
}

export interface Rect { x: number; y: number; w: number; h: number; color: number }

export const HOUSE_COLOR = { backdrop: 0x26325a, slab: 0x44527f, wall: 0x38456f, roof: 0x7a5560, trim: 0xe6d6b8 } as const;
export const ISO_HOUSE = { roof: 'iso_house_roof', stairs: 'iso_house_stairs' } as const;
const SLAB_H = 24;
const WALL_W = 26;
const ROOF_H = 58;
const EDGE = 10;

/** Pure geometry of the cutaway: where every slab, wall and the roof go. Tested and rendered offline. */
export function houseFrameGeometry(o: HouseFrameOpts): { rects: Rect[]; roof: { x: number; y: number; w: number; h: number }; stairs: { x: number; y: number }; left: number; right: number } {
  const left = o.colX - o.tileW / 2 - EDGE - WALL_W;
  const right = o.colX + (o.cols - 1) * o.colStep + o.tileW / 2 + EDGE + WALL_W;
  const top = o.floorY[1] - o.tileH / 2 + 6;
  const groundTop = o.floorY[0] + o.tileH / 2 - 8;
  const midY = (o.floorY[1] + o.tileH / 2 + o.floorY[0] - o.tileH / 2) / 2;
  const w = right - left;
  const slab = (y: number, sx = left, sw = w): Rect[] => [
    { x: sx, y, w: sw, h: SLAB_H, color: HOUSE_COLOR.slab },
    { x: sx, y, w: sw, h: 5, color: shade(HOUSE_COLOR.slab, 0.25) },
    { x: sx, y: y + SLAB_H - 5, w: sw, h: 5, color: shade(HOUSE_COLOR.slab, -0.3) },
  ];
  const rects: Rect[] = [
    { x: left + WALL_W, y: top, w: w - 2 * WALL_W, h: groundTop - top, color: HOUSE_COLOR.backdrop },
    ...slab(midY - SLAB_H / 2, left, w),
    ...slab(groundTop, left - 14, w + 28),
    { x: left, y: top, w: WALL_W, h: groundTop - top + SLAB_H, color: HOUSE_COLOR.wall },
    { x: left + WALL_W - 5, y: top, w: 5, h: groundTop - top, color: shade(HOUSE_COLOR.wall, 0.25) },
    { x: right - WALL_W, y: top, w: WALL_W, h: groundTop - top + SLAB_H, color: shade(HOUSE_COLOR.wall, -0.2) },
    { x: right - WALL_W, y: top, w: 5, h: groundTop - top, color: shade(HOUSE_COLOR.wall, 0.05) },
  ];
  return { rects, roof: { x: left - 22, y: top - ROOF_H, w: w + 44, h: ROOF_H }, stairs: { x: o.colX + o.colStep - 130, y: midY }, left, right };
}

export function drawRoof(g: G, w: number, h: number): void {
  const c = HOUSE_COLOR.roof;
  g.fillStyle(shade(c, -0.25), 1);
  g.fillRect(0, h - 12, w, 12);
  g.fillStyle(c, 1);
  g.beginPath();
  g.moveTo(0, h - 12);
  g.lineTo(46, 0);
  g.lineTo(w - 46, 0);
  g.lineTo(w, h - 12);
  g.closePath();
  g.fillPath();
  g.fillStyle(shade(c, 0.22), 1);
  g.fillRect(46, 0, w - 92, 7);
  g.fillStyle(HOUSE_COLOR.trim, 0.9);
  g.fillRect(0, h - 12, w, 3);
}

export function drawStairs(g: G): void {
  for (let i = 0; i < 5; i++) {
    g.fillStyle(shade(HOUSE_COLOR.trim, -0.1 - i * 0.04), 1);
    g.fillRect(i * 14, 44 - (i + 1) * 9, 14, (i + 1) * 9);
    g.fillStyle(shade(HOUSE_COLOR.trim, 0.1), 1);
    g.fillRect(i * 14, 44 - (i + 1) * 9, 14, 3);
  }
}

/**
 * Builds the cutaway frame behind the room tiles: backdrop, two floor slabs, outer walls, roof edge and a stair block.
 * Plain rectangles plus two small baked textures (roof, stairs). Returns the created objects (scene shutdown destroys them).
 */
export function buildHouseFrame(scene: Phaser.Scene, o: HouseFrameOpts, depth = -20): Phaser.GameObjects.GameObject[] {
  const geo = houseFrameGeometry(o);
  const out: Phaser.GameObjects.GameObject[] = [];
  for (const r of geo.rects) out.push(scene.add.rectangle(r.x, r.y, r.w, r.h, r.color).setOrigin(0, 0).setDepth(depth));
  const rw = Math.ceil(geo.roof.w);
  const rh = geo.roof.h;
  const roofKey = `${ISO_HOUSE.roof}_${rw}`;
  if (!scene.textures.exists(roofKey)) bake(scene, roofKey, rw, rh, (g) => drawRoof(g, rw, rh));
  if (!scene.textures.exists(ISO_HOUSE.stairs)) bake(scene, ISO_HOUSE.stairs, 72, 46, drawStairs);
  out.push(scene.add.image(geo.roof.x, geo.roof.y, roofKey).setOrigin(0, 0).setDepth(depth));
  out.push(scene.add.image(geo.stairs.x, geo.stairs.y - 44, ISO_HOUSE.stairs).setOrigin(0, 0).setDepth(depth + 1));
  return out;
}
