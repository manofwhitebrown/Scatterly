import { dailySeed } from '../logic';
import type { GameMode, RoomSceneData, SessionLength } from '../shared/types';

export const SHEET_MODES: ReadonlyArray<{ mode: GameMode; label: string }> = [
  { mode: 'relaxed', label: 'Relaxed' }, { mode: 'rush', label: 'Rush' }, { mode: 'daily', label: 'Daily' },
];
export const SHEET_LENGTHS: ReadonlyArray<{ length: SessionLength; label: string }> = [
  { length: 'short', label: 'Short' }, { length: 'standard', label: 'Standard' }, { length: 'long', label: 'Long' },
];

/** Run data for the chosen mode: Daily uses the shared daily seed, everything else a fresh random one. */
export function startData(mode: GameMode, rand: () => number = Math.random): RoomSceneData {
  return { mode, seed: mode === 'daily' ? dailySeed() : Math.floor(rand() * 2147483647) };
}
