import { describe, expect, it } from 'vitest';
import { HOUSE } from '../src/content/house';
import { STORAGE_SPOTS } from '../src/content/decor';
import { ROOM_SIZE, STAIRS, WORLD_DOORS, WORLD_ROOMS, worldDoorCell } from '../src/content/world';
import type { WorldRoom } from '../src/content/world';
import { walkGrid } from '../src/content/worldGrid';
import { FRONT_STEP, PROP_KINDS, footprint } from '../src/content/worldKinds';
import { WORLD_DECOR, blockingProps, doorSpans, worldProps } from '../src/content/worldProps';
import { KIND_FOOT } from '../src/content/layout';

type Box = { gx: number; gy: number; w: number; d: number; h: number };
const hit = (a: Box, b: Box): boolean => a.gx < b.gx + b.w && a.gx + a.w > b.gx && a.gy < b.gy + b.d && a.gy + a.d > b.gy;
const inside = (c: { gx: number; gy: number }, b: Box): boolean => c.gx >= b.gx && c.gx < b.gx + b.w && c.gy >= b.gy && c.gy < b.gy + b.d;
const spotsOf = (r: WorldRoom) => [...HOUSE, ...STORAGE_SPOTS].filter((s) => s.room === r);
const solid = (s: { iso: Box & { gz?: number } }): boolean => !(s.iso.gz) && s.iso.h > 1;
const stairBox = { gx: STAIRS.footprint.x, gy: STAIRS.footprint.y, w: STAIRS.footprint.w, d: STAIRS.footprint.d, h: 5 };

describe.each(WORLD_ROOMS)('world decor: %s', (room) => {
  const { w, d } = ROOM_SIZE[room];
  const dec = WORLD_DECOR[room];
  const props = worldProps(room);

  it('has 25-40 decor pieces with unique ids and known kinds', () => {
    expect(props.length + dec.mounts.length).toBeGreaterThanOrEqual(25);
    expect(props.length + dec.mounts.length).toBeLessThanOrEqual(40);
    expect(new Set(props.map((p) => p.id)).size).toBe(props.length);
    for (const p of props) expect(PROP_KINDS[p.kind], p.kind).toBeDefined();
    for (const m of dec.mounts) expect(PROP_KINDS[m[0]]?.mount, m[0]).toBe(true);
    expect(dec.theme.length).toBeGreaterThan(30);
  });

  it('everything is inside the room and top/flat/mount kinds are used correctly', () => {
    for (const p of props) {
      const f = footprint(p.kind, p.gx, p.gy, p.rot), k = PROP_KINDS[p.kind];
      expect(f.gx, p.id).toBeGreaterThanOrEqual(0);
      expect(f.gy, p.id).toBeGreaterThanOrEqual(0);
      expect(f.gx + f.w, p.id).toBeLessThanOrEqual(w);
      expect(f.gy + f.d, p.id).toBeLessThanOrEqual(d);
      expect(Boolean(k?.top), `${p.id} top <-> onTop`).toBe(Boolean(p.onTop));
      expect(k?.mount, p.id).toBeUndefined();
    }
  });

  it('onTop pieces sit inside their parent', () => {
    for (const p of props.filter((x) => x.onTop)) {
      const parent = props.find((x) => x.id === p.onTop);
      const spot = spotsOf(room).find((s) => s.id === p.onTop);
      const box: Box | undefined = parent ? footprint(parent.kind, parent.gx, parent.gy, parent.rot) : spot?.iso;
      expect(box, `${p.id} parent ${p.onTop}`).toBeDefined();
      expect(inside(p, box as Box), `${p.id} inside ${p.onTop}`).toBe(true);
      if (parent) expect(PROP_KINDS[parent.kind]?.top, 'parent not a top item').toBeUndefined();
    }
  });

  it('solid pieces never overlap each other, spots (incl. storage slots) or the staircase', () => {
    const solids: Array<{ id: string; b: Box }> = [
      ...blockingProps(room).map((b, i) => ({ id: `prop${i}`, b })),
      ...spotsOf(room).filter(solid).map((s) => ({ id: s.id, b: s.iso })),
    ];
    if (room === STAIRS.lower || room === STAIRS.upper) solids.push({ id: 'stairs', b: stairBox });
    const named = worldProps(room).filter((p) => !p.onTop && footprint(p.kind, p.gx, p.gy, p.rot).h > 1);
    solids.forEach((a, i) => solids.forEach((b, j) => {
      if (j <= i) return;
      const an = a.id.startsWith('prop') ? named[Number(a.id.slice(4))]?.id : a.id, bn = b.id.startsWith('prop') ? named[Number(b.id.slice(4))]?.id : b.id;
      expect(hit(a.b, b.b), `${an} overlaps ${bn}`).toBe(false);
    }));
  });

  it('pieces touching a back wall face into the room', () => {
    for (const p of props.filter((x) => !x.onTop)) {
      const k = PROP_KINDS[p.kind];
      if (!k || k.flat || k.sym) continue;
      const f = footprint(p.kind, p.gx, p.gy, p.rot);
      const onR = f.gy === 0, onL = f.gx === 0;
      if (onR && onL) expect([0, 1], p.id).toContain(p.rot);
      else if (onR) expect(p.rot, `${p.id} on right wall`).toBe(0);
      else if (onL) expect(p.rot, `${p.id} on left wall`).toBe(1);
    }
  });

  it('seats face a table, desk or TV within 5 cells', () => {
    const focus: Box[] = [
      ...props.filter((p) => PROP_KINDS[p.kind]?.focus).map((p) => footprint(p.kind, p.gx, p.gy, p.rot)),
      ...spotsOf(room).filter((s) => s.kind === 'table' || s.kind === 'tv').map((s) => s.iso),
    ];
    for (const p of props.filter((x) => PROP_KINDS[x.kind]?.seat)) {
      const f = footprint(p.kind, p.gx, p.gy, p.rot), [dx, dy] = FRONT_STEP[p.rot];
      let found = false;
      for (let x = f.gx; x < f.gx + f.w; x++) for (let y = f.gy; y < f.gy + f.d; y++) {
        for (let n = 1; n <= 5; n++) {
          const c = { gx: x + dx * n, gy: y + dy * n, w: 1, d: 1, h: 1 };
          if (focus.some((b) => hit(c, b))) found = true;
        }
      }
      expect(found, `${p.id} faces nothing`).toBe(true);
    }
  });

  it('wall mounts and windows fit, never overlap doors, windows or each other, and clear what stands below', () => {
    const doors = doorSpans(room);
    const len = (wall: 'L' | 'R'): number => (wall === 'R' ? w : d);
    const under = (wall: 'L' | 'R', t: number): number => {
      let top = 0;
      const boxes: Box[] = [...blockingProps(room), ...spotsOf(room).filter(solid).map((s) => s.iso)];
      for (const b of boxes) {
        const touches = wall === 'R' ? b.gy === 0 : b.gx === 0;
        const span = wall === 'R' ? [b.gx, b.gx + b.w] : [b.gy, b.gy + b.d];
        if (touches && t >= (span[0] as number) && t < (span[1] as number)) top = Math.max(top, b.h);
      }
      return top;
    };
    const wallSpots = spotsOf(room).filter((s) => s.iso.gz).map((s) => ({ wall: (s.iso.gy === 0 ? 'R' : 'L') as 'L' | 'R', t: s.iso.gy === 0 ? s.iso.gx : s.iso.gy, h: s.iso.gz as number }));
    const spans: Array<{ wall: 'L' | 'R'; a: number; b: number; what: string }> = [];
    for (const x of dec.windows) {
      expect(x.t, 'window start').toBeGreaterThanOrEqual(0);
      expect(x.t + x.w, 'window end').toBeLessThanOrEqual(len(x.wall));
      for (let t = x.t; t < x.t + x.w; t++) expect(under(x.wall, t), `window ${x.wall}${t} above tall piece`).toBeLessThanOrEqual(3);
      spans.push({ wall: x.wall, a: x.t, b: x.t + x.w, what: `window ${x.wall}${x.t}` });
    }
    for (const m of dec.mounts) {
      const k = PROP_KINDS[m[0]], mw = k ? k.w : 1;
      expect(m[2] + mw, m[0]).toBeLessThanOrEqual(len(m[1]));
      for (let t = m[2]; t < m[2] + mw; t++) expect(m[3], `${m[0]} ${m[1]}${t} base`).toBeGreaterThanOrEqual(under(m[1], t));
      for (const s of wallSpots) if (s.wall === m[1] && s.t >= m[2] && s.t < m[2] + mw) throw new Error(`${m[0]} ${m[1]}${m[2]} overlaps wall spot`);
      spans.push({ wall: m[1], a: m[2], b: m[2] + mw, what: `${m[0]} ${m[1]}${m[2]}` });
    }
    for (const dr of doors) spans.push({ wall: dr.wall, a: dr.t, b: dr.t + 1, what: `door ${dr.wall}${dr.t}` });
    spans.forEach((a, i) => spans.forEach((b, j) => {
      if (j > i && a.wall === b.wall) expect(a.a < b.b && b.a < a.b, `${a.what} overlaps ${b.what}`).toBe(false);
    }));
  });

  it('floor is connected, doors and stairs are free, every spot has a free neighbour', () => {
    const g = walkGrid(room);
    const free = (x: number, y: number): boolean => Boolean((g[y] ?? [])[x]);
    const cells: string[] = [];
    g.forEach((row, y) => row.forEach((ok, x) => { if (ok) cells.push(`${x},${y}`); }));
    const start = cells[0] as string, seen = new Set([start]), q = [start];
    while (q.length) {
      const [cx, cy] = (q.pop() as string).split(',').map(Number) as [number, number];
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const k = `${cx + dx},${cy + dy}`;
        if (free(cx + dx, cy + dy) && !seen.has(k)) { seen.add(k); q.push(k); }
      }
    }
    expect(cells.filter((c) => !seen.has(c)), 'unreachable cells').toEqual([]);
    for (const d2 of WORLD_DOORS) for (const [a, b] of [[d2.a, d2.b], [d2.b, d2.a]] as const) {
      if (a !== room) continue;
      const c = worldDoorCell(a, b) as { x: number; y: number };
      expect(free(c.x, c.y), `door ${a}->${b}`).toBe(true);
    }
    if (room === 'entrance') expect(free(0, 5), 'front door cell').toBe(true);
    for (const s of HOUSE.filter((x) => x.room === room)) {
      const i = s.iso;
      if (i.gz) {
        const near = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => free(i.gx + (dx as number), i.gy + (dy as number)));
        expect(near, `${s.id} wall item unreachable`).toBe(true);
        continue;
      }
      let ok = false;
      for (let x = i.gx - 1; x <= i.gx + i.w; x++) for (let y = i.gy - 1; y <= i.gy + i.d; y++) {
        const edge = (x >= i.gx && x < i.gx + i.w) !== (y >= i.gy && y < i.gy + i.d);
        if (edge && free(x, y)) ok = true;
      }
      expect(ok, `${s.id} has no free neighbour`).toBe(true);
    }
  });
});

describe('study spots', () => {
  it('has 6-10 interactive pieces with the kind sizes of KIND_FOOT', () => {
    const st = HOUSE.filter((s) => s.room === 'study');
    expect(st.length).toBeGreaterThanOrEqual(6);
    expect(st.length).toBeLessThanOrEqual(10);
    for (const s of st) expect(s.iso).toMatchObject({ w: KIND_FOOT[s.kind].w, d: KIND_FOOT[s.kind].d });
  });
});
