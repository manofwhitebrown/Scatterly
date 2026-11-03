import { Rng, deriveSeed } from '../rng';
import type { Difficulty } from '../../shared/types';
import { type PuzzleDef, at, isIntArray } from './types';

/**
 * Tangram. A rectangle was cut into pieces; put them back. Pieces may be turned in quarter turns but never flipped.
 * Answer = [x, y, turns] per piece, in piece order: where the piece's top-left lands and how many clockwise quarter
 * turns it was given. AHA: the awkward pieces decide first. A long straight piece or a piece with a notch can only
 * sit in a few places, corners and edges fix the rest, and the last gap tells you which piece is left.
 * Solvable by construction (the rectangle was cut into the pieces). `check` is geometric (in bounds, no overlap,
 * so the area is covered exactly), so ANY valid tiling is accepted, not just the reference one.
 *
 * Levels (difficulty 1-3 = levels 1-3):
 *   1: 3x3, 3 pieces, shown upright     2: 4x3, 4 pieces, shown upright
 *   3: 4x4, 5 pieces, turned            4: 5x4, 6 pieces, turned
 *   5: 5x5, 7 pieces, turned, all pieces 2 to 5 cells
 */
export interface TangramSpec {
  w: number; h: number; level: number;
  pieces: number[][];       // per piece: flat [x0, y0, x1, y1, ...] cells as DISPLAYED (normalised to top-left 0,0)
  solution: number[];       // [x, y, turns] per piece
}

const LEVELS: Record<number, { w: number; h: number; k: number; turned: boolean; maxSize: number }> = {
  1: { w: 3, h: 3, k: 3, turned: false, maxSize: 4 }, 2: { w: 4, h: 3, k: 4, turned: false, maxSize: 5 },
  3: { w: 4, h: 4, k: 5, turned: true, maxSize: 5 }, 4: { w: 5, h: 4, k: 6, turned: true, maxSize: 5 },
  5: { w: 5, h: 5, k: 7, turned: true, maxSize: 5 },
};

type Cell = readonly [number, number];

/** Turn clockwise `turns` quarter turns, then move so the top-left of the bounding box is (0,0). */
function turn(cells: readonly Cell[], turns: number): Array<[number, number]> {
  let cur: Array<[number, number]> = cells.map(([x, y]) => [x, y]);
  for (let t = 0; t < ((turns % 4) + 4) % 4; t++) cur = cur.map(([x, y]) => [-y, x]);
  const mx = Math.min(...cur.map((c) => c[0])), my = Math.min(...cur.map((c) => c[1]));
  return cur.map(([x, y]) => [x - mx, y - my]);
}

const toCells = (flat: readonly number[]): Cell[] => {
  const out: Cell[] = [];
  for (let i = 0; i + 1 < flat.length; i += 2) out.push([at(flat, i), at(flat, i + 1)]);
  return out;
};

/** Random region growth from k seeds; every region is connected by construction. */
function cut(w: number, h: number, k: number, maxSize: number, rng: Rng): number[][] | null {
  const owner = new Array<number>(w * h).fill(-1);
  const regions: number[][] = [];
  for (const s of rng.shuffle(Array.from({ length: w * h }, (_, i) => i)).slice(0, k)) { owner[s] = regions.length; regions.push([s]); }
  let left = w * h - k;
  while (left > 0) {
    const opts: Array<[number, number]> = [];
    const growable = regions.map((cells) => cells.length);
    const floor = Math.min(...growable);
    regions.forEach((cells, r) => {
      if (cells.length > Math.min(maxSize - 1, floor + 1)) return; // balanced growth keeps pieces near equal size
      for (const c of cells) {
        const x = c % w, y = Math.floor(c / w);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
          const nx = x + dx, ny = y + dy;
          if (nx >= 0 && nx < w && ny >= 0 && ny < h && owner[ny * w + nx] === -1) opts.push([r, ny * w + nx]);
        }
      }
    });
    if (opts.length === 0) {
      // the smallest regions are boxed in: let any region below the size cap grow instead
      regions.forEach((cells, r) => {
        if (cells.length >= maxSize) return;
        for (const c of cells) {
          const x = c % w, y = Math.floor(c / w);
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && nx < w && ny >= 0 && ny < h && owner[ny * w + nx] === -1) opts.push([r, ny * w + nx]);
          }
        }
      });
      if (opts.length === 0) return null;
    }
    const [r, cell] = rng.pick(opts);
    owner[cell] = r;
    at(regions, r).push(cell);
    left--;
  }
  return regions;
}

function generateLevel(seed: number, level: number): TangramSpec {
  const lv = Math.max(1, Math.min(5, level));
  const { w, h, k, turned, maxSize } = LEVELS[lv] as (typeof LEVELS)[number];
  const rng = new Rng(deriveSeed(seed, 9191 + lv));
  for (let attempt = 0; attempt < 400; attempt++) {
    const regions = cut(w, h, k, maxSize, rng);
    if (!regions || regions.some((r) => r.length < 2 || r.length > maxSize)) continue;
    const pieces: number[][] = [];
    const solution: number[] = [];
    for (const r of regions) {
      const cells: Cell[] = r.map((c) => [c % w, Math.floor(c / w)]);
      const mx = Math.min(...cells.map((c) => c[0])), my = Math.min(...cells.map((c) => c[1]));
      const solved = turn(cells, 0);
      const shown = rng.int(0, turned ? 3 : 0);
      pieces.push(turn(solved, shown).flat());
      solution.push(mx, my, (4 - shown) % 4);
    }
    // A puzzle where nothing is turned and pieces already show their place is too trivial from level 3 up.
    if (turned && solution.every((v, i) => i % 3 !== 2 || v === 0)) continue;
    return { w, h, level: lv, pieces, solution };
  }
  throw new Error('tangram: generation failed');
}

function valid(spec: TangramSpec, a: readonly number[]): boolean {
  if (a.length !== spec.pieces.length * 3) return false;
  const seen = new Set<number>();
  for (let i = 0; i < spec.pieces.length; i++) {
    const x = at(a, i * 3), y = at(a, i * 3 + 1), t = at(a, i * 3 + 2);
    if (t < 0 || t > 3) return false;
    for (const [cx, cy] of turn(toCells(at(spec.pieces, i)), t)) {
      const px = cx + x, py = cy + y;
      if (px < 0 || py < 0 || px >= spec.w || py >= spec.h || seen.has(py * spec.w + px)) return false;
      seen.add(py * spec.w + px);
    }
  }
  return seen.size === spec.w * spec.h;
}

function hint(spec: TangramSpec, progress = 0): string {
  if (progress <= 0) return 'Start with the awkward pieces: a long straight piece or one with a notch fits in very few places.';
  if (progress === 1) return 'Pieces can be turned a quarter turn at a time but never flipped. Every square of the rectangle must be covered exactly once.';
  const i = Math.min(progress - 2, spec.pieces.length - 1);
  const t = at(spec.solution, i * 3 + 2);
  return `Piece ${i + 1} goes with its top-left at column ${at(spec.solution, i * 3) + 1}, row ${at(spec.solution, i * 3 + 1) + 1}${t ? `, turned ${t} quarter turn${t > 1 ? 's' : ''} clockwise` : ''}.`;
}

export const tangramPuzzle: PuzzleDef<TangramSpec, number[]> = {
  tier: 2,
  unlockDay: 8,
  generate: (seed, d: Difficulty) => generateLevel(seed, d),
  check: (spec, answer) => isIntArray(answer) && valid(spec, answer),
  solve: (spec) => spec.solution.slice(),
  hint,
  parSeconds: (d) => (d === 1 ? 35 : d === 2 ? 60 : 90),
};

export const tangramLevel = generateLevel;
/** Cells of piece `i` when placed as [x, y, turns] (for scenes and tests). */
export const tangramPlaced = (spec: TangramSpec, i: number, x: number, y: number, turns: number): Array<[number, number]> =>
  turn(toCells(at(spec.pieces, i)), turns).map(([cx, cy]) => [cx + x, cy + y]);
