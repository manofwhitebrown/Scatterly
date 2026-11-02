import { Rng, deriveSeed } from '../rng';
import type { Difficulty } from '../../shared/types';
import { type PuzzleCtx, type PuzzleDef, at } from './types';

/** Positions are normalised to 0..1 inside the play area. */
export type Pt = [number, number];
export interface UntangleSpec {
  cols: number; rows: number;
  edges: Array<[number, number]>;
  /** A crossing-free arrangement (the reference solution). */
  solved: Pt[];
  /** The tangled starting arrangement (>= minCross crossings). */
  start: Pt[];
  minCross: number;
  theme: 'cable' | 'necklace' | 'headphones';
}

const LAYOUT: Record<Difficulty, { cols: number; rows: number; drop: number; minCross: number }> = {
  1: { cols: 3, rows: 2, drop: 0, minCross: 2 },
  2: { cols: 3, rows: 3, drop: 0, minCross: 4 },
  3: { cols: 4, rows: 4, drop: 3, minCross: 6 },
};

function themeOf(context: string | undefined): UntangleSpec['theme'] {
  const c = (context ?? '').toLowerCase();
  if (/cable|charg|cord|wire/.test(c)) return 'cable';
  if (/necklace|chain|pendant|bead/.test(c)) return 'necklace';
  return 'headphones';
}

function orient(a: Pt, b: Pt, c: Pt): number {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}
function segCross(a: Pt, b: Pt, c: Pt, d: Pt): boolean {
  const o1 = orient(a, b, c), o2 = orient(a, b, d), o3 = orient(c, d, a), o4 = orient(c, d, b);
  return ((o1 > 0 && o2 < 0) || (o1 < 0 && o2 > 0)) && ((o3 > 0 && o4 < 0) || (o3 < 0 && o4 > 0));
}

/** Number of crossing pairs of edges that do not share a node. */
export function crossings(edges: ReadonlyArray<readonly [number, number]>, pts: readonly Pt[]): number {
  let n = 0;
  for (let i = 0; i < edges.length; i++) for (let j = i + 1; j < edges.length; j++) {
    const [a, b] = at(edges, i), [c, d] = at(edges, j);
    if (a === c || a === d || b === c || b === d) continue;
    if (segCross(at(pts, a), at(pts, b), at(pts, c), at(pts, d))) n++;
  }
  return n;
}

function generate(seed: number, d: Difficulty, ctx?: PuzzleCtx): UntangleSpec {
  const rng = new Rng(deriveSeed(seed, 909));
  const L = LAYOUT[d];
  const { cols, rows } = L;
  const corners = rng.shuffle([0, cols - 1, (rows - 1) * cols, rows * cols - 1]);
  const removed = new Set(corners.slice(0, L.drop));
  const idx = new Array<number>(cols * rows).fill(-1);
  const solved: Pt[] = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const k = r * cols + c;
    if (removed.has(k)) continue;
    idx[k] = solved.length;
    solved.push([0.06 + 0.88 * (c / (cols - 1)) + (rng.next() - 0.5) * 0.04, 0.1 + 0.8 * (r / (rows - 1)) + (rng.next() - 0.5) * 0.05]);
  }
  const edges: Array<[number, number]> = [];
  const link = (a: number, b: number): void => { if (a >= 0 && b >= 0) edges.push([a, b]); };
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const a = at(idx, r * cols + c);
    if (a < 0) continue;
    if (c + 1 < cols) link(a, at(idx, r * cols + c + 1));
    if (r + 1 < rows) link(a, at(idx, (r + 1) * cols + c));
    if (c + 1 < cols && r + 1 < rows) {
      const tl = a, tr = at(idx, r * cols + c + 1), bl = at(idx, (r + 1) * cols + c), br = at(idx, (r + 1) * cols + c + 1);
      if (tl >= 0 && tr >= 0 && bl >= 0 && br >= 0) { if (rng.chance(0.5)) link(tl, br); else link(tr, bl); }
    }
  }
  const order = solved.map((_, i) => i);
  const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
  let start: Pt[] = [];
  let bestN = -1;
  // Jitter is part of each candidate, so the crossing count is measured on exactly the positions that ship.
  for (let attempt = 0; attempt < 300 && bestN < L.minCross; attempt++) {
    const perm = rng.shuffle(order);
    const pts = order.map((i): Pt => {
      const p = at(solved, at(perm, i));
      return [clamp(p[0] + (rng.next() - 0.5) * 0.02, 0.02, 0.98), clamp(p[1] + (rng.next() - 0.5) * 0.03, 0.02, 0.98)];
    });
    const n = crossings(edges, pts);
    if (n > bestN) { bestN = n; start = pts; }
  }
  if (bestN < L.minCross) throw new Error('untangle: could not tangle enough');
  return { cols, rows, edges, solved, start, minCross: L.minCross, theme: themeOf(ctx?.context) };
}

export const untanglePuzzle: PuzzleDef<UntangleSpec, Pt[]> = {
  tier: 1,
  unlockDay: 1,
  generate,
  check(spec, answer) {
    if (!Array.isArray(answer) || answer.length !== spec.solved.length) return false;
    const ok = answer.every((p) => Array.isArray(p) && p.length === 2 && Number.isFinite(p[0]) && Number.isFinite(p[1]) && p[0] >= 0 && p[0] <= 1 && p[1] >= 0 && p[1] <= 1);
    return ok && crossings(spec.edges, answer) === 0;
  },
  solve: (spec) => spec.solved.map((p): Pt => [p[0], p[1]]),
  hint(spec, progress = 0) {
    return progress <= 0 ? 'Move the knots so no cords cross. Start with the ones tangled the most.' : `Aim for ${spec.cols} columns and ${spec.rows} rows, like a net.`;
  },
  parSeconds: (d) => (d === 1 ? 15 : d === 2 ? 35 : 70),
};
