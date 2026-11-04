import { STAIRS, WORLD_DOORS, ROOM_SIZE, worldDoorCell } from '../content/world';
import type { Cell2, WorldRoom } from '../content/world';
import { HOUSE } from '../content/house';
import { walkGrid } from '../content/worldGrid';

/** Path finding on the world layout v2 grids (src/content/worldGrid.ts). Deterministic; legacy path.ts stays until Gate B. */
const DIRS: ReadonlyArray<readonly [number, number]> = [[1, 0], [0, 1], [-1, 0], [0, -1]];
const GRIDS = new Map<WorldRoom, boolean[][]>();
const grid = (room: WorldRoom): boolean[][] => {
  let g = GRIDS.get(room);
  if (!g) { g = walkGrid(room); GRIDS.set(room, g); }
  return g;
};
const inRoom = (room: WorldRoom, c: Cell2): boolean =>
  Number.isInteger(c.x) && Number.isInteger(c.y) && c.x >= 0 && c.y >= 0 && c.x < ROOM_SIZE[room].w && c.y < ROOM_SIZE[room].d;
export const worldWalkable = (room: WorldRoom, c: Cell2, extra?: ReadonlySet<number>): boolean =>
  inRoom(room, c) && (grid(room)[c.y] as boolean[])[c.x] === true && !extra?.has(c.y * 64 + c.x);

/**
 * Shortest 4-neighbour path in one room, endpoints included. `from` may stand on a blocked cell. A blocked `to`
 * ends at the nearest free neighbour. `[]` when unreachable or out of the room. `extra` = more blocked cells (y*64+x).
 */
export function worldPathTo(room: WorldRoom, from: Cell2, to: Cell2, extra?: ReadonlySet<number>): Cell2[] {
  if (!inRoom(room, from) || !inRoom(room, to)) return [];
  const free = (c: Cell2): boolean => worldWalkable(room, c, extra);
  const goals = new Set<number>();
  if (free(to)) goals.add(to.y * 64 + to.x);
  else for (const [dx, dy] of DIRS) if (free({ x: to.x + dx, y: to.y + dy })) goals.add((to.y + dy) * 64 + to.x + dx);
  if (goals.size === 0) return [];
  const start = from.y * 64 + from.x;
  const prev = new Map<number, number>();
  const seen = new Set<number>([start]);
  const queue = [start];
  for (let qi = 0; qi < queue.length; qi++) {
    const k = queue[qi] as number;
    if (goals.has(k)) {
      const cells: Cell2[] = [];
      for (let c: number | undefined = k; c !== undefined; c = prev.get(c)) cells.push({ x: c % 64, y: Math.floor(c / 64) });
      return cells.reverse();
    }
    const x = k % 64, y = Math.floor(k / 64);
    for (const [dx, dy] of DIRS) {
      const n = { x: x + dx, y: y + dy }, nk = n.y * 64 + n.x;
      if (seen.has(nk) || !free(n)) continue;
      seen.add(nk);
      prev.set(nk, k);
      queue.push(nk);
    }
  }
  return [];
}

/** Steps between two cells in one room, or -1 when unreachable. */
export function worldPathLength(room: WorldRoom, from: Cell2, to: Cell2, extra?: ReadonlySet<number>): number {
  const p = worldPathTo(room, from, to, extra);
  return p.length === 0 ? -1 : p.length - 1;
}

/** Free cells orthogonally next to a spot's footprint (where the avatar stands to use it), ordered by y then x. */
export function worldStandCells(room: WorldRoom, spotId: string, extra?: ReadonlySet<number>): Cell2[] {
  const sp = HOUSE.find((s) => s.id === spotId && s.room === room);
  if (!sp) return [];
  const i = sp.iso, out: Cell2[] = [];
  for (let x = i.gx - 1; x <= i.gx + i.w; x++) for (let y = i.gy - 1; y <= i.gy + i.d; y++) {
    const inX = x >= i.gx && x < i.gx + i.w, inY = y >= i.gy && y < i.gy + i.d;
    if ((inX !== inY) && worldWalkable(room, { x, y }, extra)) out.push({ x, y });
  }
  return out.sort((a, b) => a.y - b.y || a.x - b.x);
}

/** Shortest path from `from` to the nearest stand cell of a spot; [] when the spot is unknown or walled in. */
export function worldPathToSpot(room: WorldRoom, from: Cell2, spotId: string, extra?: ReadonlySet<number>): Cell2[] {
  let best: Cell2[] = [];
  for (const c of worldStandCells(room, spotId, extra)) {
    const p = worldPathTo(room, from, c, extra);
    if (p.length > 0 && (best.length === 0 || p.length < best.length)) best = p;
  }
  return best;
}

/** One leg of a house route: walk `cells` inside `room`; `via` is how the avatar leaves it (door on the same floor, or the stairs). The last leg has no `via`. */
export interface RouteLeg { room: WorldRoom; cells: Cell2[]; via?: 'door' | 'stairs' }

/** Room-to-room links: doors both ways, plus the staircase between its lower and upper room. */
function links(room: WorldRoom): Array<{ to: WorldRoom; out: Cell2; arrive: Cell2; via: 'door' | 'stairs' }> {
  const res: Array<{ to: WorldRoom; out: Cell2; arrive: Cell2; via: 'door' | 'stairs' }> = [];
  for (const d of WORLD_DOORS) {
    const other = d.a === room ? d.b : d.b === room ? d.a : undefined;
    if (!other) continue;
    res.push({ to: other, out: worldDoorCell(room, other) as Cell2, arrive: worldDoorCell(other, room) as Cell2, via: 'door' });
  }
  if (room === STAIRS.lower) res.push({ to: STAIRS.upper, out: STAIRS.board, arrive: STAIRS.landing, via: 'stairs' });
  if (room === STAIRS.upper) res.push({ to: STAIRS.lower, out: STAIRS.landing, arrive: STAIRS.board, via: 'stairs' });
  return res;
}

/**
 * Whole-house route as legs, fewest legs first, then shortest walk (Dijkstra over room entry cells). Returns [] when the
 * target room cannot be reached or a leg is blocked. Same-room routes are a single leg.
 */
export function houseRoute(fromRoom: WorldRoom, from: Cell2, toRoom: WorldRoom, to: Cell2): RouteLeg[] {
  interface Node { room: WorldRoom; cell: Cell2; cost: number; legs: RouteLeg[] }
  const todo: Node[] = [{ room: fromRoom, cell: from, cost: 0, legs: [] }];
  let found: { cost: number; legs: RouteLeg[] } | undefined;
  while (todo.length > 0) {
    todo.sort((a, b) => a.cost - b.cost);
    const cur = todo.shift() as Node;
    if (found && cur.cost >= found.cost) break;
    if (cur.room === toRoom) {
      const fin = worldPathTo(toRoom, cur.cell, to);
      if (fin.length > 0) found = { cost: cur.cost + fin.length - 1, legs: [...cur.legs, { room: toRoom, cells: fin }] };
      continue;
    }
    for (const l of links(cur.room)) {
      if (l.to === fromRoom || cur.legs.some((p) => p.room === l.to)) continue;
      const leg = worldPathTo(cur.room, cur.cell, l.out);
      if (leg.length === 0) continue;
      todo.push({ room: l.to, cell: l.arrive, cost: cur.cost + leg.length, legs: [...cur.legs, { room: cur.room, cells: leg, via: l.via }] });
    }
  }
  return found?.legs ?? [];
}
