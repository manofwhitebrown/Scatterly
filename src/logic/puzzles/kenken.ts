import { Rng, deriveSeed } from '../rng';
import type { Difficulty } from '../../shared/types';
import { type PuzzleDef, at, isIntArray } from './types';

/**
 * KenKen. Fill the n x n grid with 1..n so no digit repeats in a row or column, and every cage's digits
 * combine (with its operator) to the cage target. AHA: start with the cages that leave the fewest digit
 * combinations (a 1-cell cage is a gift, a product of 6 in two cells can only be 2 and 3), then let rows and
 * columns eliminate the rest. Uniqueness is enforced at generation by splitting cages until one solution is left.
 *
 * Levels (difficulty 1-3 = levels 1-3; 4-5 are the hard variants):
 *   1: 3x3, cages up to 2   2: 4x4, cages up to 2   3: 4x4, cages up to 3
 *   4: 5x5, cages up to 3   5: 5x5, cages up to 4, mixed operators and few free givens
 */
export type KenOp = '=' | '+' | '-' | '×' | '÷';
export interface KenCage { cells: number[]; op: KenOp; target: number }
export interface KenKenSpec { n: number; level: number; cages: KenCage[]; solution: number[] }

const LEVELS: Record<number, { n: number; maxCage: number }> = {
  1: { n: 3, maxCage: 2 }, 2: { n: 4, maxCage: 2 }, 3: { n: 4, maxCage: 3 },
  4: { n: 5, maxCage: 3 }, 5: { n: 5, maxCage: 4 },
};

function latin(n: number, rng: Rng): number[] {
  const base = Array.from({ length: n }, (_, i) => i + 1);
  const rows = rng.shuffle(base), cols = rng.shuffle(base), syms = rng.shuffle(base);
  const out: number[] = [];
  for (const r of rows) for (const c of cols) out.push(at(syms, (r + c - 2) % n));
  return out;
}

function combine(op: KenOp, vals: readonly number[]): number {
  if (op === '+') return vals.reduce((a, b) => a + b, 0);
  if (op === '×') return vals.reduce((a, b) => a * b, 1);
  if (op === '-') return Math.abs(at(vals, 0) - at(vals, 1));
  if (op === '÷') { const hi = Math.max(...vals), lo = Math.min(...vals); return hi % lo === 0 ? hi / lo : -1; }
  return at(vals, 0);
}

function makeCage(cells: number[], sol: readonly number[], rng: Rng, level: number): KenCage {
  const vals = cells.map((c) => at(sol, c));
  let ops: KenOp[];
  if (cells.length === 1) ops = ['='];
  else if (cells.length === 2) {
    ops = ['+', '×', '-'];
    if (combine('÷', vals) > 0) ops.push('÷');
    if (level >= 5) ops = ops.filter((o) => o !== '+');
  } else ops = ['+', '×'];
  const op = rng.pick(ops);
  return { cells, op, target: combine(op, vals) };
}

function partition(n: number, maxCage: number, sol: readonly number[], rng: Rng, level: number): KenCage[] {
  const owner = new Array<number>(n * n).fill(-1);
  const cages: KenCage[] = [];
  for (const start of rng.shuffle(Array.from({ length: n * n }, (_, i) => i))) {
    if (owner[start] !== -1) continue;
    const want = rng.int(Math.min(2, maxCage), maxCage);
    const cells = [start];
    owner[start] = cages.length;
    while (cells.length < want) {
      const opts: number[] = [];
      for (const c of cells) {
        const r = Math.floor(c / n), col = c % n;
        for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
          const rr = r + dr, cc = col + dc, k = rr * n + cc;
          if (rr >= 0 && rr < n && cc >= 0 && cc < n && owner[k] === -1) opts.push(k);
        }
      }
      if (opts.length === 0) break;
      const pick = rng.pick(opts);
      owner[pick] = cages.length;
      cells.push(pick);
    }
    cages.push(makeCage(cells, sol, rng, level));
  }
  return cages;
}

/** Counts solutions up to `cap`, pruning with row/column masks and partial cage sums/products. */
function countSolutions(n: number, cages: readonly KenCage[], cap: number): number {
  const cageOf = new Array<number>(n * n).fill(0);
  cages.forEach((cg, i) => cg.cells.forEach((c) => { cageOf[c] = i; }));
  const grid = new Array<number>(n * n).fill(0);
  const rowM = new Array<number>(n).fill(0), colM = new Array<number>(n).fill(0);
  let total = 0;
  const okCage = (i: number): boolean => {
    const cg = at(cages, i);
    const vals = cg.cells.map((c) => at(grid, c));
    const done = vals.every((v) => v > 0);
    if (cg.op === '+') {
      const s = vals.reduce((a, b) => a + b, 0);
      return done ? s === cg.target : s < cg.target;
    }
    if (cg.op === '×') {
      const p = vals.reduce((a, b) => a * (b || 1), 1);
      return done ? p === cg.target : cg.target % p === 0;
    }
    return !done || combine(cg.op, vals) === cg.target;
  };
  const go = (pos: number): void => {
    if (total >= cap) return;
    if (pos === n * n) { total++; return; }
    const r = Math.floor(pos / n), c = pos % n, ci = at(cageOf, pos);
    for (let v = 1; v <= n; v++) {
      const bit = 1 << v;
      if ((at(rowM, r) & bit) || (at(colM, c) & bit)) continue;
      grid[pos] = v; rowM[r] = at(rowM, r) | bit; colM[c] = at(colM, c) | bit;
      if (okCage(ci)) go(pos + 1);
      grid[pos] = 0; rowM[r] = at(rowM, r) & ~bit; colM[c] = at(colM, c) & ~bit;
      if (total >= cap) return;
    }
  };
  go(0);
  return total;
}

function generateLevel(seed: number, level: number): KenKenSpec {
  const lv = Math.max(1, Math.min(5, level));
  const { n, maxCage } = LEVELS[lv] as (typeof LEVELS)[number];
  const rng = new Rng(deriveSeed(seed, 3131 + lv));
  const solution = latin(n, rng);
  let cages = partition(n, maxCage, solution, rng, lv);
  while (countSolutions(n, cages, 2) > 1) {
    const multi = cages.filter((cg) => cg.cells.length > 1);
    const big = rng.pick(multi);
    const cell = rng.pick(big.cells);
    const rest = big.cells.filter((c) => c !== cell);
    cages = cages.filter((cg) => cg !== big);
    cages.push(makeCage([cell], solution, rng, lv), makeCage(rest, solution, rng, lv));
  }
  cages.sort((a, b) => Math.min(...a.cells) - Math.min(...b.cells));
  return { n, level: lv, cages, solution };
}

function valid(spec: KenKenSpec, a: readonly number[]): boolean {
  const { n } = spec;
  if (a.length !== n * n || a.some((v) => v < 1 || v > n)) return false;
  for (let k = 0; k < n; k++) {
    let row = 0, col = 0;
    for (let i = 0; i < n; i++) { row |= 1 << at(a, k * n + i); col |= 1 << at(a, i * n + k); }
    if (row !== (1 << (n + 1)) - 2 || col !== (1 << (n + 1)) - 2) return false;
  }
  return spec.cages.every((cg) => combine(cg.op, cg.cells.map((c) => at(a, c))) === cg.target);
}

/** Hint ladder: 0 nudge, 1 rule restated, 2+ reveals a cell from the biggest cage. */
function hint(spec: KenKenSpec, progress = 0): string {
  if (progress <= 0) return 'Start with the cage that allows the fewest digit combinations, then use rows and columns to rule out the rest.';
  if (progress === 1) return `Digits 1 to ${spec.n} appear once per row and column; each cage's digits must make its target with its operator.`;
  const cage = spec.cages.reduce((b, c) => (c.cells.length > b.cells.length ? c : b));
  const cell = at(cage.cells, 0);
  return `Row ${Math.floor(cell / spec.n) + 1}, column ${(cell % spec.n) + 1} is ${at(spec.solution, cell)}.`;
}

export const kenkenPuzzle: PuzzleDef<KenKenSpec, number[]> = {
  tier: 2,
  unlockDay: 5,
  generate: (seed, d: Difficulty) => generateLevel(seed, d),
  check: (spec, answer) => isIntArray(answer) && valid(spec, answer),
  solve: (spec) => spec.solution.slice(),
  hint,
  parSeconds: (d) => (d === 1 ? 30 : d === 2 ? 55 : 90),
};

export const kenkenLevel = generateLevel;
export const kenkenSolutions = (spec: KenKenSpec): number => countSolutions(spec.n, spec.cages, 3);
