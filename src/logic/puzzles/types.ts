import type { Difficulty } from '../../shared/types';

/** A numeric fact carried by a clue (e.g. receipt total). Structurally identical to Clue.facts entries. */
export interface Fact { key: string; label: string; value: number }
/** Optional generation context: clue facts for code locks; payload/context come from Gate (custom word, riddle, theme). */
export interface PuzzleCtx { facts?: readonly Fact[]; payload?: string; context?: string }

export interface PuzzleDef<S, A> {
  tier: 1 | 2;
  unlockDay: number;
  generate(seed: number, difficulty: Difficulty, ctx?: PuzzleCtx): S;
  /** Authoritative: true only if the answer solves the puzzle. Never throws on garbage input. */
  check(spec: S, answer: A): boolean;
  /** Reference solution (used by tests and the e2e bot). */
  solve(spec: S): A;
  /** progress = number of hints already shown (0 = first). step: 0 nudge, 1 rule restated, 2 partial reveal; omitted = reveal. */
  hint(spec: S, progress?: number, step?: 0 | 1 | 2): string;
  parSeconds(difficulty: Difficulty): number;
}

export function at<T>(a: readonly T[], i: number): T {
  const v = a[i];
  if (v === undefined) throw new Error(`index ${i} out of range`);
  return v;
}

export function popcount(n: number): number {
  let c = 0;
  for (let v = n >>> 0; v; v &= v - 1) c++;
  return c;
}

export const isIntArray = (a: unknown): a is number[] =>
  Array.isArray(a) && a.every((v) => typeof v === 'number' && Number.isInteger(v));
