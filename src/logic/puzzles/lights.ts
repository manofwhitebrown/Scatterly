import { Rng, deriveSeed } from '../rng';
import type { Difficulty } from '../../shared/types';
import { type PuzzleDef, at, isIntArray, popcount } from './types';

/** Lights Out: pressing a cell toggles it and its 4 neighbours. Goal: every light off. */
export interface LightsSpec { n: number; cells: boolean[]; minPresses: number }

function effect(n: number, cell: number): number {
  const r = Math.floor(cell / n), c = cell % n;
  let m = 1 << cell;
  if (r > 0) m |= 1 << (cell - n);
  if (r < n - 1) m |= 1 << (cell + n);
  if (c > 0) m |= 1 << (cell - 1);
  if (c < n - 1) m |= 1 << (cell + 1);
  return m;
}

function apply(n: number, presses: readonly number[]): number {
  let board = 0;
  for (const p of presses) board ^= effect(n, p);
  return board;
}

const toBits = (cells: readonly boolean[]): number => cells.reduce((a, v, i) => (v ? a | (1 << i) : a), 0);

/** Minimum-weight press set (bitmask) that clears `board`, via GF(2) elimination. */
export function minSolution(n: number, board: number): number {
  const size = n * n;
  const rows: Array<{ m: number; r: number }> = [];
  for (let i = 0; i < size; i++) {
    let m = 0;
    for (let j = 0; j < size; j++) if (effect(n, j) & (1 << i)) m |= 1 << j;
    rows.push({ m, r: (board >> i) & 1 });
  }
  const pivots: number[] = [];
  let rank = 0;
  for (let c = 0; c < size && rank < size; c++) {
    const pr = rows.findIndex((row, idx) => idx >= rank && (row.m >> c) & 1);
    if (pr < 0) continue;
    const tmp = at(rows, pr); rows[pr] = at(rows, rank); rows[rank] = tmp;
    const piv = at(rows, rank);
    for (let k = 0; k < size; k++) {
      const row = at(rows, k);
      if (k !== rank && (row.m >> c) & 1) { row.m ^= piv.m; row.r ^= piv.r; }
    }
    pivots.push(c);
    rank++;
  }
  let part = 0;
  pivots.forEach((c, i) => { if (at(rows, i).r) part |= 1 << c; });
  const free: number[] = [];
  for (let c = 0; c < size; c++) if (!pivots.includes(c)) free.push(c);
  const basis = free.map((f) => {
    let v = 1 << f;
    pivots.forEach((pc, i) => { if ((at(rows, i).m >> f) & 1) v |= 1 << pc; });
    return v;
  });
  let best = part;
  for (let mask = 1; mask < 1 << basis.length; mask++) {
    let v = part;
    basis.forEach((b, i) => { if ((mask >> i) & 1) v ^= b; });
    if (popcount(v) < popcount(best)) best = v;
  }
  return best;
}

function generate(seed: number, d: Difficulty): LightsSpec {
  const rng = new Rng(deriveSeed(seed, 404));
  const n = d + 2;
  for (let tries = 0; tries < 200; tries++) {
    const k = rng.int(d + 2, d * 2 + 3);
    const presses = rng.shuffle(Array.from({ length: n * n }, (_, i) => i)).slice(0, k);
    const board = apply(n, presses);
    if (board === 0) continue;
    const min = popcount(minSolution(n, board));
    if (min < 3) continue;
    return { n, cells: Array.from({ length: n * n }, (_, i) => ((board >> i) & 1) === 1), minPresses: min };
  }
  const board = apply(3, [0, 4, 8]);
  return { n: 3, cells: Array.from({ length: 9 }, (_, i) => ((board >> i) & 1) === 1), minPresses: 3 };
}

export const lightsPuzzle: PuzzleDef<LightsSpec, number[]> = {
  tier: 1,
  unlockDay: 3,
  generate,
  check(spec, answer) {
    if (!isIntArray(answer) || answer.some((p) => p < 0 || p >= spec.n * spec.n)) return false;
    return (toBits(spec.cells) ^ apply(spec.n, answer)) === 0;
  },
  solve(spec) {
    const sol = minSolution(spec.n, toBits(spec.cells));
    return spec.cells.map((_, i) => i).filter((i) => (sol >> i) & 1);
  },
  hint(spec, progress = 0) {
    const cells = lightsPuzzle.solve(spec);
    const c = at(cells, Math.min(progress, cells.length - 1));
    return `Press the cell in row ${Math.floor(c / spec.n) + 1}, column ${(c % spec.n) + 1}.`;
  },
  parSeconds: (d) => (d === 1 ? 20 : d === 2 ? 40 : 70),
};
