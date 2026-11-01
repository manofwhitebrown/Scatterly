import type { SpotId } from '../shared/types';

/** Player's own notes on unsearched spots. Mirrors the shared contract's SpotMark. */
export type SpotMark = 'ruledOut' | 'hunch';

export type MarkMap = ReadonlyMap<SpotId, SpotMark>;

/** Next mark in the tap cycle: none -> ruledOut -> hunch -> none. */
export function nextMark(current: SpotMark | undefined): SpotMark | null {
  if (current === undefined) return 'ruledOut';
  if (current === 'ruledOut') return 'hunch';
  return null;
}
