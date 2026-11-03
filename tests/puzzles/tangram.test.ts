import { describe, expect, it } from 'vitest';
import { PUZZLES, tangramLevel, tangramPlaced } from '../../src/logic/puzzles';

const SEEDS = Number(process.env.PUZZLE_SEEDS ?? 300);

describe('tangram levels 1-5', () => {
  it.each([1, 2, 3, 4, 5])('level %i: pieces partition the rectangle, are connected, reference solution valid', (level) => {
    const times: number[] = [];
    for (let seed = 1; seed <= SEEDS; seed++) {
      const t0 = performance.now();
      const spec = tangramLevel(seed * 19 + level, level);
      times.push(performance.now() - t0);
      const k = spec.pieces.length;
      const covered = new Set<number>();
      for (let i = 0; i < k; i++) {
        const cells = tangramPlaced(spec, i, spec.solution[i * 3] as number, spec.solution[i * 3 + 1] as number, spec.solution[i * 3 + 2] as number);
        expect(cells.length).toBeGreaterThanOrEqual(2);
        const keys = new Set(cells.map(([x, y]) => `${x},${y}`));
        const stack = [cells[0] as [number, number]]; const seen = new Set([`${stack[0]![0]},${stack[0]![1]}`]);
        while (stack.length) {
          const [x, y] = stack.pop() as [number, number];
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const key = `${x + dx},${y + dy}`; if (keys.has(key) && !seen.has(key)) { seen.add(key); stack.push([x + dx, y + dy]); } }
        }
        expect(seen.size, `piece ${i} connected`).toBe(cells.length);
        for (const [x, y] of cells) { expect(covered.has(y * spec.w + x)).toBe(false); covered.add(y * spec.w + x); }
      }
      expect(covered.size).toBe(spec.w * spec.h);
      expect(PUZZLES.tangram.check(spec, spec.solution)).toBe(true);
      for (const p of [0, 1, 2]) expect(PUZZLES.tangram.hint(spec, p).length).toBeGreaterThan(10);
      expect(PUZZLES.tangram.hint(spec, 2)).toMatch(/Piece 1 goes with its top-left/);
    }
    times.sort((a, b) => a - b);
    expect(times[Math.floor(times.length * 0.99)] as number).toBeLessThanOrEqual(10);
  });

  it('independent solver: check accepts every tiling it finds and rejects near-misses', () => {
    for (const level of [1, 2, 3]) for (let seed = 1; seed <= 30; seed++) {
      const spec = tangramLevel(seed, level);
      const k = spec.pieces.length;
      const used = new Array<boolean>(spec.w * spec.h).fill(false);
      const found: number[][] = [];
      const place = (i: number, acc: number[]): void => {
        if (found.length >= 3) return;
        if (i === k) { found.push(acc); return; }
        for (let t = 0; t < 4; t++) for (let y = 0; y < spec.h; y++) for (let x = 0; x < spec.w; x++) {
          const cells = tangramPlaced(spec, i, x, y, t);
          if (cells.some(([cx, cy]) => cx >= spec.w || cy >= spec.h || used[cy * spec.w + cx])) continue;
          cells.forEach(([cx, cy]) => { used[cy * spec.w + cx] = true; });
          place(i + 1, [...acc, x, y, t]);
          cells.forEach(([cx, cy]) => { used[cy * spec.w + cx] = false; });
        }
      };
      place(0, []);
      expect(found.length).toBeGreaterThanOrEqual(1);
      for (const f of found) expect(PUZZLES.tangram.check(spec, f), `L${level} seed ${seed}`).toBe(true);
      const bad = spec.solution.slice(); bad[0] = (bad[0] as number) + 1;
      expect(PUZZLES.tangram.check(spec, bad)).toBe(false);
    }
  });

  it('turning is required from level 3 and sizes grow; difficulty 1-3 = levels 1-3', () => {
    for (let s = 1; s <= 100; s++) for (const l of [1, 2]) expect(tangramLevel(s, l).solution.every((v, i) => i % 3 !== 2 || v === 0)).toBe(true);
    for (let s = 1; s <= 100; s++) for (const l of [3, 4, 5]) expect(tangramLevel(s, l).solution.some((v, i) => i % 3 === 2 && v !== 0)).toBe(true);
    expect([1, 2, 3, 4, 5].map((l) => tangramLevel(2, l).pieces.length)).toEqual([3, 4, 5, 6, 7]);
    expect([1, 2, 3].map((d) => PUZZLES.tangram.generate(6, d as 1 | 2 | 3).level)).toEqual([1, 2, 3]);
  });
});
