import { Rng, deriveSeed } from '../rng';
import { CIPHER_NOTES, WORDS } from '../../content/puzzleWords';
import type { PuzzleDifficulty as Difficulty } from '../../shared/types';
import { type PuzzleCtx, type PuzzleDef, at } from './types';

export type WordMode = 'unscramble' | 'decoy' | 'cipher';
export interface WordSpec {
  mode: WordMode;
  word: string;
  /** true when the word came from a Gate payload: only that exact word is accepted. */
  custom: boolean;
  hint: string;
  /** Letter tiles shown (unscramble/decoy). Empty for cipher. */
  tiles: string[];
  /** cipher: the shifted note and the shift used. */
  coded: string;
  shift: number;
}

const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const sorted = (w: string): string => w.split('').sort().join('');
export function caesar(s: string, shift: number): string {
  let out = '';
  for (const ch of s) { const i = ALPHA.indexOf(ch); out += i < 0 ? ch : at(ALPHA.split(''), (i + shift) % 26); }
  return out;
}

function generate(seed: number, d: Difficulty, ctx?: PuzzleCtx): WordSpec {
  const rng = new Rng(deriveSeed(seed, 1111));
  const payload = (ctx?.payload ?? '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 12);
  const custom = payload.length >= 2;
  const [lo, hi] = d === 1 ? [4, 5] : d === 2 ? [6, 7] : d === 3 ? [4, 6] : d === 4 ? [6, 8] : [7, 9];
  const word = custom ? payload : rng.pick(WORDS.filter((w) => w.length >= lo && w.length <= hi));
  const mode: WordMode = d === 3 ? 'cipher' : d === 2 ? 'decoy' : 'unscramble';
  const defaultHint = mode === 'cipher' ? 'Each letter was shifted. The last word is your answer.' : mode === 'decoy' ? 'Find the word. One tile is a decoy.' : 'Unscramble the word.';
  const hint = ctx?.context && ctx.context.trim() ? ctx.context.trim() : defaultHint;
  let tiles: string[] = [];
  let coded = '';
  let shift = 0;
  if (mode === 'cipher') {
    shift = rng.int(2, 9);
    coded = caesar(`${rng.pick(CIPHER_NOTES)} ${word}`, shift);
  } else {
    tiles = word.split('');
    if (mode === 'decoy') tiles.push(rng.pick(ALPHA.split('').filter((c) => !word.includes(c))));
    for (let k = 0; k < 20; k++) {
      tiles = rng.shuffle(tiles);
      if (tiles.length < 2 || tiles.join('') !== word || new Set(tiles).size < 2) break;
    }
  }
  return { mode, word, custom, hint, tiles, coded, shift };
}

export const wordPuzzle: PuzzleDef<WordSpec, string> = {
  tier: 1,
  unlockDay: 1,
  generate,
  check(spec, answer) {
    if (typeof answer !== 'string') return false;
    const g = answer.trim().toUpperCase();
    if (g === spec.word) return true;
    return !spec.custom && WORDS.includes(g) && sorted(g) === sorted(spec.word);
  },
  solve: (spec) => spec.word,
  hint(spec, progress = 0) {
    const n = Math.min(progress + 1, spec.word.length - 1);
    return `The word starts with "${spec.word.slice(0, n)}" and has ${spec.word.length} letters.`;
  },
  parSeconds: (d) => [0, 12, 25, 50, 65, 85][d] ?? 50,
};
