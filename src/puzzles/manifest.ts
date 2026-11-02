import type { PuzzleKind } from '../shared/types';

/**
 * Puzzle kinds that have a working scene. Plain data (no Phaser import) so logic tests can read it.
 * AI-2's ENABLED roster must be a subset of this list. Add a kind here only when its scene ships.
 */
export const IMPLEMENTED: PuzzleKind[] = ['untangle', 'sort', 'word', 'code', 'target', 'sequence', 'lights', 'slide', 'pipes', 'mastermind'];
