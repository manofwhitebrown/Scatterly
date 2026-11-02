import { Rng, deriveSeed } from '../rng';
import type { Difficulty } from '../../shared/types';
import { type PuzzleDef, at, isIntArray } from './types';

export type SortMode = 'colour' | 'shape' | 'type' | 'combo';
export interface SortPiece { label: string; colour: number; shape: number; cat: number; bin: number }
export interface SortSpec { mode: SortMode; rule: string; bins: string[]; pieces: SortPiece[] }

const COLOURS = ['Red', 'Blue', 'Yellow'];
const SHAPES = ['Button', 'Card', 'Flag'];
const CATS = [
  { n: 'Kitchen', items: ['Spoon', 'Cork', 'Whisk', 'Tongs'] },
  { n: 'Stationery', items: ['Pen', 'Ruler', 'Eraser', 'Stapler'] },
  { n: 'Tools', items: ['Nail', 'Screw', 'Tape', 'Pliers'] },
];

function generate(seed: number, d: Difficulty): SortSpec {
  const rng = new Rng(deriveSeed(seed, 1010));
  const pieces: SortPiece[] = [];
  const add = (colour: number, shape: number, cat: number, label: string, bin: number): void => { pieces.push({ label, colour, shape, cat, bin }); };
  const cl = (c: number, s: number): string => `${at(COLOURS, c)} ${at(SHAPES, s).toLowerCase()}`;
  const mode: SortMode = d === 1 ? 'colour' : d === 2 ? (rng.chance(0.5) ? 'shape' : 'type') : 'combo';
  let rule: string;
  let bins: string[];
  if (mode === 'colour') {
    const cs = rng.shuffle([0, 1, 2]).slice(0, 2);
    rule = 'Sort by colour';
    bins = cs.map((c) => at(COLOURS, c));
    cs.forEach((c, k) => { for (let i = 0; i < 3; i++) { const s = rng.int(0, 2); add(c, s, 0, cl(c, s), k); } });
  } else if (mode === 'shape') {
    rule = 'Sort by shape';
    bins = SHAPES.map((s) => `${s}s`);
    for (let s = 0; s < 3; s++) for (let i = 0; i < 3; i++) { const c = rng.int(0, 2); add(c, s, 0, cl(c, s), s); }
  } else if (mode === 'type') {
    rule = 'Sort by type of thing';
    bins = CATS.map((c) => c.n);
    CATS.forEach((c, k) => rng.shuffle(c.items).slice(0, 3).forEach((name) => add(0, 0, k, name, k)));
  } else {
    rule = 'Follow the rule on each bin (top rule first)';
    bins = ['1. Red, any shape', '2. Round, not red', '3. Everything else'];
    for (let i = 0; i < 4; i++) { const s = rng.int(0, 2); add(0, s, 0, cl(0, s), 0); }
    for (let i = 0; i < 4; i++) { const c = rng.int(1, 2); add(c, 0, 0, cl(c, 0), 1); }
    for (let i = 0; i < 4; i++) { const c = rng.int(1, 2); const s = rng.int(1, 2); add(c, s, 0, cl(c, s), 2); }
  }
  return { mode, rule, bins, pieces: rng.shuffle(pieces) };
}

export const sortPuzzle: PuzzleDef<SortSpec, number[]> = {
  tier: 1,
  unlockDay: 1,
  generate,
  /** Answer = bin index for every piece, in spec order. */
  check: (spec, answer) => isIntArray(answer) && answer.length === spec.pieces.length && spec.pieces.every((p, i) => p.bin === answer[i]),
  solve: (spec) => spec.pieces.map((p) => p.bin),
  hint(spec, progress = 0) {
    const i = Math.min(progress, spec.pieces.length - 1);
    const p = at(spec.pieces, i);
    return `"${p.label}" goes in "${at(spec.bins, p.bin)}".`;
  },
  parSeconds: (d) => (d === 1 ? 14 : d === 2 ? 25 : 50),
};
