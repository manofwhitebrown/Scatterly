import { ENABLED } from '../content/puzzleRoster';
import { PUZZLE_KINDS } from '../shared/types';
import type { PuzzleKind, PuzzleStat } from '../shared/types';

export const PUZZLE_NAME: Record<PuzzleKind, string> = {
  untangle: 'Untangle', sort: 'Sort', word: 'Word', code: 'Code lock', target: 'Target', sequence: 'Sequence',
  lights: 'Lights out', slide: 'Slide', pipes: 'Pipes', mastermind: 'Mastermind', memory: 'Memory', sudoku: 'Sudoku',
  kenken: 'KenKen', balance: 'Balance', dial: 'Dial', tangram: 'Tangram', cipher: 'Cipher', logic: 'Logic grid', nonogram: 'Nonogram',
  mirror: 'Mirror', jigsaw: 'Jigsaw', flow: 'Flow', gears: 'Gears',
};

export interface BookEntry {
  kind: PuzzleKind;
  name: string;
  unlocked: boolean;
  solved: number;
  skipped: number;
  bestMs: number | null;
  /** Whole percent of attempts that were skipped, or null before any attempt. */
  skipPct: number | null;
}

/** One card per puzzle kind: unlocked when the generator may use it or the player already played it. */
export function bookEntries(stats: Readonly<Record<string, PuzzleStat>>, enabled: readonly PuzzleKind[] = ENABLED): BookEntry[] {
  return PUZZLE_KINDS.map((kind) => {
    const s = stats[kind];
    const solved = s?.solved ?? 0;
    const skipped = s?.skipped ?? 0;
    const tries = solved + skipped;
    return {
      kind,
      name: PUZZLE_NAME[kind],
      unlocked: enabled.includes(kind) || tries > 0,
      solved,
      skipped,
      bestMs: s?.bestMs ?? null,
      skipPct: tries > 0 ? Math.round((skipped / tries) * 100) : null,
    };
  });
}
