import { describe, expect, it } from 'vitest';
import { PUZZLES, dialLevel, dialSolutions } from '../../src/logic/puzzles';

const SEEDS = Number(process.env.PUZZLE_SEEDS ?? 300);

describe('dial levels 1-5', () => {
  it.each([1, 2, 3, 4, 5])('level %i: solves, hints work, fast', (level) => {
    const times: number[] = [];
    for (let seed = 1; seed <= SEEDS; seed++) {
      const t0 = performance.now();
      const spec = dialLevel(seed * 11 + level, level);
      times.push(performance.now() - t0);
      expect(PUZZLES.dial.check(spec, spec.solution)).toBe(true);
      expect(PUZZLES.dial.check(spec, spec.solution.map((v) => v + spec.m))).toBe(true); // full extra turns are harmless
      expect(spec.start.some((v) => v !== 0)).toBe(true);
      for (const p of [0, 1, 2]) expect(PUZZLES.dial.hint(spec, p).length).toBeGreaterThan(10);
      expect(PUZZLES.dial.hint(spec, 2)).toMatch(/Button 1 needs \d+/);
    }
    times.sort((a, b) => a - b);
    expect(times[Math.floor(times.length * 0.99)] as number).toBeLessThanOrEqual(10);
  });
  it('independent brute force: exactly one press vector in 0..m-1 solves each puzzle', () => {
    for (const level of [1, 2, 3, 4, 5]) for (let seed = 1; seed <= (level === 5 ? 15 : 40); seed++) {
      expect(dialSolutions(dialLevel(seed, level)), `L${level} seed ${seed}`).toBe(1);
    }
  });
  it('size grows with level; difficulty 1-3 = levels 1-3; backwards turns only from level 4', () => {
    expect([1, 2, 3, 4, 5].map((l) => dialLevel(2, l).buttons.length)).toEqual([3, 3, 4, 4, 5]);
    expect([1, 2, 3].map((d) => PUZZLES.dial.generate(6, d as 1 | 2 | 3).level)).toEqual([1, 2, 3]);
    for (let s = 1; s <= 100; s++) for (const l of [1, 2, 3]) {
      const sp = dialLevel(s, l);
      expect(sp.buttons.flat().every((v) => v === 0 || v === 1)).toBe(true);
    }
  });
});
