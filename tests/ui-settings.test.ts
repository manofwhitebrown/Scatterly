import { describe, expect, it } from 'vitest';
import { defaultProfile } from '../src/core/save';
import { volumeTrim } from '../src/audio/engine';
import { COLUMNS, applyRow, nextInRing, nextVolume, rowLabel } from '../src/scenes/settingsModel';

describe('settings model', () => {
  const s0 = defaultProfile().settings;
  it('volume cycles 0 > 25 > 50 > 75 > 100 > 0 and snaps off-grid values up', () => {
    expect([0, 0.25, 0.5, 0.75, 1].map(nextVolume)).toEqual([0.25, 0.5, 0.75, 1, 0]);
    expect(nextVolume(0.3)).toBe(0.5);
  });
  it('rings wrap and unknown values start over', () => {
    expect(nextInRing(['a', 'b'] as const, 'b')).toBe('a');
    expect(nextInRing(['a', 'b'] as const, 'zzz' as 'a')).toBe('a');
  });
  it('every row changes exactly its own setting and has a label', () => {
    for (const row of COLUMNS.flat()) {
      const next = applyRow(s0, row);
      const changed = (Object.keys(s0) as (keyof typeof s0)[]).filter((k) => next[k] !== s0[k]);
      expect(changed.length).toBe(1);
      expect(rowLabel(next, row).length).toBeGreaterThan(0);
    }
  });
  it('quality and case length cycle through all values', () => {
    const q = COLUMNS.flat().find((r) => r.kind === 'quality')!;
    let s = s0;
    const seen = new Set([s.quality]);
    for (let i = 0; i < 3; i++) { s = applyRow(s, q); seen.add(s.quality); }
    expect(seen.size).toBe(3);
    expect(s.quality).toBe(s0.quality);
  });
  it('volume trim clamps junk', () => {
    expect(volumeTrim(NaN)).toBe(1);
    expect(volumeTrim(-1)).toBe(0);
    expect(volumeTrim(2)).toBe(1);
    expect(volumeTrim(0.5)).toBeCloseTo(0.25);
  });
});
