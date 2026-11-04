import { describe, expect, it } from 'vitest';
import { PUZZLES, countSolutions, sudokuLevel } from '../../src/logic/puzzles';

const SEEDS = Number(process.env.PUZZLE_SEEDS ?? 300);

describe('sudoku levels 1-5', () => {
  it.each([1, 2, 3, 4, 5])('level %i: exactly one solution, givens consistent, hint ladder works', (level) => {
    const times: number[] = [];
    for (let seed = 1; seed <= SEEDS; seed++) {
      const t0 = performance.now();
      const spec = sudokuLevel(seed * 31 + level, level);
      times.push(performance.now() - t0);
      expect(countSolutions(spec), `level ${level} seed ${seed}`).toBe(1);
      expect(PUZZLES.sudoku.check(spec, spec.solution)).toBe(true);
      spec.givens.forEach((v, i) => { if (v) expect(v).toBe(spec.solution[i]); });
      for (const p of [0, 1, 2]) expect(PUZZLES.sudoku.hint(spec, p).length).toBeGreaterThan(10);
      expect(PUZZLES.sudoku.hint(spec, 2)).toMatch(/is [1-6]\./);
    }
    times.sort((a, b) => a - b);
    expect(times[Math.floor(times.length * 0.99)] as number).toBeLessThanOrEqual(40);
  });
  it('levels get harder: fewer givens; 4x4 for d1-2, 6x6 for d3', () => {
    const g = (l: number) => sudokuLevel(7, l).givens.filter(Boolean).length;
    expect(g(1)).toBeGreaterThan(g(2));
    expect(g(3)).toBeGreaterThan(g(4));
    expect(g(4)).toBeGreaterThanOrEqual(g(5));
    expect([1, 2, 3].map((d) => PUZZLES.sudoku.generate(5, d as 1 | 2 | 3).n)).toEqual([4, 4, 6]);
  });
  it('rejects rule-breaking grids that match the givens', () => {
    const s = sudokuLevel(3, 3);
    const bad = s.solution.slice();
    [bad[0], bad[1]] = [bad[1] as number, bad[0] as number];
    if (!s.givens[0] && !s.givens[1]) expect(PUZZLES.sudoku.check(s, bad)).toBe(false);
    expect(PUZZLES.sudoku.check(s, 'x' as unknown as number[])).toBe(false);
  });
});
