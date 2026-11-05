import { Rng, deriveSeed } from '../rng';
import type { PuzzleDifficulty as Difficulty } from '../../shared/types';
import { type PuzzleDef, at, isIntArray } from './types';

/** Sides as bit flags: N=1 E=2 S=4 W=8. A tile's open sides = base mask rotated clockwise `rot` times. */
export interface PipesSpec {
  n: number;
  source: number;
  sinks: number[];
  base: number[];      // unrotated mask per cell
  rots: number[];      // initial (scrambled) rotation per cell, 0..3
  solution: number[];  // one rotation per cell that connects the source to every sink
}

const N = 1, E = 2, S = 4, W = 8;
export const rotate = (mask: number, times: number): number => {
  let m = mask;
  for (let i = 0; i < ((times % 4) + 4) % 4; i++) m = ((m << 1) | (m >> 3)) & 15;
  return m;
};
const canonical = (mask: number): number => {
  for (const b of [N, N | S, N | E, N | E | W, N | E | S | W]) for (let r = 0; r < 4; r++) if (rotate(b, r) === mask) return b;
  return N;
};
const rotFor = (base: number, mask: number): number => {
  for (let r = 0; r < 4; r++) if (rotate(base, r) === mask) return r;
  return 0;
};

function spanningTree(rng: Rng, n: number, root: number): number[] {
  const mask = new Array<number>(n * n).fill(0);
  const seen = new Set<number>([root]);
  const frontier: Array<[number, number, number, number]> = [];
  const push = (cell: number): void => {
    const r = Math.floor(cell / n), c = cell % n;
    if (r > 0) frontier.push([cell, cell - n, N, S]);
    if (c < n - 1) frontier.push([cell, cell + 1, E, W]);
    if (r < n - 1) frontier.push([cell, cell + n, S, N]);
    if (c > 0) frontier.push([cell, cell - 1, W, E]);
  };
  push(root);
  while (frontier.length > 0) {
    const [from, to, a, b] = frontier.splice(rng.int(0, frontier.length - 1), 1)[0] as [number, number, number, number];
    if (seen.has(to)) continue;
    seen.add(to);
    mask[from] = at(mask, from) | a;
    mask[to] = at(mask, to) | b;
    push(to);
  }
  return mask;
}

function connected(n: number, masks: readonly number[], source: number): Set<number> {
  const reach = new Set<number>([source]);
  const queue = [source];
  while (queue.length > 0) {
    const cur = queue.shift() as number;
    const m = at(masks, cur), r = Math.floor(cur / n), c = cur % n;
    const tries: Array<[boolean, number, number]> = [
      [(m & N) !== 0 && r > 0, cur - n, S], [(m & E) !== 0 && c < n - 1, cur + 1, W],
      [(m & S) !== 0 && r < n - 1, cur + n, N], [(m & W) !== 0 && c > 0, cur - 1, E],
    ];
    for (const [ok, nb, need] of tries) {
      if (ok && !reach.has(nb) && (at(masks, nb) & need) !== 0) { reach.add(nb); queue.push(nb); }
    }
  }
  return reach;
}

const solvedBy = (spec: Pick<PipesSpec, 'n' | 'source' | 'sinks' | 'base'>, rots: readonly number[]): boolean => {
  const masks = spec.base.map((b, i) => rotate(b, at(rots, i)));
  const reach = connected(spec.n, masks, spec.source);
  return spec.sinks.every((s) => reach.has(s));
};

function generate(seed: number, d: Difficulty): PipesSpec {
  const rng = new Rng(deriveSeed(seed, 606));
  const n = Math.min(5, d + 2), size = n * n;
  const wrongMin = [0, 3, 5, 8, 11, 13][d] ?? 8;
  for (let tries = 0; tries < 200; tries++) {
    const source = rng.int(0, size - 1);
    const masks = spanningTree(rng, n, source);
    const leaves = masks.map((m, i) => i).filter((i) => i !== source && [N, E, S, W].includes(at(masks, i)));
    if (leaves.length < d + 1) continue;
    const sinks = rng.shuffle(leaves).slice(0, d + 1);
    const base = masks.map(canonical);
    const solution = masks.map((m, i) => rotFor(at(base, i), m));
    const rots = solution.map((s) => (s + rng.int(0, 3)) % 4);
    const spec = { n, source, sinks, base, rots, solution };
    const wrong = masks.filter((m, i) => rotate(at(base, i), at(rots, i)) !== m).length;
    if (wrong >= wrongMin && !solvedBy(spec, rots)) return spec;
  }
  throw new Error('pipes: could not generate');
}

export const pipesPuzzle: PuzzleDef<PipesSpec, number[]> = {
  tier: 1,
  unlockDay: 5,
  generate,
  check: (spec, answer) =>
    isIntArray(answer) && answer.length === spec.n * spec.n && answer.every((r) => r >= 0 && r <= 3) && solvedBy(spec, answer),
  solve: (spec) => spec.solution.slice(),
  hint(spec, progress = 0) {
    const wrong = spec.rots.map((r, i) => i).filter((i) => rotate(at(spec.base, i), at(spec.rots, i)) !== rotate(at(spec.base, i), at(spec.solution, i)));
    const c = at(wrong, Math.min(progress, wrong.length - 1));
    return `The pipe in row ${Math.floor(c / spec.n) + 1}, column ${(c % spec.n) + 1} needs turning.`;
  },
  parSeconds: (d) => [0, 25, 45, 80, 100, 125][d] ?? 80,
};
