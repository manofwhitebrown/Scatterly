import { describe, expect, it } from 'vitest';
import { defaultProfile } from '../../src/core/save';
import { generateScenario } from '../../src/logic/generator';
import { PUZZLES } from '../../src/logic/puzzles';
import { solveScenario } from '../../src/logic/solver';
import type { PuzzleKind } from '../../src/shared/types';

const ALL = Object.keys(PUZZLES) as PuzzleKind[];
const SECONDS_PER_SEARCH = 3; // an ideal, all-knowing player

describe('rush time limit vs an ideal player (all Tier-1 kinds enabled)', () => {
  for (const day of [2, 5, 10, 20]) {
    it(`day ${day}: ideal time is about half the limit and never more than 80%`, () => {
      const p = { ...defaultProfile(), day, unlockedRooms: ['entrance', 'living', 'kitchen', 'bedroom', 'bathroom'] as never };
      let sum = 0, max = 0;
      const N = 150;
      for (let seed = 1; seed <= N; seed++) {
        const s = generateScenario(seed, 'rush', p, { enabled: ALL });
        const r = solveScenario(s);
        const ratio = (r.searches * SECONDS_PER_SEARCH + r.seconds) / s.timeLimitSec;
        sum += ratio;
        max = Math.max(max, ratio);
      }
      expect(sum / N).toBeGreaterThan(0.3);
      expect(sum / N).toBeLessThan(0.6);
      expect(max).toBeLessThan(0.8);
    });
  }
});
