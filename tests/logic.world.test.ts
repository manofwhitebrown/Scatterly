import { describe, expect, it } from 'vitest';
import { HOUSE } from '../src/content/house';
import { HOUSE_MAP_V2, ROOM_SIZE, STAIRS, UPPER_SETBACK, WORLD_DOORS, WORLD_ROOMS, worldDoorCell } from '../src/content/world';
import { walkGrid } from '../src/content/worldGrid';
import type { Cell2, WorldRoom } from '../src/content/world';

const slot = (r: WorldRoom) => HOUSE_MAP_V2.find((s) => s.room === r) as (typeof HOUSE_MAP_V2)[number];

describe('world layout v2', () => {
  it('has the six rooms, each placed once with a size', () => {
    expect(HOUSE_MAP_V2.map((s) => s.room).sort()).toEqual([...WORLD_ROOMS].sort());
    for (const r of WORLD_ROOMS) expect(ROOM_SIZE[r].w * ROOM_SIZE[r].d).toBeGreaterThanOrEqual(64);
  });

  it('rooms on one floor never overlap and neighbours share a wall exactly', () => {
    for (const a of HOUSE_MAP_V2) for (const b of HOUSE_MAP_V2) {
      if (a.room >= b.room || a.floor !== b.floor) continue;
      const A = ROOM_SIZE[a.room as WorldRoom], B = ROOM_SIZE[b.room as WorldRoom];
      const apart = a.wx + A.w <= b.wx || b.wx + B.w <= a.wx || a.wy + A.d <= b.wy || b.wy + B.d <= a.wy;
      expect(apart, `${a.room}/${b.room}`).toBe(true);
    }
    for (const d of WORLD_DOORS) {
      const a = slot(d.a), b = slot(d.b);
      expect(a.floor).toBe(b.floor);
      expect(a.wx + ROOM_SIZE[d.a].w, `${d.a}|${d.b}`).toBe(b.wx);
      expect(d.at).toBeGreaterThanOrEqual(1);
      expect(d.at).toBeLessThan(Math.min(ROOM_SIZE[d.a].d, ROOM_SIZE[d.b].d) - 1);
    }
  });

  it('every upper room is the ground room below it shifted by exactly (-UPPER_SETBACK, -UPPER_SETBACK)', () => {
    expect(UPPER_SETBACK).toBe(6);
    const ABOVE: Record<string, string> = { bathroom: 'entrance', bedroom: 'living', study: 'kitchen' };
    for (const up of HOUSE_MAP_V2.filter((x) => x.floor === 1)) {
      const g = slot(ABOVE[up.room] as WorldRoom);
      expect(ROOM_SIZE[up.room as WorldRoom], up.room).toEqual(ROOM_SIZE[g.room as WorldRoom]);
      expect(up.wx, `${up.room} wx`).toBe(g.wx - UPPER_SETBACK);
      expect(up.wy, `${up.room} wy`).toBe(g.wy - UPPER_SETBACK);
    }
  });

  it('the set-back clears the ground floor on screen: no upper floor tile hides a ground floor tile', () => {
    // Floor 1 is raised 72 art px = 9 tiles of (gx+gy). A ground tile is hidden when an upper tile with the same (gx-gy)
    // has global gx+gy exactly 9 larger. None may exist.
    const RAISE_TILES = 9;
    const cells = (floor: number): Array<{ sum: number; diff: number }> => HOUSE_MAP_V2.filter((x) => x.floor === floor).flatMap((x) => {
      const { w, d } = ROOM_SIZE[x.room as WorldRoom];
      return Array.from({ length: w * d }, (_, k) => ({ sum: x.wx + (k % w) + x.wy + Math.floor(k / w), diff: x.wx + (k % w) - x.wy - Math.floor(k / w) }));
    });
    const upper = new Set(cells(1).map((c) => `${c.sum}:${c.diff}`));
    const hidden = cells(0).filter((c) => upper.has(`${c.sum + RAISE_TILES}:${c.diff}`));
    expect(hidden.length).toBe(0);
  });

  it('door cells are in bounds, walkable and line up in world coordinates', () => {
    for (const d of WORLD_DOORS) {
      const ca = worldDoorCell(d.a, d.b) as Cell2, cb = worldDoorCell(d.b, d.a) as Cell2;
      expect((walkGrid(d.a)[ca.y] as boolean[])[ca.x]).toBe(true);
      expect((walkGrid(d.b)[cb.y] as boolean[])[cb.x]).toBe(true);
      expect(slot(d.a).wy + ca.y).toBe(slot(d.b).wy + cb.y);
      expect(slot(d.a).wx + ca.x + 1).toBe(slot(d.b).wx + cb.x);
    }
    expect(worldDoorCell('entrance', 'kitchen')).toBeUndefined();
  });

  it('the staircase joins the living room to the room above it, aligned, with free board and landing cells', () => {
    expect(slot(STAIRS.upper).wx).toBe(slot(STAIRS.lower).wx - UPPER_SETBACK);
    expect(slot(STAIRS.upper).wy).toBe(slot(STAIRS.lower).wy - UPPER_SETBACK);
    expect(slot(STAIRS.lower).floor).toBe(0);
    expect(slot(STAIRS.upper).floor).toBe(1);
    expect((walkGrid(STAIRS.lower)[STAIRS.board.y] as boolean[])[STAIRS.board.x], 'board').toBe(true);
    expect((walkGrid(STAIRS.upper)[STAIRS.landing.y] as boolean[])[STAIRS.landing.x], 'landing').toBe(true);
    for (const r of [STAIRS.lower, STAIRS.upper]) {
      const f = STAIRS.footprint;
      expect(f.x + f.w).toBeLessThanOrEqual(ROOM_SIZE[r].w);
    }
  });

  it('every walkable cell of every room is connected and the whole house is one graph', () => {
    const seen = new Map<WorldRoom, Set<string>>();
    for (const r of WORLD_ROOMS) {
      const g = walkGrid(r), cells = new Set<string>();
      let total = 0, first: Cell2 | undefined;
      g.forEach((row, y) => row.forEach((ok, x) => { if (ok) { total++; first = first ?? { x, y }; } }));
      const q: Cell2[] = [first as Cell2];
      cells.add(`${(first as Cell2).x},${(first as Cell2).y}`);
      while (q.length) {
        const c = q.pop() as Cell2;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
          const n = { x: c.x + dx, y: c.y + dy };
          if ((g[n.y] ?? [])[n.x] && !cells.has(`${n.x},${n.y}`)) { cells.add(`${n.x},${n.y}`); q.push(n); }
        }
      }
      expect(cells.size, r).toBe(total);
      seen.set(r, cells);
    }
    const reach = new Set<WorldRoom>(['entrance']), stack: WorldRoom[] = ['entrance'];
    while (stack.length) {
      const r = stack.pop() as WorldRoom;
      const next: WorldRoom[] = WORLD_DOORS.flatMap((d) => (d.a === r ? [d.b] : d.b === r ? [d.a] : []));
      if (r === STAIRS.lower) next.push(STAIRS.upper);
      if (r === STAIRS.upper) next.push(STAIRS.lower);
      for (const n of next) if (!reach.has(n)) { reach.add(n); stack.push(n); }
    }
    expect([...reach].sort()).toEqual([...WORLD_ROOMS].sort());
  });

  it('existing spot positions still fit the new room sizes and stay off the staircase', () => {
    const f = STAIRS.footprint;
    for (const s of HOUSE) {
      if (!(s.room in ROOM_SIZE)) continue;
      const z = ROOM_SIZE[s.room as WorldRoom], i = s.iso;
      expect(i.gx + i.w, s.id).toBeLessThanOrEqual(z.w);
      expect(i.gy + i.d, s.id).toBeLessThanOrEqual(z.d);
      if (s.room === STAIRS.lower || s.room === STAIRS.upper) {
        const hit = i.gx < f.x + f.w && i.gx + i.w > f.x && i.gy < f.y + f.d && i.gy + i.d > f.y;
        expect(hit, `${s.id} on stairs`).toBe(false);
      }
    }
  });

  it('the staircase is 1 wide x 3 deep in the back-right corner, with board below and landing beside it', () => {
    const f = STAIRS.footprint;
    expect([f.w, f.d]).toEqual([1, 3]);
    expect(f.y).toBe(0);
    expect(f.x + f.w).toBe(ROOM_SIZE[STAIRS.lower].w);
    expect(STAIRS.board).toEqual({ x: f.x, y: f.d });
    expect(STAIRS.landing).toEqual({ x: f.x - 1, y: 0 });
  });
});
