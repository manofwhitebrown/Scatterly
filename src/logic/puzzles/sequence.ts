import { Rng, deriveSeed } from '../rng';
import type { Difficulty } from '../../shared/types';
import { type PuzzleDef, at } from './types';

export type SeqFamily = 'arithmetic' | 'geometric' | 'alternating' | 'powers' | 'fibonacci' | 'secondOrder';
export interface SequenceSpec {
  family: SeqFamily;
  /** Shown terms; the missing one is null. */
  terms: Array<number | null>;
  missing: number;
  options: number[];
  expected: number;
  rule: string;
}

const FAMILIES: Record<Difficulty, readonly SeqFamily[]> = {
  1: ['arithmetic', 'arithmetic', 'geometric', 'powers'],
  2: ['arithmetic', 'geometric', 'alternating', 'powers', 'fibonacci'],
  3: ['geometric', 'alternating', 'powers', 'fibonacci', 'secondOrder'],
};

interface Built { all: number[]; rule: string; wrong: (missing: number) => number[] }

function make(family: SeqFamily, rng: Rng, len: number, d: Difficulty): Built {
  const t: number[] = [];
  switch (family) {
    case 'arithmetic': {
      const step = rng.int(2, d === 1 ? 6 : 13) * (rng.chance(0.25) ? -1 : 1);
      const start = step < 0 ? rng.int(60, 99) : rng.int(1, 20);
      for (let i = 0; i < len; i++) t.push(start + step * i);
      return { all: t, rule: `add ${step}`, wrong: (m) => [at(t, m) + (step > 0 ? 1 : -1), at(t, m) * 2 - (t[m - 1] ?? 0)] };
    }
    case 'geometric': {
      const r = d === 3 && rng.chance(0.5) ? 3 : 2;
      const start = rng.int(1, 4);
      for (let i = 0; i < len; i++) t.push(start * r ** i);
      return { all: t, rule: `multiply by ${r}`, wrong: (m) => [(t[m - 1] ?? 1) + (t[m - 1] ?? 1), at(t, m) + r] };
    }
    case 'alternating': {
      const a = rng.int(3, 9), b = rng.int(1, a - 1), start = rng.int(5, 20);
      t.push(start);
      for (let i = 1; i < len; i++) t.push(at(t, i - 1) + (i % 2 === 1 ? a : -b));
      return { all: t, rule: `add ${a}, then subtract ${b}, repeat`, wrong: (m) => [at(t, m) + (a - b), at(t, m) + (a + b)] };
    }
    case 'powers': {
      const cubes = d === 3 && rng.chance(0.5);
      const c = rng.int(0, 5), k = rng.int(1, 3);
      for (let i = 0; i < len; i++) t.push((k + i) ** (cubes ? 3 : 2) + c);
      return { all: t, rule: cubes ? 'cubes plus a constant' : 'squares plus a constant', wrong: (m) => [at(t, m) + 2, at(t, m) - 2] };
    }
    case 'fibonacci': {
      t.push(rng.int(1, 5), rng.int(2, 8));
      for (let i = 2; i < len; i++) t.push(at(t, i - 1) + at(t, i - 2));
      return { all: t, rule: 'each term is the sum of the two before', wrong: (m) => [at(t, m) + 1, at(t, m - 1) * 2] };
    }
    default: {
      const d0 = rng.int(1, 4), e = rng.int(1, 3), start = rng.int(1, 12);
      t.push(start);
      for (let i = 1; i < len; i++) t.push(at(t, i - 1) + d0 + e * (i - 1));
      return { all: t, rule: `the gaps grow by ${e} each time`, wrong: (m) => [at(t, m) + e, at(t, m) - e] };
    }
  }
}

function generate(seed: number, d: Difficulty): SequenceSpec {
  const rng = new Rng(deriveSeed(seed, 303));
  const family = rng.pick(FAMILIES[d]);
  const len = d === 1 ? 5 : 7;
  const built = make(family, rng, len, d);
  const missing = d === 1 ? len - 1 : rng.int(3, len - 2);
  const expected = at(built.all, missing);
  const set = new Set<number>([expected]);
  const options = [expected];
  const add = (v: number): void => { if (v > 0 && !set.has(v)) { set.add(v); options.push(v); } };
  built.wrong(missing).forEach(add);
  for (let k = 1; options.length < 4 && k < 20; k++) add(expected + (rng.chance(0.5) ? k : -k) * rng.int(1, 3));
  const terms = built.all.map((v, i) => (i === missing ? null : v));
  return { family, terms, missing, options: rng.shuffle(options.slice(0, 4)), expected, rule: built.rule };
}

export const sequencePuzzle: PuzzleDef<SequenceSpec, number> = {
  tier: 1,
  unlockDay: 2,
  generate,
  check: (spec, answer) => typeof answer === 'number' && answer === spec.expected,
  solve: (spec) => spec.expected,
  hint(spec, progress = 0) {
    if (progress <= 0) return `Look at how much each term changes: the pattern is "${spec.rule.split(' ')[0]}...".`;
    return `The rule: ${spec.rule}.`;
  },
  parSeconds: (d) => (d === 1 ? 12 : d === 2 ? 25 : 45),
};
