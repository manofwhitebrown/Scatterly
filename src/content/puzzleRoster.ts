import type { PuzzleKind } from '../shared/types';

/**
 * Kinds the scenario generator may use. A kind may be listed only when its generator (src/logic/puzzles) AND its scene
 * (src/puzzles/manifest IMPLEMENTED) both exist; tests/puzzles/roster.test.ts enforces this.
 */
export const ENABLED: PuzzleKind[] = ['untangle', 'sort', 'word', 'code', 'target', 'sequence', 'lights', 'slide', 'pipes', 'mastermind', 'memory'];
