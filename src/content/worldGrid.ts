import { HOUSE } from './house';
import { STAIRS, ROOM_SIZE } from './world';
import type { WorldRoom } from './world';
import { blockingProps } from './worldProps';

/** Footprints of the house spots that block walking (same rule as src/logic/path.ts: floor-standing and taller than 1). */
export function blockingSpots(room: WorldRoom): Array<{ gx: number; gy: number; w: number; d: number; h: number }> {
  return HOUSE.filter((s) => s.room === room && !s.iso.gz && s.iso.h > 1).map((s) => s.iso);
}

/** Walkable grid of a room, `grid[y][x]`: blocked by tall props, house spots and the staircase footprint (both floors). */
export function walkGrid(room: WorldRoom): boolean[][] {
  const { w, d } = ROOM_SIZE[room];
  const grid = Array.from({ length: d }, () => Array.from({ length: w }, () => true));
  const block = (f: { gx: number; gy: number; w: number; d: number }): void => {
    for (let y = f.gy; y < f.gy + f.d; y++) for (let x = f.gx; x < f.gx + f.w; x++) { const row = grid[y]; if (row && x < w) row[x] = false; }
  };
  for (const f of [...blockingProps(room), ...blockingSpots(room)]) block(f);
  if (room === STAIRS.lower || room === STAIRS.upper) block({ gx: STAIRS.footprint.x, gy: STAIRS.footprint.y, w: STAIRS.footprint.w, d: STAIRS.footprint.d });
  return grid;
}
