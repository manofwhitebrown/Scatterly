import { describe, expect, it } from 'vitest';
import { HOUSE } from '../src/content/house';
import { ROOM_SIZE, STAIRS, WORLD_ROOMS, worldDoorCell } from '../src/content/world';
import type { Cell2, WorldRoom } from '../src/content/world';
import { houseRoute, worldPathLength, worldPathTo, worldPathToSpot, worldStandCells, worldWalkable } from '../src/logic/worldPath';

/** First walkable cell in scan order: a stable start point per room. */
const firstFree = (room: WorldRoom): Cell2 => {
  for (let y = 0; y < ROOM_SIZE[room].d; y++) for (let x = 0; x < ROOM_SIZE[room].w; x++) if (worldWalkable(room, { x, y })) return { x, y };
  throw new Error('no free cell');
};
const adjacent = (a: Cell2, b: Cell2): boolean => Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1;

describe('world path (single room)', () => {
  it('every house spot of every world room has a stand cell and can be reached from the room start', () => {
    for (const room of WORLD_ROOMS) {
      const from = firstFree(room);
      for (const sp of HOUSE.filter((s) => s.room === room)) {
        const stands = worldStandCells(room, sp.id);
        expect(stands.length, `${sp.id} stand cells`).toBeGreaterThan(0);
        const p = worldPathToSpot(room, from, sp.id);
        expect(p.length, `${sp.id} reachable`).toBeGreaterThan(0);
        expect(stands).toContainEqual(p[p.length - 1]);
      }
    }
  });

  it('stand cells are never inside the footprint and a spot walled in by extra cells has no path', () => {
    const sp = HOUSE.find((s) => s.id === 'living.bookshelf') as (typeof HOUSE)[number];
    for (const c of worldStandCells('living', sp.id)) {
      const inside = c.x >= sp.iso.gx && c.x < sp.iso.gx + sp.iso.w && c.y >= sp.iso.gy && c.y < sp.iso.gy + sp.iso.d;
      expect(inside).toBe(false);
    }
    const block = new Set(worldStandCells('living', sp.id).map((c) => c.y * 64 + c.x));
    expect(worldPathToSpot('living', firstFree('living'), sp.id, block)).toEqual([]);
    expect(worldStandCells('living', 'kitchen.table')).toEqual([]);
  });

  it('paths are 4-connected, start at from, stay on walkable cells and are as short as the reverse', () => {
    for (const room of WORLD_ROOMS) {
      const a = firstFree(room), b = { x: ROOM_SIZE[room].w - 1, y: ROOM_SIZE[room].d - 1 };
      const p = worldPathTo(room, a, b);
      expect(p.length).toBeGreaterThan(1);
      expect(p[0]).toEqual(a);
      for (let i = 1; i < p.length; i++) {
        expect(adjacent(p[i - 1] as Cell2, p[i] as Cell2)).toBe(true);
        expect(worldWalkable(room, p[i] as Cell2)).toBe(true);
      }
      const end = p[p.length - 1] as Cell2;
      expect(worldPathLength(room, end, a)).toBe(worldPathLength(room, a, end));
      expect(worldPathLength(room, a, a)).toBe(0);
    }
  });

  it('is deterministic', () => {
    const a = firstFree('living');
    expect(worldPathTo('living', a, { x: 11, y: 8 })).toEqual(worldPathTo('living', a, { x: 11, y: 8 }));
  });

  it('returns [] for out-of-room, fractional and walled-in targets', () => {
    const a = firstFree('kitchen');
    expect(worldPathTo('kitchen', a, { x: 99, y: 0 })).toEqual([]);
    expect(worldPathTo('kitchen', a, { x: -1, y: 0 })).toEqual([]);
    expect(worldPathTo('kitchen', a, { x: 2.5, y: 1 })).toEqual([]);
    expect(worldPathTo('kitchen', { x: 0, y: 99 }, a)).toEqual([]);
    const t = { x: ROOM_SIZE.kitchen.w - 1, y: ROOM_SIZE.kitchen.d - 1 };
    const walls = new Set<number>([t.y * 64 + t.x - 1, (t.y - 1) * 64 + t.x]);
    expect(worldPathTo('kitchen', a, t, walls)).toEqual([]);
  });

  it('a wall of extra blocked cells across the room cuts the route; opening one cell restores it', () => {
    const room: WorldRoom = 'study', col = 5;
    const wall = new Set<number>();
    for (let y = 0; y < ROOM_SIZE[room].d; y++) wall.add(y * 64 + col);
    const from = firstFree(room), to = { x: ROOM_SIZE[room].w - 1, y: ROOM_SIZE[room].d - 1 };
    expect(from.x).toBeLessThan(col);
    expect(worldPathTo(room, from, to, wall)).toEqual([]);
    expect(worldPathLength(room, from, to, wall)).toBe(-1);
    wall.delete(3 * 64 + col);
    expect(worldPathLength(room, from, to, wall)).toBeGreaterThan(0);
  });
});

describe('house route (doors and stairs)', () => {
  const start = (room: WorldRoom): Cell2 => firstFree(room);

  it('every room reaches every room; legs chain through door or stair cells', () => {
    for (const a of WORLD_ROOMS) for (const b of WORLD_ROOMS) {
      const legs = houseRoute(a, start(a), b, start(b));
      expect(legs.length, `${a}->${b}`).toBeGreaterThan(0);
      expect(legs[0]?.room).toBe(a);
      expect(legs[legs.length - 1]?.room).toBe(b);
      expect(legs[legs.length - 1]?.via).toBeUndefined();
      for (let i = 0; i < legs.length - 1; i++) {
        const cur = legs[i] as (typeof legs)[number], next = legs[i + 1] as (typeof legs)[number];
        const exit = cur.cells[cur.cells.length - 1] as Cell2;
        const enter = next.cells[0] as Cell2;
        if (cur.via === 'door') {
          expect(exit).toEqual(worldDoorCell(cur.room, next.room));
          expect(enter).toEqual(worldDoorCell(next.room, cur.room));
        } else {
          expect(cur.via).toBe('stairs');
          expect([exit, enter]).toContainEqual(STAIRS.board);
          expect([exit, enter]).toContainEqual(STAIRS.landing);
        }
      }
    }
  });

  it('known shapes: same room is one leg, entrance to kitchen walks two doors, entrance to study takes the stairs', () => {
    expect(houseRoute('living', start('living'), 'living', { x: 11, y: 8 })).toHaveLength(1);
    const k = houseRoute('entrance', start('entrance'), 'kitchen', start('kitchen'));
    expect(k.map((l) => l.room)).toEqual(['entrance', 'living', 'kitchen']);
    expect(k.slice(0, 2).map((l) => l.via)).toEqual(['door', 'door']);
    const s = houseRoute('entrance', start('entrance'), 'study', start('study'));
    expect(s.map((l) => l.room)).toEqual(['entrance', 'living', 'bedroom', 'study']);
    expect(s.map((l) => l.via)).toEqual(['door', 'stairs', 'door', undefined]);
  });

  it('returns [] when a blocking cell sits in the target room or the target is out of bounds', () => {
    expect(houseRoute('entrance', start('entrance'), 'kitchen', { x: 50, y: 50 })).toEqual([]);
  });
});
