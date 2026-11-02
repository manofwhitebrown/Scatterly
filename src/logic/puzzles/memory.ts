import { Rng, deriveSeed } from '../rng';
import type { Difficulty } from '../../shared/types';
import { type PuzzleDef, isIntArray } from './types';

/** Simon-style: the scene replays a growing prefix of `sequence`; the full answer is the whole sequence. */
export interface MemorySpec { pads: number; sequence: number[] }

const SETUP: Record<Difficulty, { pads: number; length: number }> = { 1: { pads: 4, length: 3 }, 2: { pads: 6, length: 5 }, 3: { pads: 9, length: 7 } };

function generate(seed: number, d: Difficulty): MemorySpec {
  const rng = new Rng(deriveSeed(seed, 808));
  const { pads, length } = SETUP[d];
  const sequence: number[] = [];
  while (sequence.length < length) {
    const p = rng.int(0, pads - 1);
    if (sequence[sequence.length - 1] !== p) sequence.push(p);
  }
  return { pads, sequence };
}

export const memoryPuzzle: PuzzleDef<MemorySpec, number[]> = {
  tier: 1,
  unlockDay: 7,
  generate,
  check: (spec, answer) => isIntArray(answer) && answer.length === spec.sequence.length && answer.every((v, i) => v === spec.sequence[i]),
  solve: (spec) => spec.sequence.slice(),
  hint(spec, progress = 0) {
    const n = Math.min(progress + 2, spec.sequence.length);
    return `The first ${n} pads were: ${spec.sequence.slice(0, n).map((v) => v + 1).join(', ')}.`;
  },
  parSeconds: (d) => (d === 1 ? 12 : d === 2 ? 25 : 45),
};
