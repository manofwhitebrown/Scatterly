import { Rng, deriveSeed } from '../rng';
import type { PuzzleDifficulty as Difficulty } from '../../shared/types';
import { type PuzzleDef, at } from './types';

export type Op = '+' | '-' | '*' | '/';
/** a and b index the growing pool (originals first, then each step's result). */
export interface TargetStep { a: number; b: number; op: Op }
export interface TargetSpec { numbers: number[]; target: number; steps: TargetStep[] }

const OPS: readonly Op[] = ['+', '-', '*', '/'];

export function applyOp(a: number, b: number, op: Op): number | null {
  let r: number;
  switch (op) {
    case '+': r = a + b; break;
    case '-': r = a - b; break;
    case '*': r = a * b; break;
    default: if (b <= 1 || a % b !== 0) return null; r = a / b;
  }
  return Number.isInteger(r) && r >= 1 && r <= 9999 ? r : null;
}

function build(rng: Rng, count: number, steps: number, lo: number, hi: number): TargetSpec | null {
  const numbers = Array.from({ length: count }, () => rng.int(lo, hi));
  const pool = numbers.slice();
  const alive = pool.map(() => true);
  const out: TargetStep[] = [];
  for (let s = 0; s < steps; s++) {
    const idx = pool.map((_, i) => i).filter((i) => alive[i]);
    let done = false;
    for (let t = 0; t < 12 && !done; t++) {
      const [i, j] = rng.shuffle(idx);
      if (i === undefined || j === undefined) return null;
      for (const op of rng.shuffle(OPS)) {
        const r = applyOp(at(pool, i), at(pool, j), op);
        if (r === null) continue;
        out.push({ a: i, b: j, op });
        alive[i] = false; alive[j] = false;
        pool.push(r); alive.push(true);
        done = true;
        break;
      }
    }
    if (!done) return null;
  }
  const target = at(pool, pool.length - 1);
  if (target < 10 || target > 999 || numbers.includes(target)) return null;
  return { numbers, target, steps: out };
}

function generate(seed: number, d: Difficulty): TargetSpec {
  const rng = new Rng(deriveSeed(seed, 202));
  const count = Math.min(6, d + 3);
  const steps = Math.min(5, d + 1);
  const hi = [0, 9, 12, 25, 30, 40][d] ?? 25;
  for (let i = 0; i < 400; i++) {
    const spec = build(rng, count, steps, 1, hi);
    if (spec) return spec;
  }
  return { numbers: [3, 4, 5, 6], target: 17, steps: [{ a: 0, b: 1, op: '*' }, { a: 4, b: 2, op: '+' }] };
}

export function simulate(spec: TargetSpec, steps: readonly TargetStep[]): boolean {
  const pool = spec.numbers.slice();
  const alive = pool.map(() => true);
  if (steps.length === 0) return false;
  for (const s of steps) {
    if (!s || !Number.isInteger(s.a) || !Number.isInteger(s.b) || s.a === s.b) return false;
    if (!alive[s.a] || !alive[s.b] || !OPS.includes(s.op)) return false;
    const r = applyOp(at(pool, s.a), at(pool, s.b), s.op);
    if (r === null) return false;
    alive[s.a] = false; alive[s.b] = false;
    pool.push(r); alive.push(true);
    if (r === spec.target) return true;
  }
  return false;
}

export const targetPuzzle: PuzzleDef<TargetSpec, TargetStep[]> = {
  tier: 1,
  unlockDay: 2,
  generate,
  check: (spec, answer) => Array.isArray(answer) && simulate(spec, answer),
  solve: (spec) => spec.steps.slice(),
  hint(spec, progress = 0) {
    const s = spec.steps[Math.min(progress, spec.steps.length - 1)];
    if (!s) return 'Combine two numbers to get closer.';
    const pool = spec.numbers.slice();
    for (let i = 0; i < Math.min(progress, spec.steps.length - 1); i++) {
      const p = at(spec.steps, i);
      pool.push(applyOp(at(pool, p.a), at(pool, p.b), p.op) ?? 0);
    }
    return `Try combining ${at(pool, s.a)} and ${at(pool, s.b)} with "${s.op === '*' ? 'x' : s.op}".`;
  },
  parSeconds: (d) => (d === 1 ? 18 : d === 2 ? 40 : 75),
};
