import { Rng, deriveSeed } from '../rng';
import type { Difficulty } from '../../shared/types';
import { type Fact, type PuzzleCtx, type PuzzleDef, at } from './types';

export interface CodeSpec {
  difficulty: Difficulty;
  digits: number;
  /** Player-facing rule, e.g. "Code = receipt total + ticket seat". */
  rule: string;
  /** Facts the rule uses, in order. Their keys are what Gate.needs resolves to clue ids. */
  facts: Fact[];
  expected: string;
  /** true when no usable clue facts were supplied and the puzzle invented its own (shown on the lock). */
  own: boolean;
}

interface Cand { rule: string; value: string; used: Fact[] }

const ok = (s: string): boolean => /^[1-9]\d{2,3}$/.test(s);
const num = (n: number): string => String(n);

function pairs(facts: readonly Fact[], d: Difficulty): Cand[] {
  const out: Cand[] = [];
  for (const a of facts) for (const b of facts) {
    if (a.key === b.key) continue;
    if (d === 1) {
      out.push({ rule: `Code = ${a.label}, then ${b.label}, written side by side`, value: num(a.value) + num(b.value), used: [a, b] });
    } else {
      out.push({ rule: `Code = ${a.label} + ${b.label}`, value: num(a.value + b.value), used: [a, b] });
      if (a.value > b.value) out.push({ rule: `Code = ${a.label} - ${b.label}`, value: num(a.value - b.value), used: [a, b] });
    }
  }
  return out;
}

function triples(facts: readonly Fact[]): Cand[] {
  const out: Cand[] = [];
  for (const a of facts) for (const b of facts) for (const c of facts) {
    if (a.key === b.key || b.key === c.key || a.key === c.key) continue;
    out.push({ rule: `Code = ${a.label} x ${b.label} + ${c.label}`, value: num(a.value * b.value + c.value), used: [a, b, c] });
    if (a.value * b.value > c.value) {
      out.push({ rule: `Code = ${a.label} x ${b.label} - ${c.label}`, value: num(a.value * b.value - c.value), used: [a, b, c] });
    }
    if (a.value > b.value && b.value > c.value) {
      out.push({ rule: `Code = biggest, then middle, then smallest of ${a.label}, ${b.label}, ${c.label}`, value: num(a.value) + num(b.value) + num(c.value), used: [a, b, c] });
    }
  }
  return out;
}

const OWN_LABELS: ReadonlyArray<readonly [string, string]> = [
  ['own-receipt', 'receipt total'], ['own-seat', 'ticket seat'], ['own-tag', 'bag tag'],
  ['own-laundry', 'laundry count'], ['own-mugs', 'mug count'], ['own-clock', 'clock time'],
];

function ownFacts(rng: Rng, d: Difficulty): Fact[] {
  const n = d === 3 ? 3 : 2;
  const picks = rng.shuffle(OWN_LABELS).slice(0, n);
  const hi = d === 1 ? 99 : d === 2 ? 140 : 30;
  const lo = d === 1 ? 10 : d === 2 ? 55 : 3;
  return picks.map(([key, label]) => ({ key, label, value: rng.int(lo, hi) }));
}

function candidates(facts: readonly Fact[], d: Difficulty): Cand[] {
  const base = d === 3 ? triples(facts) : pairs(facts, d);
  return base.filter((c) => ok(c.value));
}

function generate(seed: number, difficulty: Difficulty, ctx?: PuzzleCtx): CodeSpec {
  const rng = new Rng(deriveSeed(seed, 101));
  const given = ctx?.facts ?? [];
  let cands = candidates(given, difficulty);
  let own = false;
  let pool: readonly Fact[] = given;
  for (let tries = 0; cands.length === 0 && tries < 50; tries++) {
    own = true;
    pool = ownFacts(rng, difficulty);
    cands = candidates(pool, difficulty);
  }
  if (cands.length === 0) throw new Error('code: no candidate');
  const pick = rng.pick(cands);
  void pool;
  return { difficulty, digits: pick.value.length, rule: pick.rule, facts: pick.used, expected: pick.value, own };
}

export const codePuzzle: PuzzleDef<CodeSpec, string> = {
  tier: 1,
  unlockDay: 1,
  generate,
  check: (spec, answer) => typeof answer === 'string' && answer.trim() === spec.expected,
  solve: (spec) => spec.expected,
  hint(spec, progress = 0) {
    if (progress <= 0) return `Find these clues: ${spec.facts.map((f) => f.label).join(', ')}.`;
    if (progress === 1) return `The code has ${spec.digits} digits.`;
    return `The first digit is ${at(spec.expected.split(''), 0)}.`;
  },
  parSeconds: (d) => (d === 1 ? 18 : d === 2 ? 35 : 65),
};
