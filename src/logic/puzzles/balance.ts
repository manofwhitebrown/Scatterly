import { Rng, deriveSeed } from '../rng';
import type { Difficulty } from '../../shared/types';
import { type PuzzleDef, at, isIntArray } from './types';

/**
 * Balance. Several scales are shown balanced, each with shapes on both pans. Work out how many of one shape
 * balance a pan of other shapes (one or more questions). AHA: swap a shape for the combination it balances,
 * one scale at a time, until the question pan is written in the answer shape only.
 * Fair by construction: the equations always have rank (shapes - 1) (checked exactly with integer elimination),
 * so every ratio between shapes is determined and each question has one integer answer. Several questions make
 * blind guessing hopeless (answer is a list).
 *
 * Levels (difficulty 1-3 = levels 1-3):
 *   1: 3 shapes, weights <= 4, 1 question   2: 3 shapes, weights <= 6, 1 question
 *   3: 4 shapes, 2 questions                4: 4 shapes, weights <= 8, 2 questions, 1 irrelevant true scale
 *   5: 5 shapes, 3 questions, 2 irrelevant true scales, up to 3 shapes per pan
 */
export const SHAPES = ['circle', 'square', 'triangle', 'star', 'heart'] as const;
export interface Scale { left: number[]; right: number[] }          // counts per shape index
export interface BalanceQuery { pan: number[]; target: number }      // how many of `target` balance `pan`
export interface BalanceSpec {
  level: number; shapes: number; scales: Scale[]; queries: BalanceQuery[];
  expected: number[]; weights: number[];
}

const LEVELS: Record<number, { k: number; maxW: number; q: number; extra: number; perPan: number }> = {
  1: { k: 3, maxW: 4, q: 1, extra: 0, perPan: 1 }, 2: { k: 3, maxW: 6, q: 1, extra: 0, perPan: 2 },
  3: { k: 4, maxW: 6, q: 2, extra: 0, perPan: 2 }, 4: { k: 4, maxW: 8, q: 2, extra: 1, perPan: 2 },
  5: { k: 5, maxW: 8, q: 3, extra: 2, perPan: 3 },
};

const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));

function rank(rows: readonly number[][], k: number): number {
  const m = rows.map((r) => r.slice());
  let rk = 0;
  for (let c = 0; c < k && rk < m.length; c++) {
    const pr = m.findIndex((r, i) => i >= rk && r[c] !== 0);
    if (pr < 0) continue;
    const tmp = at(m, pr); m[pr] = at(m, rk); m[rk] = tmp;
    const piv = at(m, rk);
    for (let i = 0; i < m.length; i++) {
      const row = at(m, i);
      if (i === rk || row[c] === 0) continue;
      const a = at(piv, c), b = at(row, c);
      let g = 0;
      for (let j = 0; j < k; j++) { row[j] = at(row, j) * a - at(piv, j) * b; g = gcd(g, at(row, j)); }
      if (g > 1) for (let j = 0; j < k; j++) row[j] = at(row, j) / g;
    }
    rk++;
  }
  return rk;
}

const dot = (counts: readonly number[], w: readonly number[]): number => counts.reduce((a, c, i) => a + c * at(w, i), 0);
const row = (s: Scale): number[] => s.left.map((v, i) => v - at(s.right, i));

function randomScale(k: number, w: readonly number[], perPan: number, rng: Rng): Scale | null {
  const idx = Array.from({ length: k }, (_, i) => i);
  const lk = rng.int(1, Math.min(perPan, k - 1));
  const leftShapes = rng.shuffle(idx).slice(0, lk);
  const left = new Array<number>(k).fill(0);
  for (const s of leftShapes) left[s] = rng.int(1, 3);
  const total = dot(left, w);
  const others = idx.filter((i) => !leftShapes.includes(i));
  const rk = rng.int(1, Math.min(perPan, others.length));
  const rs = rng.shuffle(others).slice(0, rk);
  const found: number[][] = [];
  const fill = (j: number, cur: number[], sum: number): void => {
    if (sum > total) return;
    if (j === rs.length) { if (sum === total) found.push(cur.slice()); return; }
    const s = at(rs, j);
    for (let c = 1; c <= 6; c++) { cur[s] = c; fill(j + 1, cur, sum + c * at(w, s)); }
    cur[s] = 0;
  };
  fill(0, new Array<number>(k).fill(0), 0);
  return found.length === 0 ? null : { left, right: rng.pick(found) };
}

function generateLevel(seed: number, level: number): BalanceSpec {
  const lv = Math.max(1, Math.min(5, level));
  const cfg = LEVELS[lv] as (typeof LEVELS)[number];
  const rng = new Rng(deriveSeed(seed, 5151 + lv));
  for (let attempt = 0; attempt < 200; attempt++) {
    const weights = rng.shuffle(Array.from({ length: cfg.maxW }, (_, i) => i + 1)).slice(0, cfg.k);
    const scales: Scale[] = [];
    let guard = 0;
    while (rank(scales.map(row), cfg.k) < cfg.k - 1 && guard++ < 60) {
      const sc = randomScale(cfg.k, weights, cfg.perPan, rng);
      if (sc) scales.push(sc);
    }
    if (rank(scales.map(row), cfg.k) < cfg.k - 1) continue;
    for (let e = 0; e < cfg.extra; e++) { const sc = randomScale(cfg.k, weights, cfg.perPan, rng); if (sc) scales.splice(rng.int(0, scales.length), 0, sc); }
    const queries: BalanceQuery[] = [];
    const used = new Set<string>();
    for (let t = 0; t < 80 && queries.length < cfg.q; t++) {
      const target = rng.int(0, cfg.k - 1);
      const pan = new Array<number>(cfg.k).fill(0);
      for (const s of rng.shuffle(Array.from({ length: cfg.k }, (_, i) => i).filter((i) => i !== target)).slice(0, rng.int(1, 2))) pan[s] = rng.int(1, 3);
      const tot = dot(pan, weights), wt = at(weights, target);
      const n = tot / wt;
      const key = `${target}:${pan.join(',')}`;
      if (tot % wt !== 0 || n < 1 || n > 12 || used.has(key)) continue;
      used.add(key);
      queries.push({ pan, target });
    }
    if (queries.length < cfg.q) continue;
    const expected = queries.map((q) => dot(q.pan, weights) / at(weights, q.target));
    return { level: lv, shapes: cfg.k, scales, queries, expected, weights };
  }
  throw new Error('balance: generation failed');
}

function hint(spec: BalanceSpec, progress = 0): string {
  if (progress <= 0) return 'Pick one scale and swap a shape for the shapes it balances against; repeat until the question uses a single shape.';
  if (progress === 1) return 'Each scale is an equation: whatever is on the left weighs the same as the right. Combine them to compare two shapes directly.';
  const q = Math.min(progress - 2, spec.expected.length - 1);
  return `Question ${q + 1} balances with ${at(spec.expected, q)}.`;
}

export const balancePuzzle: PuzzleDef<BalanceSpec, number[]> = {
  tier: 2,
  unlockDay: 6,
  generate: (seed, d: Difficulty) => generateLevel(seed, d),
  check: (spec, answer) => isIntArray(answer) && answer.length === spec.expected.length && answer.every((v, i) => v === at(spec.expected, i)),
  solve: (spec) => spec.expected.slice(),
  hint,
  parSeconds: (d) => (d === 1 ? 30 : d === 2 ? 55 : 90),
};

export const balanceLevel = generateLevel;
/** True when the scales fix every shape ratio (rank = shapes - 1) and every scale balances under the hidden weights. */
export const balanceDetermined = (spec: BalanceSpec): boolean =>
  rank(spec.scales.map(row), spec.shapes) === spec.shapes - 1 && spec.scales.every((s) => dot(row(s), spec.weights) === 0);
