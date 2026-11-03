import { HOUSE_MAP_V2, ROOM_SIZE, STAIRS, WORLD_DOORS } from '../content/world';
import type { WorldRoom } from '../content/world';
import type { HouseSlot, RoomId } from '../shared/types';

/**
 * Home world adapter (AI-3, placeholder until AI-2 publishes HOUSE_MAP v2 / ROOM_SIZE in src/content/layout*.ts).
 * One global iso grid: sx = (gx - gy) * 16, sy = (gx + gy) * 8 - h (art px). One tile = 32x16 art px.
 * Ground floor: entrance | living | kitchen along gx. Upper floor: bathroom | bedroom | study above them.
 */
export const TILE_W = 32;
export const TILE_H = 16;
export const WALL_PX = 64;
export const SLAB_PX = 8;
export const FLOOR1_RAISE = 72;
export const ART_PX = 3;

export { ROOM_SIZE } from '../content/world';
export const HOUSE_WORLD: HouseSlot[] = HOUSE_MAP_V2;

/** Door and stairs links between rooms; every room must be reachable from the Overview in at most 2 taps. */
export const LINKS: ReadonlyArray<readonly [RoomId, RoomId]> = [
  ...WORLD_DOORS.map((d): readonly [RoomId, RoomId] => [d.a, d.b]),
  [STAIRS.lower, STAIRS.upper],
];

export interface Pt { x: number; y: number }
export interface Rect { x: number; y: number; w: number; h: number }
export interface CameraState { zoom: number; cx: number; cy: number }

export const project = (gx: number, gy: number, h = 0): Pt => ({ x: (gx - gy) * (TILE_W / 2), y: (gx + gy) * (TILE_H / 2) - h });

const slotOf = (room: RoomId): HouseSlot => {
  const s = HOUSE_WORLD.find((x) => x.room === room);
  if (!s) throw new Error(`homeWorld: unknown room ${room}`);
  return s;
};
const sizeOf = (room: RoomId): { w: number; d: number } => {
  const s = ROOM_SIZE[room as WorldRoom] as { w: number; d: number } | undefined;
  if (!s) throw new Error(`homeWorld: no size for ${room}`);
  return s;
};

/** Screen-space (art px) origin of a room's back-corner floor point. */
export function roomOrigin(room: RoomId): Pt {
  const s = slotOf(room);
  return project(s.wx, s.wy, s.floor * FLOOR1_RAISE);
}

/** Axis-aligned art-px bounds of a room cutaway: floor diamond plus the two back walls. */
export function roomBounds(room: RoomId): Rect {
  const s = slotOf(room);
  const { w, d } = sizeOf(room);
  const raise = s.floor * FLOOR1_RAISE;
  const left = project(s.wx, s.wy + d, raise).x;
  const right = project(s.wx + w, s.wy, raise).x;
  const top = project(s.wx, s.wy, raise).y - WALL_PX;
  const bottom = project(s.wx + w, s.wy + d, raise).y + SLAB_PX;
  return { x: left, y: top, w: right - left, h: bottom - top };
}

export function houseBounds(): Rect {
  const rs = HOUSE_WORLD.map((s) => roomBounds(s.room));
  const x0 = Math.min(...rs.map((r) => r.x)); const y0 = Math.min(...rs.map((r) => r.y));
  const x1 = Math.max(...rs.map((r) => r.x + r.w)); const y1 = Math.max(...rs.map((r) => r.y + r.h));
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

/** Camera that fits `r` inside the view (art px -> game px zoom), with a margin in game px; zoom is never fractional below 1x ART_PX. */
export function fitCamera(r: Rect, viewW: number, viewH: number, margin = 24): CameraState {
  const zoom = Math.min((viewW - margin * 2) / r.w, (viewH - margin * 2) / r.h);
  return { zoom, cx: r.x + r.w / 2, cy: r.y + r.h / 2 };
}

export const overviewCamera = (viewW: number, viewH: number): CameraState => fitCamera(houseBounds(), viewW, viewH, 16);
export const focusCamera = (room: RoomId, viewW: number, viewH: number): CameraState => fitCamera(roomBounds(room), viewW, viewH, 24);

/** Linear interpolation of two cameras (zoom interpolated in log space so the tween feels even). */
export function lerpCamera(a: CameraState, b: CameraState, t: number): CameraState {
  const k = Math.min(1, Math.max(0, t));
  return { zoom: a.zoom * Math.pow(b.zoom / a.zoom, k), cx: a.cx + (b.cx - a.cx) * k, cy: a.cy + (b.cy - a.cy) * k };
}

/** Art-px point under a game-px screen point for a camera. */
export function screenToArt(p: Pt, cam: CameraState, viewW: number, viewH: number): Pt {
  return { x: cam.cx + (p.x - viewW / 2) / cam.zoom, y: cam.cy + (p.y - viewH / 2) / cam.zoom };
}

/** Silhouette of a room cutaway (two back walls plus the floor slab) as a hexagon in art px. */
export function roomPolygon(room: RoomId): Pt[] {
  const s = slotOf(room);
  const { w, d } = sizeOf(room);
  const raise = s.floor * FLOOR1_RAISE;
  const L = project(s.wx, s.wy + d, raise); const B = project(s.wx, s.wy, raise);
  const R = project(s.wx + w, s.wy, raise); const F = project(s.wx + w, s.wy + d, raise);
  return [{ x: L.x, y: L.y - WALL_PX }, { x: B.x, y: B.y - WALL_PX }, { x: R.x, y: R.y - WALL_PX }, R, { x: F.x, y: F.y + SLAB_PX }, { x: L.x, y: L.y + SLAB_PX }];
}

function inside(poly: Pt[], p: Pt): boolean {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i]; const b = poly[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) hit = !hit;
  }
  return hit;
}

/** Which room is at an art-px point; the upper floor wins on overlap, ties go to the nearest centre. */
export function roomAt(a: Pt): RoomId | undefined {
  let best: { room: RoomId; d: number } | undefined;
  for (const s of HOUSE_WORLD) {
    if (!inside(roomPolygon(s.room), a)) continue;
    const r = roomBounds(s.room);
    const d = Math.hypot(a.x - (r.x + r.w / 2), a.y - (r.y + r.h / 2)) - s.floor * 1000;
    if (!best || d < best.d) best = { room: s.room, d };
  }
  return best?.room;
}

/** Minimum taps from the Overview to focus a room: 1 for a tap, +1 per door hop when navigating inside Focus. */
export function tapsFromOverview(target: RoomId): number {
  return 1 + Math.min(...HOUSE_WORLD.map((s) => hops(s.room, target)));
}
export function hops(from: RoomId, to: RoomId): number {
  if (from === to) return 0;
  const seen = new Set<RoomId>([from]);
  let frontier: RoomId[] = [from];
  for (let n = 1; frontier.length; n++) {
    const next: RoomId[] = [];
    for (const r of frontier) {
      for (const [a, b] of LINKS) {
        const o = a === r ? b : b === r ? a : undefined;
        if (!o || seen.has(o)) continue;
        if (o === to) return n;
        seen.add(o); next.push(o);
      }
    }
    frontier = next;
  }
  return Infinity;
}
