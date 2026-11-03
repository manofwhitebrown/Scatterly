import { Rng, deriveSeed } from '../rng';
import type { Difficulty } from '../../shared/types';
import { type PuzzleDef, at, isIntArray } from './types';

/**
 * Mini sudoku. Fill the grid so every row, column and box holds each digit exactly once.
 * AHA: pick the cell where only one digit still fits (a "naked single"), or the digit that has only one
 * cell left in a row, column or box (a "hidden single"). Every puzzle has exactly ONE solution (checked at generation).
 *
 * Levels (difficulty 1-3 map to levels 1-3; 4-5 are the hard variants used from day 5 / day 10):
 *   1: 4x4, 10 givens   2: 4x4, 7 givens   3: 6x6 (2x3 boxes), 19 givens
 *   4: 6x6, 15 givens   5: 6x6, as few givens as stay unique (about 11), no naked-single start guaranteed
 */
export interface SudokuSpec {
  n: number; boxR: number; boxC: number; level: number;
  givens: number[];            // 0 = empty
  solution: number[];
}

const LEVELS: Record<number, { n: number; boxR: number; boxC: number; givens: number }> = {
  1: { n: 4, boxR: 2, boxC: 2, givens: 10 },
  2: { n: 4, boxR: 2, boxC: 2, givens: 7 },
  3: { n: 6, boxR: 2, boxC: 3, givens: 19 },
  4: { n: 6, boxR: 2, boxC: 3, givens: 15 },
  5: { n: 6, boxR: 2, boxC: 3, givens: 0 },
};

interface Shape { n: number; boxR: number; boxC: number }

function candidates(sh: Shape, g: readonly number[], cell: number): number[] {
  const { n, boxR, boxC } = sh;
  const r = Math.floor(cell / n), c = cell % n;
  const used = new Set<number>();
  for (let i = 0; i < n; i++) { used.add(at(g, r * n + i)); used.add(at(g, i * n + c)); }
  const br = r - (r % boxR), bc = c - (c % boxC);
  for (let i = 0; i < boxR; i++) for (let j = 0; j < boxC; j++) used.add(at(g, (br + i) * n + bc + j));
  const out: number[] = [];
  for (let v = 1; v <= n; v++) if (!used.has(v)) out.push(v);
  return out;
}

/** Counts solutions up to `cap` (MRV backtracking); optional shuffled value order for filling. */
function count(sh: Shape, g: number[], cap: number, rng?: Rng): { n: number; first: number[] | null } {
  let best = -1, bestC: number[] = [];
  for (let i = 0; i < g.length; i++) {
    if (g[i] !== 0) continue;
    const cs = candidates(sh, g, i);
    if (best < 0 || cs.length < bestC.length) { best = i; bestC = cs; if (cs.length <= 1) break; }
  }
  if (best < 0) return { n: 1, first: g.slice() };
  let total = 0, first: number[] | null = null;
  for (const v of rng ? rng.shuffle(bestC) : bestC) {
    g[best] = v;
    const r = count(sh, g, cap - total, rng);
    total += r.n;
    if (!first) first = r.first;
    if (total >= cap) break;
  }
  g[best] = 0;
  return { n: total, first };
}

function generateLevel(seed: number, level: number): SudokuSpec {
  const lv = LEVELS[Math.max(1, Math.min(5, level))] as (typeof LEVELS)[number];
  const sh: Shape = lv;
  const rng = new Rng(deriveSeed(seed, 1212 + level));
  const full = count(sh, new Array<number>(lv.n * lv.n).fill(0), 1, rng).first as number[];
  const g = full.slice();
  let givens = g.length;
  const target = lv.givens;
  for (const cell of rng.shuffle(g.map((_, i) => i))) {
    if (givens <= target) break;
    const v = at(g, cell);
    g[cell] = 0;
    if (count(sh, g, 2).n === 1) givens--; else g[cell] = v;
  }
  return { n: lv.n, boxR: lv.boxR, boxC: lv.boxC, level: Math.max(1, Math.min(5, level)), givens: g, solution: full };
}

function valid(spec: SudokuSpec, a: readonly number[]): boolean {
  const { n, boxR, boxC } = spec;
  if (a.length !== n * n || a.some((v) => v < 1 || v > n)) return false;
  if (spec.givens.some((v, i) => v !== 0 && v !== a[i])) return false;
  const full = (1 << (n + 1)) - 2;
  for (let k = 0; k < n; k++) {
    let row = 0, col = 0, box = 0;
    const br = Math.floor(k / (n / boxC)) * boxR, bc = (k % (n / boxC)) * boxC;
    for (let i = 0; i < n; i++) {
      row |= 1 << at(a, k * n + i);
      col |= 1 << at(a, i * n + k);
      box |= 1 << at(a, (br + Math.floor(i / boxC)) * n + bc + (i % boxC));
    }
    if (row !== full || col !== full || box !== full) return false;
  }
  return true;
}

/** Hint ladder: 0 nudge, 1 rule restated, 2+ reveals one cell (an empty cell with a single candidate, else the first empty). */
function hint(spec: SudokuSpec, progress = 0): string {
  if (progress <= 0) return 'Look for a cell where only one digit still fits, or a digit that has just one cell left in its row, column or box.';
  if (progress === 1) return `Each row, column and ${spec.boxR}x${spec.boxC} box holds every digit from 1 to ${spec.n} exactly once.`;
  const empties = spec.givens.map((v, i) => (v === 0 ? i : -1)).filter((i) => i >= 0);
  const single = empties.find((i) => candidates(spec, spec.givens, i).length === 1);
  const cell = single ?? empties[0] ?? 0;
  return `Row ${Math.floor(cell / spec.n) + 1}, column ${(cell % spec.n) + 1} is ${at(spec.solution, cell)}.`;
}

export const LEVEL_PAR_SECONDS = [30, 60, 120, 180, 300] as const;

export const sudokuPuzzle: PuzzleDef<SudokuSpec, number[]> = {
  tier: 2,
  unlockDay: 4,
  generate: (seed, d: Difficulty) => generateLevel(seed, d),
  check: (spec, answer) => isIntArray(answer) && valid(spec, answer),
  solve: (spec) => spec.solution.slice(),
  hint,
  parSeconds: (d) => (d === 1 ? 30 : d === 2 ? 50 : 90),
};

/** Level 1-5 entry point (levels 4-5 are not reachable through Scenario difficulty 1-3). */
export const sudokuLevel = generateLevel;
export const countSolutions = (spec: SudokuSpec): number => count(spec, spec.givens.slice(), 3).n;
