import { describe, expect, it } from 'vitest';
import { PUZZLES, kenkenLevel, kenkenSolutions } from '../../src/logic/puzzles';

const SEEDS = Number(process.env.PUZZLE_SEEDS ?? 300);

describe('kenken levels 1-5', () => {
  it.each([1, 2, 3, 4, 5])('level %i: unique solution, cages cover the grid once, hints work', (level) => {
    const times: number[] = [];
    for (let seed = 1; seed <= SEEDS; seed++) {
      const t0 = performance.now();
      const spec = kenkenLevel(seed * 17 + level, level);
      times.push(performance.now() - t0);
      expect(kenkenSolutions(spec), `level ${level} seed ${seed}`).toBe(1);
      const cells = spec.cages.flatMap((c) => c.cells).sort((a, b) => a - b);
      expect(cells).toEqual(Array.from({ length: spec.n * spec.n }, (_, i) => i));
      expect(PUZZLES.kenken.check(spec, spec.solution)).toBe(true);
      for (const p of [0, 1, 2]) expect(PUZZLES.kenken.hint(spec, p).length).toBeGreaterThan(10);
      expect(PUZZLES.kenken.hint(spec, 2)).toMatch(/is [1-5]\./);
    }
    times.sort((a, b) => a - b);
    expect(times[Math.floor(times.length * 0.99)] as number).toBeLessThanOrEqual(10);
  });
  it('sizes grow with level and difficulty 1-3 map to levels 1-3', () => {
    expect([1, 2, 3, 4, 5].map((l) => kenkenLevel(9, l).n)).toEqual([3, 4, 4, 5, 5]);
    expect([1, 2, 3].map((d) => PUZZLES.kenken.generate(4, d as 1 | 2 | 3).level)).toEqual([1, 2, 3]);
  });
  it('rejects a Latin square that breaks a cage, and garbage input', () => {
    const s = kenkenLevel(5, 2);
    const n = s.n;
    const shifted = s.solution.map((_, i) => s.solution[(Math.floor(i / n) * n) + ((i % n) + 1) % n] as number);
    if (JSON.stringify(shifted) !== JSON.stringify(s.solution)) expect(PUZZLES.kenken.check(s, shifted)).toBe(false);
    expect(PUZZLES.kenken.check(s, null as unknown as number[])).toBe(false);
  });
});
