import { describe, expect, it } from 'vitest';
import { defaultProfile } from '../src/core/save';
import { anySpot } from '../src/content/decor';
import { caseSpec } from '../src/logic/caseSpec';
import { generateCase, generateScenario, hasFinale, roomsTouched } from '../src/logic/generator';
import { CHAIN_STAGES } from '../src/logic/gates';
import { solveScenario } from '../src/logic/solver';
import { validateScenario } from '../src/logic/validator';
import { LEGACY_ROOMS } from '../src/shared/types';
import type { PlayerProfile, Scenario, SessionLength } from '../src/shared/types';

const profile = (day: number, length: SessionLength = 'standard'): PlayerProfile => ({
  ...defaultProfile(), day, unlockedRooms: [...LEGACY_ROOMS, 'study'],
  settings: { ...defaultProfile().settings, sessionLength: length },
});
const seeds = (n: number): number[] => Array.from({ length: n }, (_, i) => i + 1);
const holders = (s: Scenario): Set<string> =>
  new Set([...Object.values(s.placement), ...s.clues.map((c) => c.spotId)].filter((x): x is string => !!x));

describe('case builder: standard case from day 5', () => {
  const p = profile(5);
  const spec = caseSpec(5, 'standard', 'relaxed');
  const cases = seeds(120).map((n) => generateCase(n, 'relaxed', p));

  it('every case validates against the case limits and is solvable', () => {
    for (const s of cases) {
      expect(validateScenario(s, p, { maxGates: spec.gatesMax, maxChained: spec.chainsMax }), s.id).toEqual([]);
      expect(solveScenario(s).ok, s.id).toBe(true);
    }
  });
  it('has 4-5 targets spread over at least four rooms', () => {
    for (const s of cases) {
      expect(s.targets.length).toBeGreaterThanOrEqual(4);
      expect(s.targets.length).toBeLessThanOrEqual(5);
      expect(roomsTouched(s), s.id).toBeGreaterThanOrEqual(4);
    }
  });
  it('has 8-12 padlocked containers, only on lockable spots', () => {
    for (const s of cases) {
      const n = Object.keys(s.gates).length;
      expect(n, s.id).toBeGreaterThanOrEqual(8);
      expect(n, s.id).toBeLessThanOrEqual(12);
      for (const id of Object.keys(s.gates)) expect(anySpot(id)?.lockable, id).toBe(true);
    }
  });
  it('a real share of the padlocks are decoys that hold nothing the case needs', () => {
    let decoys = 0, total = 0;
    for (const s of cases) {
      const h = holders(s);
      for (const id of Object.keys(s.gates)) { total++; if (!h.has(id)) decoys++; }
    }
    // Only about 5-7 lockable spots can hold a target or clue, so with 8-12 locks decoys are the majority.
    expect(decoys / total).toBeGreaterThan(0.4);
    expect(decoys / total).toBeLessThan(0.85);
  });
  it('has 2-3 compound gates whose second stage is a payload-free puzzle kind', () => {
    for (const s of cases) {
      const chained = Object.values(s.gates).filter((g) => g.chain);
      expect(chained.length, s.id).toBeGreaterThanOrEqual(2);
      expect(chained.length, s.id).toBeLessThanOrEqual(3);
      for (const g of chained) for (const k of g.chain ?? []) {
        expect(CHAIN_STAGES).toContain(k);
        expect(k).not.toBe(g.kind);
      }
    }
  });
  it('has a finale: a code lock that needs facts from different clues, then a second stage', () => {
    const withFinale = cases.filter(hasFinale).length;
    expect(withFinale / cases.length).toBeGreaterThanOrEqual(0.97);
    for (const s of cases.filter(hasFinale)) {
      const g = Object.values(s.gates).find((x) => x.kind === 'code' && x.chain) as NonNullable<Scenario['gates'][string]>;
      expect(new Set(g.needs).size).toBe(g.needs?.length);
    }
  });
  it('level-3 gates stay out until day 8, and there is at most one', () => {
    for (const s of cases) expect(Object.values(s.gates).filter((g) => g.difficulty === 3)).toHaveLength(0);
    const late = profile(12);
    for (const n of seeds(40)) {
      const s = generateCase(n, 'relaxed', late);
      expect(Object.values(s.gates).filter((g) => g.difficulty === 3).length).toBeLessThanOrEqual(1);
      expect(validateScenario(s, late, { maxGates: 12, maxChained: 3 }), s.id).toEqual([]);
    }
  });
  it('is deterministic per seed', () => {
    for (const n of [1, 7, 42]) expect(generateCase(n, 'relaxed', p)).toEqual(generateCase(n, 'relaxed', p));
  });
});

describe('case builder: ramp, length and the modes it must not touch', () => {
  it('session length scales the counts (short < standard <= long) from day 5', () => {
    const avg = (len: SessionLength): number => {
      const ns = seeds(40).map((n) => Object.keys(generateCase(n, 'relaxed', profile(5, len)).gates).length);
      return ns.reduce((a, b) => a + b, 0) / ns.length;
    };
    expect(avg('short')).toBeLessThan(avg('standard'));
    expect(avg('standard')).toBeLessThanOrEqual(avg('long'));
  });
  it('days 3 and 4 ramp up: more locks on day 4 than day 3, finale from day 4', () => {
    const run = (day: number): Scenario[] => seeds(40).map((n) => generateCase(n, 'relaxed', profile(day)));
    const [d3, d4] = [run(3), run(4)];
    const mean = (xs: Scenario[]): number => xs.reduce((a, s) => a + Object.keys(s.gates).length, 0) / xs.length;
    expect(mean(d4)).toBeGreaterThan(mean(d3));
    expect(d3.filter(hasFinale)).toHaveLength(0);
    expect(d4.filter(hasFinale).length / d4.length).toBeGreaterThan(0.9);
  });
  it('days 1-2, Rush and the Daily are exactly the classic generator', () => {
    for (const n of seeds(15)) {
      for (const day of [1, 2]) expect(generateCase(n, 'relaxed', profile(day, 'long'))).toEqual(generateScenario(n, 'relaxed', profile(day, 'long')));
      expect(generateCase(n, 'rush', profile(8, 'long'))).toEqual(generateScenario(n, 'rush', profile(8, 'long')));
      expect(generateCase(n, 'daily', profile(8, 'long'))).toEqual(generateScenario(n, 'daily', profile(8, 'long')));
    }
  });
  it('the study is used once it is unlocked', () => {
    const used = seeds(80).filter((n) => Object.values(generateCase(n, 'relaxed', profile(6)).placement).some((id) => id?.startsWith('study.')));
    expect(used.length).toBeGreaterThan(5);
  });
});
