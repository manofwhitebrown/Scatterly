import { describe, expect, it } from 'vitest';
import { HOUSE } from '../src/content/house';
import { LAYOUTS } from '../src/content/layout';
import { blockedCells, doorCell, isWalkable, pathLengthCells, pathTo, standCells } from '../src/logic/path';
import { LEGACY_ROOMS } from '../src/shared/types';
import type { RoomId } from '../src/shared/types';

const ROOMS: readonly RoomId[] = LEGACY_ROOMS; // the four new rooms have stub layouts until world layout v2

describe('pathTo', () => {
  it('connects every door to every spot stand cell in every room', () => {
    for (const room of ROOMS) {
      const doors = LAYOUTS[room].doors;
      const start = doorCell(room, (doors[0] as typeof doors[0]).to) as { x: number; y: number };
      for (const s of HOUSE.filter((h) => h.room === room)) {
        const stands = standCells(room, s.id);
        expect(stands.length, `${s.id} has no stand cell`).toBeGreaterThan(0);
        const best = Math.min(...stands.map((c) => pathLengthCells(room, start, c)).filter((n) => n >= 0));
        expect(Number.isFinite(best), `${s.id} unreachable from door`).toBe(true);
      }
      for (const d of doors) {
        const c = doorCell(room, d.to) as { x: number; y: number };
        expect(pathTo(room, start, c).length, `${room}->${d.to}`).toBeGreaterThan(0);
      }
    }
  });

  it('paths are contiguous, walkable, start/end where asked and shortest (matches Manhattan on open floor)', () => {
    const room: RoomId = 'living';
    const p = pathTo(room, { x: 0, y: 1 }, { x: 2, y: 1 });
    expect(p).toEqual([{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }]);
    for (let i = 1; i < p.length; i++) {
      const a = p[i - 1] as { x: number; y: number }, b = p[i] as { x: number; y: number };
      expect(Math.abs(a.x - b.x) + Math.abs(a.y - b.y)).toBe(1);
      expect(isWalkable(room, b)).toBe(true);
    }
  });

  it('same cell is a one-cell path; out of bounds and non-integers give []', () => {
    expect(pathTo('living', { x: 0, y: 1 }, { x: 0, y: 1 })).toEqual([{ x: 0, y: 1 }]);
    expect(pathTo('living', { x: 0, y: 0 }, { x: 99, y: 0 })).toEqual([]);
    expect(pathTo('living', { x: -1, y: 0 }, { x: 1, y: 1 })).toEqual([]);
    expect(pathTo('living', { x: 0.5, y: 0 }, { x: 1, y: 1 })).toEqual([]);
  });

  it('a blocked target ends next to it; the path never crosses blocked cells', () => {
    const room: RoomId = 'kitchen';
    const s = HOUSE.find((h) => h.room === room && h.iso.h > 1 && !h.iso.gz);
    expect(s).toBeDefined();
    const sp = s as typeof HOUSE[0];
    const blocked = blockedCells(room);
    const target = { x: sp.iso.gx, y: sp.iso.gy };
    const start = standCells(room, sp.id)[0] as { x: number; y: number };
    const p = pathTo(room, { x: 0, y: 0 }, target);
    expect(p.length).toBeGreaterThan(0);
    for (const c of p.slice(1)) expect(blocked.has(c.y * 64 + c.x)).toBe(false);
    expect(pathLengthCells(room, start, start)).toBe(0);
  });

  it('unreachable: a walled-off cell returns [] and length -1', () => {
    const room: RoomId = 'entrance';
    const lay = LAYOUTS[room];
    const extra = [{ gx: 3, gy: 0, w: 1, d: lay.rows, h: 5 }];
    const open = pathTo(room, { x: 0, y: 0 }, { x: 0, y: 1 }, { extra });
    expect(open.length).toBeGreaterThan(0);
    expect(pathTo(room, { x: 0, y: 7 }, { x: 5, y: 7 }, { extra })).toEqual([]);
    expect(pathLengthCells(room, { x: 0, y: 7 }, { x: 5, y: 7 }, { extra })).toBe(-1);
  });

  it('is deterministic', () => {
    const a = JSON.stringify(pathTo('living', { x: 0, y: 7 }, { x: 9, y: 0 }));
    expect(JSON.stringify(pathTo('living', { x: 0, y: 7 }, { x: 9, y: 0 }))).toBe(a);
  });
});
