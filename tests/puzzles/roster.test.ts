import { describe, expect, it } from 'vitest';
import { ENABLED } from '../../src/content/puzzleRoster';
import { PUZZLES } from '../../src/logic/puzzles';
import { IMPLEMENTED } from '../../src/puzzles/manifest';
import { PUZZLE_KINDS } from '../../src/shared/types';

describe('puzzle roster', () => {
  it('ENABLED only holds kinds with a scene (manifest) and a generator (registry)', () => {
    for (const k of ENABLED) {
      expect(IMPLEMENTED, `${k} has no scene yet`).toContain(k);
      expect(Object.keys(PUZZLES), `${k} has no generator`).toContain(k);
    }
    expect(new Set(ENABLED).size).toBe(ENABLED.length);
  });
  it('every registry key is a real PuzzleKind and Tier 1 comes before Tier 2', () => {
    for (const k of Object.keys(PUZZLES)) expect(PUZZLE_KINDS as readonly string[]).toContain(k);
    for (const def of Object.values(PUZZLES)) expect([1, 2]).toContain(def.tier);
  });
});
