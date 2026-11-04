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
import { type DialSpec, dialPuzzle } from './dial';
import { type TangramSpec, tangramPuzzle } from './tangram';
import type { PuzzleDef } from './types';
import { withLadder } from './ladder';

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
  dial: { spec: DialSpec; answer: number[] };
  tangram: { spec: TangramSpec; answer: number[] };
}
export type LogicPuzzleKind = keyof PuzzleTypes;

const RAW: { [K in LogicPuzzleKind]: PuzzleDef<PuzzleTypes[K]['spec'], PuzzleTypes[K]['answer']> } = {
  code: codePuzzle, target: targetPuzzle, sequence: sequencePuzzle, lights: lightsPuzzle,
  slide: slidePuzzle, pipes: pipesPuzzle, mastermind: mastermindPuzzle, memory: memoryPuzzle,
  untangle: untanglePuzzle, sort: sortPuzzle, word: wordPuzzle, sudoku: sudokuPuzzle, kenken: kenkenPuzzle, balance: balancePuzzle, dial: dialPuzzle, tangram: tangramPuzzle,
};

/** Every kind served with the 3-rung hint ladder (see ladder.ts). */
export const PUZZLES: typeof RAW = {
  code: withLadder('code', RAW.code), target: withLadder('target', RAW.target), sequence: withLadder('sequence', RAW.sequence),
  lights: withLadder('lights', RAW.lights), slide: withLadder('slide', RAW.slide), pipes: withLadder('pipes', RAW.pipes),
  mastermind: withLadder('mastermind', RAW.mastermind), memory: withLadder('memory', RAW.memory), untangle: withLadder('untangle', RAW.untangle),
  sort: withLadder('sort', RAW.sort), word: withLadder('word', RAW.word), sudoku: withLadder('sudoku', RAW.sudoku),
  kenken: withLadder('kenken', RAW.kenken), balance: withLadder('balance', RAW.balance), dial: withLadder('dial', RAW.dial), tangram: withLadder('tangram', RAW.tangram),
};
export { ahaLine } from './ladder';
export type { HintStep } from './ladder';
export { feedback } from './mastermind';
export { crossings } from './untangle';
export { codeFeasible } from './codeLock';
export { tangramLevel, tangramPlaced } from './tangram';
export { dialLevel, dialSolutions } from './dial';
export { balanceLevel, balanceDetermined, SHAPES } from './balance';
export { kenkenLevel, kenkenSolutions } from './kenken';
export { sudokuLevel, countSolutions, LEVEL_PAR_SECONDS } from './sudoku';
export type { Pt } from './untangle';
export type { Fact, PuzzleCtx, PuzzleDef } from './types';
