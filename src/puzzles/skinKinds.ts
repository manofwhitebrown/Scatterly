import type { PuzzleKind } from '../shared/types';

/**
 * Puzzle kinds whose skin atlas (`public/atlas/puzzle-<kind>.json`) ships. Only these ask the loader for a group,
 * so an unskinned kind never makes a failing request. tests/puzzle-skin.test.ts keeps this list and the atlas files in sync.
 * Add a kind here in the same push that adds its atlas.
 */
export const SKINNED_KINDS: readonly PuzzleKind[] = ['untangle', 'lights', 'mastermind'];

export const isSkinned = (kind: PuzzleKind): boolean => SKINNED_KINDS.includes(kind);
