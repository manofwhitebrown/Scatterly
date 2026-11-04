import { describe, expect, it } from 'vitest';
import { PUZZLES, ahaLine } from '../../src/logic/puzzles';
import type { LogicPuzzleKind } from '../../src/logic/puzzles';

const KINDS = Object.keys(PUZZLES) as LogicPuzzleKind[];

describe('hint ladder', () => {
  it('every kind has a distinct nudge, rule and aha line', () => {
    for (const k of KINDS) {
      const spec = PUZZLES[k].generate(7, 2, { facts: [{ key: 'a', label: 'A', value: 12 }, { key: 'b', label: 'B', value: 5 }] });
      const [n, r, x] = [0, 1, 2].map((st) => PUZZLES[k].hint(spec as never, 0, st as 0 | 1 | 2));
      expect(n.length, k).toBeGreaterThan(10);
      expect(r.length, k).toBeGreaterThan(10);
      expect(x.length, k).toBeGreaterThan(5);
      expect(new Set([n, r, x]).size, `${k} rungs differ`).toBe(3);
      expect(ahaLine(k).length, `${k} aha`).toBeGreaterThan(10);
    }
  });
  it('without step the old reveal behaviour is kept', () => {
    const spec = PUZZLES.lights.generate(3, 1);
    expect(PUZZLES.lights.hint(spec, 0)).toBe(PUZZLES.lights.hint(spec, 0, 2));
  });
  it('rungs 0 and 1 never give the answer away', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const spec = PUZZLES.code.generate(seed, 2, { facts: [{ key: 'a', label: 'A', value: 12 }, { key: 'b', label: 'B', value: 5 }] });
      for (const st of [0, 1] as const) expect(PUZZLES.code.hint(spec, 0, st)).not.toContain(spec.expected);
    }
  });
});
