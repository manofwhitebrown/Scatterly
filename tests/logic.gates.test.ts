import { describe, expect, it } from 'vitest';
import { anySpot } from '../src/content/decor';
import { ENABLED } from '../src/content/puzzleRoster';
import { generateScenario, guidedScenario } from '../src/logic/generator';
import { gateBudget } from '../src/logic/gateBudget';
import { PUZZLES, type LogicPuzzleKind } from '../src/logic/puzzles';
import { solveScenario } from '../src/logic/solver';
import { validateScenario } from '../src/logic/validator';
import { defaultProfile } from '../src/core/save';
import type { Fact } from '../src/logic/puzzles';
import type { PlayerProfile, PuzzleKind, Scenario } from '../src/shared/types';

const ALL = Object.keys(PUZZLES) as PuzzleKind[];
const profileAt = (day: number): PlayerProfile => ({
  ...defaultProfile(), day, unlockedRooms: ['entrance', 'living', 'kitchen', 'bedroom', 'bathroom'],
});
const gen = (seed: number, day: number, enabled: readonly PuzzleKind[] = ALL): Scenario =>
  generateScenario(seed, 'relaxed', profileAt(day), { enabled });
const N = 120;

describe('gate budget', () => {
  it('follows the day schedule', () => {
    expect([1, 2, 3, 4, 9, 10, 40].map((d) => gateBudget(d))).toEqual([1, 2, 2, 3, 3, 4, 4]);
    expect(gateBudget(20, true)).toBe(6);
  });
});

describe('v3 gates (all Tier-1 kinds enabled)', () => {
  it('density per day stays within budget and is not trivially empty', () => {
    for (const [day, lo, hi] of [[2, 1.2, 2], [5, 1.8, 3], [12, 2.3, 6]] as const) {
      let total = 0;
      for (let seed = 1; seed <= N; seed++) {
        const s = gen(seed, day);
        const n = Object.keys(s.gates).length;
        expect(n).toBeLessThanOrEqual(day === 12 ? 6 : gateBudget(day));
        total += n;
      }
      const mean = total / N;
      expect(mean, `mean gates on day ${day}`).toBeGreaterThanOrEqual(lo);
      expect(mean).toBeLessThanOrEqual(hi);
    }
  });

  it('only lockable containers, only enabled kinds unlocked by that day, valid and solvable', () => {
    for (const day of [2, 5, 12]) for (let seed = 1; seed <= N; seed++) {
      const s = gen(seed, day);
      expect(validateScenario(s, profileAt(day)), `${s.id} day ${day}`).toEqual([]);
      expect(solveScenario(s).ok).toBe(true);
      for (const [id, g] of Object.entries(s.gates)) {
        expect(anySpot(id)?.lockable, id).toBe(true);
        expect(ALL).toContain(g.kind);
        expect(PUZZLES[g.kind as LogicPuzzleKind].unlockDay).toBeLessThanOrEqual(day);
      }
    }
  });

  it('at most one difficulty-3 gate, never before day 8', () => {
    let seen3 = 0;
    for (const day of [2, 7, 8, 12, 20]) for (let seed = 1; seed <= N; seed++) {
      const d3 = Object.values(gen(seed, day).gates).filter((g) => g.difficulty === 3).length;
      expect(d3).toBeLessThanOrEqual(1);
      if (day < 8) expect(d3).toBe(0); else seen3 += d3;
    }
    expect(seen3).toBeGreaterThan(0);
  });

  it('about half of the gates are decoys (spots holding no target and no clue)', () => {
    let decoys = 0, total = 0;
    for (let seed = 1; seed <= N; seed++) {
      const s = gen(seed, 12);
      const holders = new Set<string>([...Object.values(s.placement).filter((x): x is string => !!x), ...s.clues.map((c) => c.spotId)]);
      for (const id of Object.keys(s.gates)) { total++; if (!holders.has(id)) decoys++; }
    }
    expect(decoys / total).toBeGreaterThan(0.25);
    expect(decoys / total).toBeLessThan(0.75);
  });

  it('variety: a morning rarely repeats a kind', () => {
    let dup = 0, mornings = 0;
    for (let seed = 1; seed <= N; seed++) {
      const kinds = Object.values(gen(seed, 12).gates).map((g) => g.kind);
      if (kinds.length < 3) continue;
      mornings++;
      if (new Set(kinds).size < kinds.length) dup++;
    }
    expect(mornings).toBeGreaterThan(20);
    expect(dup / mornings).toBeLessThan(0.35);
  });

  it('every kind shows up eventually', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 400; seed++) for (const g of Object.values(gen(seed, 30).gates)) seen.add(g.kind);
    for (const k of ALL) if (k !== 'untangle' || true) expect([...seen], `kind ${k} never gated`).toContain(k);
  });

  it('code locks name fact clues that sit in the open and can always produce a code', () => {
    let codes = 0;
    for (let seed = 1; seed <= 500; seed++) {
      const s = gen(seed, 12);
      for (const [id, g] of Object.entries(s.gates)) {
        if (g.kind !== 'code') continue;
        codes++;
        expect(g.needs?.length).toBeGreaterThan(0);
        const facts: Fact[] = [];
        for (const cid of g.needs ?? []) {
          const c = s.clues.find((x) => x.id === cid);
          expect(c?.facts?.length, `${cid} carries facts`).toBeGreaterThan(0);
          expect(s.gates[c?.spotId ?? ''], 'need clue behind a gate').toBeUndefined();
          expect(c?.spotId).not.toBe(id);
          facts.push(...(c?.facts ?? []));
        }
        for (const rtSeed of [1, 2, 3, 4, 5]) {
          const spec = PUZZLES.code.generate(rtSeed, g.difficulty, { facts });
          expect(spec.own, 'ran out of facts at launch').toBe(false);
          expect(PUZZLES.code.check(spec, PUZZLES.code.solve(spec))).toBe(true);
        }
      }
    }
    expect(codes).toBeGreaterThan(15);
  });

  it('the solver pays puzzle time for gates it opens', () => {
    let withSeconds = 0;
    for (let seed = 1; seed <= 60; seed++) if (solveScenario(gen(seed, 12)).seconds > 0) withSeconds++;
    expect(withSeconds).toBeGreaterThan(10);
  });

  it('is deterministic', () => {
    for (let seed = 1; seed <= 20; seed++) expect(JSON.stringify(gen(seed, 9))).toBe(JSON.stringify(gen(seed, 9)));
  });
});

describe('real roster and day 1', () => {
  it('the default roster is used when no override is given and gates only use it', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const s = generateScenario(seed, 'relaxed', { ...profileAt(9) });
      for (const g of Object.values(s.gates)) expect(ENABLED).toContain(g.kind);
    }
  });
  it('day 1 is the guided morning: 2 targets, one easy gate on a lockable container, valid and solvable', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const s = guidedScenario(seed, 'relaxed');
      expect(validateScenario(s, defaultProfile())).toEqual([]);
      expect(solveScenario(s).ok).toBe(true);
      expect(s.targets.length).toBe(2);
      const [id, g] = Object.entries(s.gates)[0] ?? [];
      expect(Object.keys(s.gates).length).toBe(1);
      expect(anySpot(id ?? '')?.lockable).toBe(true);
      expect(g?.difficulty).toBe(1);
    }
  });
});
