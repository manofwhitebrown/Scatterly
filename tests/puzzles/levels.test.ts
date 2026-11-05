import { describe, expect, it } from 'vitest';
import { PUZZLES } from '../../src/logic/puzzles';
import type { LogicPuzzleKind } from '../../src/logic/puzzles';
import type { PuzzleDifficulty } from '../../src/shared/types';

const KINDS: LogicPuzzleKind[] = ['code', 'target', 'sequence', 'lights', 'slide', 'pipes', 'mastermind', 'memory', 'untangle', 'sort', 'word'];
const LEVELS: PuzzleDifficulty[] = [1, 2, 3, 4, 5];
const ctx = { facts: [{ key: 'a', label: 'A', value: 12 }, { key: 'b', label: 'B', value: 5 }] };

describe('puzzle levels 1-5', () => {
  for (const k of KINDS) {
    it(`${k}: every level generates solvable puzzles`, () => {
      const def = PUZZLES[k];
      for (const lv of LEVELS) {
        for (let seed = 1; seed <= 40; seed++) {
          const spec = def.generate(seed, lv, ctx as never);
          expect(def.check(spec as never, def.solve(spec as never) as never), `${k} L${lv} seed ${seed}`).toBe(true);
        }
      }
    });
    it(`${k}: par time never shrinks as level rises`, () => {
      const pars = LEVELS.map((lv) => PUZZLES[k].parSeconds(lv));
      for (let i = 1; i < pars.length; i++) expect(pars[i], `${k} par`).toBeGreaterThanOrEqual(pars[i - 1] ?? 0);
    });
  }
});
