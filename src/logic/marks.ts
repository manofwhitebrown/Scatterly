import type { SpotId, SpotMark } from '../shared/types';

export type { SpotMark };

export type MarkMap = ReadonlyMap<SpotId, SpotMark>;

/** Next mark in the tap cycle: none -> ruledOut -> hunch -> none. */
export function nextMark(current: SpotMark | undefined): SpotMark | null {
  if (current === undefined) return 'ruledOut';
  if (current === 'ruledOut') return 'hunch';
  return null;
}
