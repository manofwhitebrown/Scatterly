import { anySpot } from '../content/decor';
import { HOUSE } from '../content/house';
import { LAYOUTS, PROPS } from '../content/layout';
import type { IsoPlacement, RoomId, SpotId } from '../shared/types';

/** A floor cell of a room's iso grid (gx = x, gy = y). */
export interface Cell { x: number; y: number }

export interface PathOptions {
  /** Storage decor ids the player owns (their spots block floor cells). */
  owned?: readonly string[];
  /** Extra footprints that block movement (builder decor). */
  extra?: readonly IsoPlacement[];
}

/** Same rule as the layout tests: floor-standing and taller than 1 unit blocks; wall mounts never do. */
const blocks = (i: IsoPlacement): boolean => !i.gz && i.h > 1;

function footprints(room: RoomId, opts: PathOptions): IsoPlacement[] {
  const out: IsoPlacement[] = [];
  for (const s of HOUSE) if (s.room === room) out.push(s.iso);
  for (const id of opts.owned ?? []) {
    const s = anySpot(`${room}.${id}`);
    if (s && s.room === room) out.push(s.iso);
  }
  for (const p of PROPS[room]) out.push(p.iso);
  for (const e of opts.extra ?? []) out.push(e);
  return out.filter(blocks);
}

const key = (x: number, y: number): number => y * 64 + x;

/** Blocked-cell set of a room. */
export function blockedCells(room: RoomId, opts: PathOptions = {}): Set<number> {
  const set = new Set<number>();
  for (const i of footprints(room, opts)) {
    for (let x = i.gx; x < i.gx + i.w; x++) for (let y = i.gy; y < i.gy + i.d; y++) set.add(key(x, y));
  }
  return set;
}

export function isWalkable(room: RoomId, c: Cell, opts: PathOptions = {}, blocked: Set<number> = blockedCells(room, opts)): boolean {
  const lay = LAYOUTS[room];
  return Number.isInteger(c.x) && Number.isInteger(c.y) && c.x >= 0 && c.y >= 0 && c.x < lay.cols && c.y < lay.rows && !blocked.has(key(c.x, c.y));
}

/** The floor cell just inside the door that leads to `to`, or undefined when the rooms are not joined. */
export function doorCell(room: RoomId, to: RoomId): Cell | undefined {
  const d = LAYOUTS[room].doors.find((x) => x.to === to);
  if (!d) return undefined;
  return d.wall === 'right' ? { x: d.at, y: 0 } : { x: 0, y: d.at };
}

const DIRS: ReadonlyArray<readonly [number, number]> = [[1, 0], [0, 1], [-1, 0], [0, -1]];

/** Free cells next to a footprint (where the avatar stands to use it), nearest to (0,0) first, then by y, x. */
export function standCells(room: RoomId, spotId: SpotId, opts: PathOptions = {}): Cell[] {
  const s = anySpot(spotId);
  if (!s || s.room !== room) return [];
  const blocked = blockedCells(room, opts);
  const i = s.iso;
  const out: Cell[] = [];
  for (let x = i.gx - 1; x <= i.gx + i.w; x++) {
    for (let y = i.gy - 1; y <= i.gy + i.d; y++) {
      const inside = x >= i.gx && x < i.gx + i.w && y >= i.gy && y < i.gy + i.d;
      const corner = (x < i.gx || x >= i.gx + i.w) && (y < i.gy || y >= i.gy + i.d);
      if (!inside && !corner && isWalkable(room, { x, y }, opts, blocked)) out.push({ x, y });
    }
  }
  return out.sort((a, b) => a.y - b.y || a.x - b.x);
}

/**
 * Shortest 4-neighbour path over walkable cells, from and to included. `from` may stand on a blocked cell (the avatar
 * is already there). If `to` is blocked (a container), the path ends at the closest free cell next to it.
 * Returns [] when no route exists or an endpoint is out of the room. Deterministic.
 */
export function pathTo(room: RoomId, from: Cell, to: Cell, opts: PathOptions = {}): Cell[] {
  const lay = LAYOUTS[room];
  const blocked = blockedCells(room, opts);
  const inside = (c: Cell): boolean => Number.isInteger(c.x) && Number.isInteger(c.y) && c.x >= 0 && c.y >= 0 && c.x < lay.cols && c.y < lay.rows;
  if (!inside(from) || !inside(to)) return [];
  const goals = new Set<number>();
  if (!blocked.has(key(to.x, to.y))) goals.add(key(to.x, to.y));
  else for (const [dx, dy] of DIRS) if (isWalkable(room, { x: to.x + dx, y: to.y + dy }, opts, blocked)) goals.add(key(to.x + dx, to.y + dy));
  if (goals.size === 0) return [];
  const h = (x: number, y: number): number => Math.abs(x - to.x) + Math.abs(y - to.y);
  const g = new Map<number, number>([[key(from.x, from.y), 0]]);
  const prev = new Map<number, number>();
  const open: Array<{ k: number; x: number; y: number; f: number }> = [{ k: key(from.x, from.y), x: from.x, y: from.y, f: h(from.x, from.y) }];
  const closed = new Set<number>();
  while (open.length > 0) {
    let bi = 0;
    for (let i = 1; i < open.length; i++) {
      const a = open[i] as typeof open[0], b = open[bi] as typeof open[0];
      if (a.f < b.f || (a.f === b.f && (a.y < b.y || (a.y === b.y && a.x < b.x)))) bi = i;
    }
    const cur = open.splice(bi, 1)[0] as typeof open[0];
    if (closed.has(cur.k)) continue;
    closed.add(cur.k);
    if (goals.has(cur.k)) {
      const cells: Cell[] = [];
      for (let k: number | undefined = cur.k; k !== undefined; k = prev.get(k)) cells.push({ x: k % 64, y: Math.floor(k / 64) });
      return cells.reverse();
    }
    const gc = g.get(cur.k) as number;
    for (const [dx, dy] of DIRS) {
      const nx = cur.x + dx, ny = cur.y + dy, nk = key(nx, ny);
      if (!isWalkable(room, { x: nx, y: ny }, opts, blocked) || closed.has(nk)) continue;
      if (gc + 1 < (g.get(nk) ?? Infinity)) {
        g.set(nk, gc + 1);
        prev.set(nk, cur.k);
        open.push({ k: nk, x: nx, y: ny, f: gc + 1 + h(nx, ny) });
      }
    }
  }
  return [];
}

/** Steps between two cells along the shortest path, or -1 when unreachable. */
export function pathLengthCells(room: RoomId, from: Cell, to: Cell, opts: PathOptions = {}): number {
  const p = pathTo(room, from, to, opts);
  return p.length === 0 ? -1 : p.length - 1;
}
