import { Rng, deriveSeed } from '../rng';
import type { Difficulty } from '../../shared/types';
import { type PuzzleDef, at, isIntArray } from './types';

/** 3x3 sliding tiles. tiles[i] is the tile in cell i (0 = blank). Goal: 1..8 then blank. */
export interface SlideSpec { n: 3; tiles: number[]; depth: number; solution: number[] }

const N = 3;
const GOAL = [1, 2, 3, 4, 5, 6, 7, 8, 0];
const DEPTH: Record<Difficulty, readonly [number, number]> = { 1: [8, 10], 2: [11, 14], 3: [15, 18] };

function neighbours(cell: number): number[] {
  const r = Math.floor(cell / N), c = cell % N, out: number[] = [];
  if (r > 0) out.push(cell - N);
  if (r < N - 1) out.push(cell + N);
  if (c > 0) out.push(cell - 1);
  if (c < N - 1) out.push(cell + 1);
  return out;
}
const NEIGH = Array.from({ length: 9 }, (_, i) => neighbours(i));

function manhattan(t: readonly number[]): number {
  let h = 0;
  for (let i = 0; i < 9; i++) {
    const v = at(t, i);
    if (v === 0) continue;
    h += Math.abs(Math.floor(i / N) - Math.floor((v - 1) / N)) + Math.abs((i % N) - ((v - 1) % N));
  }
  return h;
}

/** Optimal solution as a list of tapped cells, found with IDA* (Manhattan). Null if deeper than `max`. */
export function solveSlide(start: readonly number[], max = 24): number[] | null {
  const t = start.slice();
  const path: number[] = [];
  const dfs = (blank: number, g: number, limit: number, prev: number): boolean => {
    const f = g + manhattan(t);
    if (f > limit) return false;
    if (manhattan(t) === 0) return true;
    for (const nb of at(NEIGH, blank)) {
      if (nb === prev) continue;
      t[blank] = at(t, nb); t[nb] = 0;
      path.push(nb);
      if (dfs(nb, g + 1, limit, blank)) return true;
      path.pop();
      t[nb] = at(t, blank); t[blank] = 0;
    }
    return false;
  };
  const blank0 = t.indexOf(0);
  for (let limit = manhattan(t); limit <= max; limit += 2) {
    if (dfs(blank0, 0, limit, -1)) return path.slice();
  }
  return null;
}

function walk(rng: Rng, len: number): number[] {
  const t = GOAL.slice();
  let blank = 8, prev = -1;
  for (let i = 0; i < len; i++) {
    const opts = at(NEIGH, blank).filter((x) => x !== prev);
    const nb = rng.pick(opts);
    t[blank] = at(t, nb); t[nb] = 0;
    prev = blank; blank = nb;
  }
  return t;
}

function play(tiles: readonly number[], taps: readonly number[]): number[] | null {
  const t = tiles.slice();
  let blank = t.indexOf(0);
  for (const c of taps) {
    if (!Number.isInteger(c) || !at(NEIGH, blank).includes(c)) return null;
    t[blank] = at(t, c); t[c] = 0; blank = c;
  }
  return t;
}

function generate(seed: number, d: Difficulty): SlideSpec {
  const rng = new Rng(deriveSeed(seed, 505));
  const [lo, hi] = DEPTH[d];
  for (let tries = 0; tries < 300; tries++) {
    const tiles = walk(rng, rng.int(hi, hi + 14));
    const sol = solveSlide(tiles, hi);
    if (sol && sol.length >= lo && sol.length <= hi) return { n: 3, tiles, depth: sol.length, solution: sol };
  }
  const tiles = [2, 3, 6, 1, 5, 0, 4, 7, 8];
  const sol = solveSlide(tiles, 30) ?? [];
  return { n: 3, tiles, depth: sol.length, solution: sol };
}

export const slidePuzzle: PuzzleDef<SlideSpec, number[]> = {
  tier: 1,
  unlockDay: 4,
  generate,
  check(spec, answer) {
    if (!isIntArray(answer) || answer.length === 0) return false;
    const end = play(spec.tiles, answer);
    return end !== null && end.every((v, i) => v === at(GOAL, i));
  },
  solve: (spec) => spec.solution.slice(),
  hint(spec, progress = 0) {
    const c = at(spec.solution, Math.min(progress, spec.solution.length - 1));
    return `Slide the tile in row ${Math.floor(c / N) + 1}, column ${(c % N) + 1} into the gap.`;
  },
  parSeconds: (d) => (d === 1 ? 25 : d === 2 ? 45 : 80),
};
