import { describe, expect, it } from 'vitest';
import { DECOR, STORAGE_SPOTS } from '../src/content/decor';
import { HOUSE } from '../src/content/house';
import { DECOR_ISO, HOUSE_MAP, KIND_FOOT, LAYOUTS, PROPS, WINDOW_Z } from '../src/content/layout';
import { SPOT_POS } from '../src/content/layoutSpots';
import { LEGACY_ROOMS } from '../src/shared/types';
import type { IsoPlacement, RoomId } from '../src/shared/types';

interface Piece { id: string; iso: IsoPlacement; kind: string; src: 'spot' | 'prop' | 'decor' }

const roomPieces = (room: RoomId, withStorage: boolean): Piece[] => {
  const spots = [...HOUSE, ...(withStorage ? STORAGE_SPOTS : [])].filter((s) => s.room === room);
  const cosmetics = DECOR.filter((d) => d.room === room && d.kind === 'cosmetic');
  return [
    ...spots.map((s): Piece => ({ id: s.id, iso: s.iso, kind: s.kind, src: 'spot' })),
    ...PROPS[room].map((p): Piece => ({ id: `${room}.prop.${p.id}`, iso: p.iso, kind: p.kind, src: 'prop' })),
    ...cosmetics.map((d): Piece => ({ id: `${room}.${d.id}`, iso: d.iso, kind: 'cosmetic', src: 'decor' })),
  ];
};
const z = (i: IsoPlacement): [number, number] => [i.gz ?? 0, (i.gz ?? 0) + i.h];
const overlap = (a: IsoPlacement, b: IsoPlacement): boolean => {
  if (a.gx >= b.gx + b.w || b.gx >= a.gx + a.w || a.gy >= b.gy + b.d || b.gy >= a.gy + a.d) return false;
  const [a0, a1] = z(a), [b0, b1] = z(b);
  return a0 < b1 && b0 < a1;
};
const blocks = (i: IsoPlacement): boolean => !i.gz && i.h > 1;
const wallRange = (i: IsoPlacement, wall: 'left' | 'right'): [number, number] | null => {
  if (wall === 'right' && i.gy === 0) return [i.gx, i.gx + i.w];
  if (wall === 'left' && i.gx === 0) return [i.gy, i.gy + i.d];
  return null;
};
const hit = (r: [number, number] | null, at: number, w = 1): boolean => r !== null && r[0] < at + w && at < r[1];

describe('layout data', () => {
  it('has positions for exactly the 55 house spots plus 7 storage slots, with kind footprints', () => {
    expect(HOUSE.length).toBe(55);
    const ids = new Set([...HOUSE, ...STORAGE_SPOTS].map((s) => s.id));
    expect(ids.size).toBe(62);
    expect(Object.keys(SPOT_POS).sort()).toEqual([...ids].sort());
    for (const s of [...HOUSE, ...STORAGE_SPOTS]) {
      const f = KIND_FOOT[s.kind];
      expect(s.iso).toMatchObject({ w: f.w, d: f.d, h: f.h });
      expect(s.iso.gz ?? 0).toBe(f.gz ?? 0);
    }
    expect(Object.keys(DECOR_ISO).length).toBe(DECOR.filter((d) => d.kind === 'cosmetic').length);
  });

  it('spot counts per room: 8-14 house spots (<= 16 with every storage decor owned)', () => {
    for (const r of LEGACY_ROOMS) {
      const n = HOUSE.filter((s) => s.room === r).length;
      expect(n).toBeGreaterThanOrEqual(8);
      expect(n).toBeLessThanOrEqual(14);
      expect(STORAGE_SPOTS.filter((s) => s.room === r).length + n).toBeLessThanOrEqual(16);
      expect(PROPS[r].length).toBeGreaterThanOrEqual(6);
      expect(PROPS[r].length).toBeLessThanOrEqual(12);
    }
  });

  for (const room of LEGACY_ROOMS) {
    const lay = LAYOUTS[room];
    describe(room, () => {
      const pieces = roomPieces(room, true);

      it('everything is inside the room and sizes are sane', () => {
        expect(lay.cols).toBeGreaterThanOrEqual(8);
        expect(lay.cols).toBeLessThanOrEqual(10);
        expect(lay.rows).toBe(8);
        for (const p of pieces) {
          const i = p.iso;
          expect(i.gx, p.id).toBeGreaterThanOrEqual(0);
          expect(i.gy, p.id).toBeGreaterThanOrEqual(0);
          expect(i.gx + i.w, p.id).toBeLessThanOrEqual(lay.cols);
          expect(i.gy + i.d, p.id).toBeLessThanOrEqual(lay.rows);
          expect((i.gz ?? 0) + i.h, p.id).toBeLessThanOrEqual(10);
        }
      });

      it('no two pieces overlap in space (spots, props, decor, storage slots all owned)', () => {
        for (let a = 0; a < pieces.length; a++) for (let b = a + 1; b < pieces.length; b++) {
          const pa = pieces[a] as Piece, pb = pieces[b] as Piece;
          expect(overlap(pa.iso, pb.iso), `${pa.id} overlaps ${pb.id}`).toBe(false);
        }
      });

      it('wall mounts touch a wall (hanging lamps excepted)', () => {
        for (const p of pieces) {
          if (!p.iso.gz || p.kind === 'lampHang') continue;
          expect(p.iso.gx === 0 || p.iso.gy === 0, `${p.id} gz=${p.iso.gz} but not on a wall`).toBe(true);
        }
      });

      it('doors and windows do not collide with each other or with wall pieces', () => {
        for (const d of lay.doors) {
          const entry = d.wall === 'right' ? { x: d.at, y: 0 } : { x: 0, y: d.at };
          expect(d.at).toBeGreaterThanOrEqual(0);
          expect(d.at).toBeLessThan(d.wall === 'right' ? lay.cols : lay.rows);
          for (const p of pieces) {
            const hasWall = hit(wallRange(p.iso, d.wall), d.at);
            expect(blocksCell(p.iso, entry.x, entry.y), `${p.id} blocks ${d.to} door entry`).toBe(false);
            if (hasWall && p.iso.gz) expect(false, `${p.id} hangs over door to ${d.to}`).toBe(true);
          }
          for (const w of lay.windows) if (w.wall === d.wall) expect(d.at >= w.at + w.w || w.at > d.at).toBe(true);
        }
        for (const w of lay.windows) {
          expect(w.at + w.w).toBeLessThanOrEqual(w.wall === 'right' ? lay.cols : lay.rows);
          for (const p of pieces) {
            if (p.src === 'decor') continue;
            const [z0, z1] = z(p.iso);
            if (!hit(wallRange(p.iso, w.wall), w.at, w.w)) continue;
            expect(z1 <= WINDOW_Z.from || z0 >= WINDOW_Z.to, `${p.id} covers a ${w.wall} window`).toBe(true);
          }
        }
      });

      it('free floor is one connected area that reaches every door and a free cell next to every spot', () => {
        const blocked = new Set<string>();
        for (const p of pieces) if (blocks(p.iso)) for (let x = p.iso.gx; x < p.iso.gx + p.iso.w; x++) for (let y = p.iso.gy; y < p.iso.gy + p.iso.d; y++) blocked.add(`${x},${y}`);
        const free = (x: number, y: number): boolean => x >= 0 && y >= 0 && x < lay.cols && y < lay.rows && !blocked.has(`${x},${y}`);
        const start = lay.doors[0];
        expect(start).toBeDefined();
        const seen = new Set<string>();
        const q: Array<[number, number]> = [];
        const first: [number, number] = (start as typeof lay.doors[0]).wall === 'right' ? [(start as typeof lay.doors[0]).at, 0] : [0, (start as typeof lay.doors[0]).at];
        q.push(first); seen.add(first.join(','));
        while (q.length > 0) {
          const [x, y] = q.shift() as [number, number];
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
            const nx = x + dx, ny = y + dy;
            if (free(nx, ny) && !seen.has(`${nx},${ny}`)) { seen.add(`${nx},${ny}`); q.push([nx, ny]); }
          }
        }
        for (let x = 0; x < lay.cols; x++) for (let y = 0; y < lay.rows; y++) if (free(x, y)) expect(seen.has(`${x},${y}`), `free cell ${x},${y} unreachable`).toBe(true);
        for (const d of lay.doors) expect(seen.has((d.wall === 'right' ? [d.at, 0] : [0, d.at]).join(',')), `door to ${d.to} unreachable`).toBe(true);
        for (const p of pieces.filter((q2) => q2.src === 'spot')) {
          const i = p.iso;
          const adj: Array<[number, number]> = [];
          for (let x = i.gx; x < i.gx + i.w; x++) { adj.push([x, i.gy - 1], [x, i.gy + i.d]); }
          for (let y = i.gy; y < i.gy + i.d; y++) { adj.push([i.gx - 1, y], [i.gx + i.w, y]); }
          const own = (x: number, y: number): boolean => x >= i.gx && x < i.gx + i.w && y >= i.gy && y < i.gy + i.d;
          expect(adj.some(([x, y]) => !own(x, y) && seen.has(`${x},${y}`)), `${p.id} has no free neighbour cell`).toBe(true);
        }
      });
    });
  }

  it('doors are symmetric and match the house plan', () => {
    for (const r of LEGACY_ROOMS) for (const d of LAYOUTS[r].doors) {
      expect(LAYOUTS[d.to].doors.some((b) => b.to === r), `${r} -> ${d.to} has no way back`).toBe(true);
    }
    const edges = new Set(LEGACY_ROOMS.flatMap((r) => LAYOUTS[r].doors.map((d) => [r, d.to].sort().join('-'))));
    expect([...edges].sort()).toEqual(['bathroom-bedroom', 'bedroom-living', 'entrance-living', 'kitchen-living']);
  });

  it('HOUSE_MAP lists each room once, ground floor entrance/living/kitchen, upper bedroom/bathroom, no shared slots', () => {
    expect(HOUSE_MAP.map((s) => s.room).sort()).toEqual([...LEGACY_ROOMS].sort());
    const floorOf = (r: RoomId): number => (HOUSE_MAP.find((s) => s.room === r) as { floor: number }).floor;
    for (const r of ['entrance', 'living', 'kitchen'] as const) expect(floorOf(r)).toBe(0);
    for (const r of ['bedroom', 'bathroom'] as const) expect(floorOf(r)).toBe(1);
    expect(new Set(HOUSE_MAP.map((s) => `${s.floor}.${s.col}.${s.row}`)).size).toBe(5);
  });
});

function blocksCell(i: IsoPlacement, x: number, y: number): boolean {
  return blocks(i) && x >= i.gx && x < i.gx + i.w && y >= i.gy && y < i.gy + i.d;
}
