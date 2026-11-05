import { Rng, deriveSeed } from '../rng';
import type { PuzzleDifficulty as Difficulty } from '../../shared/types';
import { type PuzzleDef, at, isIntArray } from './types';

export const MM_SYMBOLS = 6;
export interface MastermindSpec { symbols: number; slots: number; maxAttempts: number; secret: number[]; repeats: boolean }
export interface Feedback { exact: number; misplaced: number }

export function feedback(secret: readonly number[], guess: readonly number[]): Feedback {
  let exact = 0;
  const sc = new Array<number>(MM_SYMBOLS).fill(0), gc = new Array<number>(MM_SYMBOLS).fill(0);
  for (let i = 0; i < secret.length; i++) {
    const s = at(secret, i), g = at(guess, i);
    if (s === g) exact++; else { sc[s] = at(sc, s) + 1; gc[g] = at(gc, g) + 1; }
  }
  let misplaced = 0;
  for (let k = 0; k < MM_SYMBOLS; k++) misplaced += Math.min(at(sc, k), at(gc, k));
  return { exact, misplaced };
}

function allCodes(slots: number, repeats: boolean): number[][] {
  const out: number[][] = [];
  const rec = (cur: number[]): void => {
    if (cur.length === slots) { out.push(cur.slice()); return; }
    for (let s = 0; s < MM_SYMBOLS; s++) {
      if (!repeats && cur.includes(s)) continue;
      cur.push(s); rec(cur); cur.pop();
    }
  };
  rec([]);
  return out;
}

const SETUP: Record<Difficulty, { slots: number; repeats: boolean; maxAttempts: number }> = {
  1: { slots: 3, repeats: false, maxAttempts: 8 },
  2: { slots: 4, repeats: false, maxAttempts: 9 },
  3: { slots: 4, repeats: true, maxAttempts: 9 },
  4: { slots: 4, repeats: true, maxAttempts: 8 },
  5: { slots: 4, repeats: true, maxAttempts: 7 },
};

/** Reference solver: always guess the first code consistent with all feedback so far. Returns the guesses it makes. */
export function crack(spec: MastermindSpec): number[][] {
  let cands = allCodes(spec.slots, spec.repeats);
  const guesses: number[][] = [];
  for (let i = 0; i < 20 && cands.length > 0; i++) {
    const g = at(cands, 0);
    guesses.push(g);
    const fb = feedback(spec.secret, g);
    if (fb.exact === spec.slots) break;
    cands = cands.filter((c) => { const f = feedback(c, g); return f.exact === fb.exact && f.misplaced === fb.misplaced; });
  }
  return guesses;
}

function generate(seed: number, d: Difficulty): MastermindSpec {
  const rng = new Rng(deriveSeed(seed, 707));
  const { slots, repeats, maxAttempts } = SETUP[d];
  let spec: MastermindSpec | null = null;
  // The reference solver must crack it inside the cap, so every shipped puzzle is provably winnable.
  for (let tries = 0; tries < 60; tries++) {
    const secret: number[] = [];
    while (secret.length < slots) {
      const s = rng.int(0, MM_SYMBOLS - 1);
      if (repeats || !secret.includes(s)) secret.push(s);
    }
    spec = { symbols: MM_SYMBOLS, slots, maxAttempts, secret, repeats };
    if (crack(spec).length <= maxAttempts) return spec;
  }
  if (!spec) throw new Error('mastermind: no secret');
  return { ...spec, maxAttempts: Math.max(maxAttempts, crack(spec).length) };
}

export const mastermindPuzzle: PuzzleDef<MastermindSpec, number[][]> = {
  tier: 1,
  unlockDay: 6,
  generate,
  /** Answer = the list of guesses made; the last must be the secret and the count within the cap. */
  check(spec, answer) {
    if (!Array.isArray(answer) || answer.length === 0 || answer.length > spec.maxAttempts) return false;
    if (!answer.every((g) => isIntArray(g) && g.length === spec.slots && g.every((v) => v >= 0 && v < spec.symbols))) return false;
    const last = at(answer, answer.length - 1);
    return last.every((v, i) => v === at(spec.secret, i));
  },
  solve: (spec) => crack(spec),
  hint(spec, progress = 0) {
    const i = Math.min(progress, spec.slots - 1);
    return `Slot ${i + 1} holds symbol ${at(spec.secret, i) + 1}.`;
  },
  parSeconds: (d) => [0, 25, 50, 80, 100, 120][d] ?? 80,
};
