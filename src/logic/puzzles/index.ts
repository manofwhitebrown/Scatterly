import { type CodeSpec, codePuzzle } from './codeLock';
import { type TargetSpec, type TargetStep, targetPuzzle } from './target';
import { type SequenceSpec, sequencePuzzle } from './sequence';
import { type LightsSpec, lightsPuzzle } from './lights';
import { type SlideSpec, slidePuzzle } from './slide';
import { type PipesSpec, pipesPuzzle } from './pipes';
import { type MastermindSpec, mastermindPuzzle } from './mastermind';
import { type MemorySpec, memoryPuzzle } from './memory';
import { type UntangleSpec, type Pt, untanglePuzzle } from './untangle';
import { type SortSpec, sortPuzzle } from './sort';
import { type WordSpec, wordPuzzle } from './word';
import { type SudokuSpec, sudokuPuzzle } from './sudoku';
import { type KenKenSpec, kenkenPuzzle } from './kenken';
import { type BalanceSpec, balancePuzzle } from './balance';
import type { PuzzleDef } from './types';

/** kind -> { spec, answer } for the generators implemented in the logic layer. */
export interface PuzzleTypes {
  code: { spec: CodeSpec; answer: string };
  target: { spec: TargetSpec; answer: TargetStep[] };
  sequence: { spec: SequenceSpec; answer: number };
  lights: { spec: LightsSpec; answer: number[] };
  slide: { spec: SlideSpec; answer: number[] };
  pipes: { spec: PipesSpec; answer: number[] };
  mastermind: { spec: MastermindSpec; answer: number[][] };
  memory: { spec: MemorySpec; answer: number[] };
  untangle: { spec: UntangleSpec; answer: Pt[] };
  sort: { spec: SortSpec; answer: number[] };
  word: { spec: WordSpec; answer: string };
  sudoku: { spec: SudokuSpec; answer: number[] };
  kenken: { spec: KenKenSpec; answer: number[] };
  balance: { spec: BalanceSpec; answer: number[] };
}
export type LogicPuzzleKind = keyof PuzzleTypes;

export const PUZZLES: { [K in LogicPuzzleKind]: PuzzleDef<PuzzleTypes[K]['spec'], PuzzleTypes[K]['answer']> } = {
  code: codePuzzle, target: targetPuzzle, sequence: sequencePuzzle, lights: lightsPuzzle,
  slide: slidePuzzle, pipes: pipesPuzzle, mastermind: mastermindPuzzle, memory: memoryPuzzle,
  untangle: untanglePuzzle, sort: sortPuzzle, word: wordPuzzle, sudoku: sudokuPuzzle, kenken: kenkenPuzzle, balance: balancePuzzle,
};
export { feedback } from './mastermind';
export { crossings } from './untangle';
export { codeFeasible } from './codeLock';
export { balanceLevel, balanceDetermined, SHAPES } from './balance';
export { kenkenLevel, kenkenSolutions } from './kenken';
export { sudokuLevel, countSolutions, LEVEL_PAR_SECONDS } from './sudoku';
export type { Pt } from './untangle';
export type { Fact, PuzzleCtx, PuzzleDef } from './types';
