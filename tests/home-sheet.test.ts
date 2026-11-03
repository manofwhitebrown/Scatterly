import { describe, expect, it } from 'vitest';
import { dailySeed } from '../src/logic';
import { SHEET_LENGTHS, SHEET_MODES, startData } from '../src/scenes/homeSheet';

describe('home play sheet', () => {
  it('offers Relaxed first (default), Rush, Daily', () => {
    expect(SHEET_MODES.map((m) => m.mode)).toEqual(['relaxed', 'rush', 'daily']);
    expect(SHEET_LENGTHS.map((l) => l.length)).toEqual(['short', 'standard', 'long']);
  });
  it('daily uses the daily seed, others use the random source', () => {
    expect(startData('daily')).toEqual({ mode: 'daily', seed: dailySeed() });
    expect(startData('rush', () => 0.5).seed).toBe(Math.floor(0.5 * 2147483647));
    expect(startData('relaxed', () => 0).mode).toBe('relaxed');
  });
});
