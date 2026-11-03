import { Rng, deriveSeed } from '../rng';
import type { Difficulty } from '../../shared/types';
import { type PuzzleDef, at, isIntArray } from './types';

/**
 * Linked dials. Each button turns the dials it is wired to by the shown amount (positions wrap around).
 * Bring every dial back to 0. Answer = how many times to press each button.
 * AHA: don't fiddle. Find a dial that few buttons reach, fix its button count from where it stands, then the
 * next dial has one unknown fewer. Every layout is an invertible system mod a prime, so there is exactly ONE
 * press count (0..m-1) per button; extra full turns change nothing, so `check` accepts any counts that work.
 *
 * Levels (difficulty 1-3 = levels 1-3):
 *   1: 3 dials, 5 positions   2: 3 dials, 7 positions   3: 4 dials, 5 positions
 *   4: 4 dials, 7 positions, buttons may also turn dials backwards
 *   5: 5 dials, 7 positions, dense wiring, backwards turns
 */
export interface DialSpec {
  m: number; level: number;
  start: number[];            // dial positions now
  buttons: number[][];        // buttons[b][d] = turns of dial d per press (0..m-1; m-1 means one step back)
  solution: number[];         // presses per button, 0..m-1
}

const LEVELS: Record<number, { k: number; m: number; p: number; back: boolean }> = {
  1: { k: 3, m: 5, p: 0.3, back: false }, 2: { k: 3, m: 7, p: 0.4, back: false },
  3: { k: 4, m: 5, p: 0.35, back: false }, 4: { k: 4, m: 7, p: 0.4, back: true },
  5: { k: 5, m: 7, p: 0.5, back: true },
};

const inv = (a: number, m: number): number => { for (let x = 1; x < m; x++) if ((a * x) % m === 1) return x; return 0; };

/** Determinant != 0 mod prime m (Gaussian elimination). */
function invertible(mat: readonly number[][], m: number): boolean {
  const k = mat.length;
  const a = mat.map((r) => r.slice());
  for (let c = 0; c < k; c++) {
    const pr = a.findIndex((r, i) => i >= c && at(r, c) % m !== 0);
    if (pr < 0) return false;
    const tmp = at(a, pr); a[pr] = at(a, c); a[c] = tmp;
    const iv = inv(at(at(a, c), c), m);
    for (let i = c + 1; i < k; i++) {
      const f = (at(at(a, i), c) * iv) % m;
      if (f === 0) continue;
      const row = at(a, i), piv = at(a, c);
      for (let j = c; j < k; j++) row[j] = (((at(row, j) - f * at(piv, j)) % m) + m) % m;
    }
  }
  return true;
}

function effect(spec: Pick<DialSpec, 'm' | 'buttons'>, presses: readonly number[]): number[] {
  const out = new Array<number>(spec.buttons[0]?.length ?? 0).fill(0);
  spec.buttons.forEach((b, j) => b.forEach((t, d) => { out[d] = (at(out, d) + t * (presses[j] ?? 0)) % spec.m; }));
  return out;
}

function generateLevel(seed: number, level: number): DialSpec {
  const lv = Math.max(1, Math.min(5, level));
  const { k, m, p, back } = LEVELS[lv] as (typeof LEVELS)[number];
  const rng = new Rng(deriveSeed(seed, 7171 + lv));
  for (let attempt = 0; attempt < 500; attempt++) {
    const buttons = Array.from({ length: k }, (_, b) =>
      Array.from({ length: k }, (_, d) => (d === b ? 1 : rng.next() < p ? (back && rng.next() < 0.4 ? m - 1 : 1) : 0)));
    const wired = buttons.reduce((a, r) => a + r.filter((v) => v !== 0).length, 0);
    if (wired < k + Math.ceil(k / 2) || !invertible(buttons, m)) continue;
    const solution = Array.from({ length: k }, () => rng.int(0, m - 1));
    if (solution.filter((v) => v > 0).length < Math.ceil(k / 2) + 1) continue;
    const pushed = effect({ m, buttons }, solution);
    const start = pushed.map((v) => (m - v) % m);
    if (start.every((v) => v === 0)) continue;
    return { m, level: lv, start, buttons, solution };
  }
  throw new Error('dial: generation failed');
}

function hint(spec: DialSpec, progress = 0): string {
  if (progress <= 0) return 'Find a dial that few buttons reach. Its own button count is fixed by where it stands now.';
  if (progress === 1) return `Each press turns every wired dial; positions wrap after ${spec.m - 1}. All dials must end on 0. Extra full turns of ${spec.m} presses change nothing.`;
  const b = Math.min(progress - 2, spec.solution.length - 1);
  return `Button ${b + 1} needs ${at(spec.solution, b)} press${at(spec.solution, b) === 1 ? '' : 'es'} (or ${at(spec.solution, b) + spec.m}, or any count with the same remainder).`;
}

export const dialPuzzle: PuzzleDef<DialSpec, number[]> = {
  tier: 2,
  unlockDay: 7,
  generate: (seed, d: Difficulty) => generateLevel(seed, d),
  check(spec, answer) {
    if (!isIntArray(answer) || answer.length !== spec.buttons.length || answer.some((v) => v < 0 || v > 999)) return false;
    const e = effect(spec, answer);
    return spec.start.every((s, d) => (s + at(e, d)) % spec.m === 0);
  },
  solve: (spec) => spec.solution.slice(),
  hint,
  parSeconds: (d) => (d === 1 ? 30 : d === 2 ? 55 : 90),
};

export const dialLevel = generateLevel;
/** Number of press vectors in 0..m-1 that solve the dials (must be 1). Brute force; for tests only. */
export function dialSolutions(spec: DialSpec): number {
  const k = spec.buttons.length;
  let total = 0;
  const walk = (cur: number[]): void => {
    if (cur.length === k) {
      const e = effect(spec, cur);
      if (spec.start.every((s, d) => (s + at(e, d)) % spec.m === 0)) total++;
      return;
    }
    for (let v = 0; v < spec.m; v++) walk([...cur, v]);
  };
  walk([]);
  return total;
}
