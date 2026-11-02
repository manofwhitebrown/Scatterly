import { type CodeSpec, codePuzzle } from './codeLock';
import { type TargetSpec, type TargetStep, targetPuzzle } from './target';
import { type SequenceSpec, sequencePuzzle } from './sequence';
import { type LightsSpec, lightsPuzzle } from './lights';
import { type SlideSpec, slidePuzzle } from './slide';
import { type PipesSpec, pipesPuzzle } from './pipes';
import { type MastermindSpec, mastermindPuzzle } from './mastermind';
import { type MemorySpec, memoryPuzzle } from './memory';
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
}
export type LogicPuzzleKind = keyof PuzzleTypes;

export const PUZZLES: { [K in LogicPuzzleKind]: PuzzleDef<PuzzleTypes[K]['spec'], PuzzleTypes[K]['answer']> } = {
  code: codePuzzle, target: targetPuzzle, sequence: sequencePuzzle, lights: lightsPuzzle,
  slide: slidePuzzle, pipes: pipesPuzzle, mastermind: mastermindPuzzle, memory: memoryPuzzle,
};
export { feedback } from './mastermind';
export type { Fact, PuzzleCtx, PuzzleDef } from './types';
