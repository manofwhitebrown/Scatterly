import type { PuzzleKind } from '../shared/types';

/** Player-facing name of every puzzle kind (Puzzle Book, result screens). Pure data. */
export const PUZZLE_NAME: Record<PuzzleKind, string> = {
  untangle: 'Untangle', sort: 'Sort', word: 'Word', code: 'Code lock', target: 'Target', sequence: 'Sequence',
  lights: 'Lights out', slide: 'Slide', pipes: 'Pipes', mastermind: 'Mastermind', memory: 'Memory', sudoku: 'Sudoku',
  kenken: 'KenKen', balance: 'Balance', dial: 'Dial', tangram: 'Tangram', cipher: 'Cipher', logic: 'Logic grid', nonogram: 'Nonogram',
  mirror: 'Mirror', jigsaw: 'Jigsaw', flow: 'Flow', gears: 'Gears',
};
