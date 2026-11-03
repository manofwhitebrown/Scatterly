import { describe, expect, it } from 'vitest';
import { PUZZLES, balanceDetermined, balanceLevel } from '../../src/logic/puzzles';

const SEEDS = Number(process.env.PUZZLE_SEEDS ?? 300);
const dot = (c: number[], w: number[]) => c.reduce((a, v, i) => a + v * (w[i] as number), 0);

describe('balance levels 1-5', () => {
  it.each([1, 2, 3, 4, 5])('level %i: scales determine every ratio, answers are integers, hints work', (level) => {
    const times: number[] = [];
    for (let seed = 1; seed <= SEEDS; seed++) {
      const t0 = performance.now();
      const spec = balanceLevel(seed * 13 + level, level);
      times.push(performance.now() - t0);
      expect(balanceDetermined(spec), `level ${level} seed ${seed}`).toBe(true);
      expect(spec.expected.every((v) => Number.isInteger(v) && v >= 1 && v <= 12)).toBe(true);
      expect(PUZZLES.balance.check(spec, spec.expected)).toBe(true);
      for (const s of spec.scales) {
        expect(s.left.some((v, i) => v > 0 && (s.right[i] as number) > 0)).toBe(false); // no shape on both pans
      }
      for (const p of [0, 1, 2]) expect(PUZZLES.balance.hint(spec, p).length).toBeGreaterThan(10);
      expect(PUZZLES.balance.hint(spec, 2)).toMatch(/balances with \d+\./);
    }
    times.sort((a, b) => a - b);
    expect(times[Math.floor(times.length * 0.99)] as number).toBeLessThanOrEqual(10);
  });
  it('independent brute force: every weight set that balances all scales gives the same answers (levels 1-3)', () => {
    for (const level of [1, 2, 3]) for (let seed = 1; seed <= 25; seed++) {
      const spec = balanceLevel(seed, level);
      const ws = [spec.weights];
      const walk = (cur: number[]): void => {
        if (cur.length === spec.shapes) { if (spec.scales.every((s) => dot(s.left, cur) === dot(s.right, cur))) ws.push(cur); return; }
        for (let w = 1; w <= 14; w++) walk([...cur, w]);
      };
      walk([]);
      for (const w of ws) spec.queries.forEach((q, i) => {
        expect(dot(q.pan, w) / (w[q.target] as number), `L${level} seed ${seed}`).toBe(spec.expected[i]);
      });
    }
  });
  it('shapes and questions grow with level; difficulty 1-3 = levels 1-3', () => {
    expect([1, 2, 3, 4, 5].map((l) => balanceLevel(3, l).shapes)).toEqual([3, 3, 4, 4, 5]);
    expect([1, 2, 3, 4, 5].map((l) => balanceLevel(3, l).queries.length)).toEqual([1, 1, 2, 2, 3]);
    expect([1, 2, 3].map((d) => PUZZLES.balance.generate(8, d as 1 | 2 | 3).level)).toEqual([1, 2, 3]);
  });
});
