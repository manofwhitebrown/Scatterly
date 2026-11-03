import { describe, expect, it } from 'vitest';
import { defaultProfile } from '../src/core/save';
import { ACHIEVEMENTS, earnedAchievements } from '../src/logic/achievements';
import { applyRun } from '../src/logic/progression';
import type { PlayerProfile, RunResult } from '../src/shared/types';

const run = (over: Partial<RunResult> = {}): RunResult => ({
  scenarioId: 's1', mode: 'relaxed', targets: ['keys', 'phone'], found: ['keys', 'phone'], timeMs: 40000, searches: 5, hintsUsed: 0,
  timedOut: false, stars: 3, coinsEarned: 50, habitHits: [], newAchievements: [], puzzleLog: [], ...over,
});

describe('applyRun: stats, puzzle mastery, week board, achievements', () => {
  it('folds the puzzle log into per-kind stats; skipped never counts as solved', () => {
    const p = defaultProfile();
    const a = applyRun(p, run({ puzzleLog: [
      { kind: 'code', solved: true, skipped: false, ms: 9000 },
      { kind: 'code', solved: true, skipped: false, ms: 7000 },
      { kind: 'lights', solved: false, skipped: true, ms: 3000 },
      { kind: 'sort', solved: true, skipped: true, ms: 100 },
    ] }), '2026-11-02');
    expect(a.puzzles.code).toEqual({ solved: 2, skipped: 0, bestMs: 7000, seen: false });
    expect(a.puzzles.lights).toEqual({ solved: 0, skipped: 1, bestMs: null, seen: false });
    expect(a.puzzles.sort).toEqual({ solved: 0, skipped: 1, bestMs: null, seen: false });
    expect(a.stats.puzzlesSolved).toBe(2);
    expect(applyRun(a, run({ puzzleLog: [{ kind: 'code', solved: true, skipped: false, ms: 12000 }] })).puzzles.code?.bestMs).toBe(7000);
  });

  it('updates lifetime stats and the week board without mutating the input', () => {
    const p = defaultProfile();
    const frozen = JSON.stringify(p);
    const a = applyRun(p, run({ hintsUsed: 1, stars: 2, found: ['keys'] }));
    expect(JSON.stringify(p)).toBe(frozen);
    expect(a.stats).toMatchObject({ mornings: 1, perfect: 0, itemsFound: 1, hintsUsed: 1, fastestMs: 40000 });
    expect(a.weekMorning).toBe(1);
    expect(a.weekStars).toBe(2);
    const b = applyRun(a, run({ timeMs: 30000 }));
    expect(b.stats).toMatchObject({ mornings: 2, perfect: 1, fastestMs: 30000 });
    let q: PlayerProfile = b;
    for (let i = 0; i < 4; i++) q = applyRun(q, run());
    expect(q.weekMorning).toBe(6);
    const wrap = applyRun(q, run({ stars: 1 }));
    expect(wrap.weekMorning).toBe(1);
    expect(wrap.weekStars).toBe(1);
  });

  it('a failed run does not set fastestMs', () => {
    expect(applyRun(defaultProfile(), run({ stars: 0, timedOut: true, found: [] })).stats.fastestMs).toBeNull();
  });

  it('awards each achievement once and only when earned', () => {
    const p = defaultProfile();
    const a = applyRun(p, run({ puzzleLog: [{ kind: 'untangle', solved: true, skipped: false, ms: 1000 }], habitHits: ['keys'] }));
    expect(a.achievements).toEqual(expect.arrayContaining(['first-morning', 'sharp-eye', 'first-puzzle', 'habit-keeper', 'quick-fingers']));
    expect(a.achievements).not.toContain('ten-mornings');
    const b = applyRun(a, run());
    expect(b.achievements.filter((x) => x === 'first-morning').length).toBe(1);
    expect(earnedAchievements(a, b, run())).not.toContain('first-morning');
    expect(new Set(b.achievements).size).toBe(b.achievements.length);
  });

  it('achievement ids are unique and stable-looking', () => {
    const ids = ACHIEVEMENTS.map((x) => x.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const a of ACHIEVEMENTS) { expect(a.id).toMatch(/^[a-z0-9-]+$/); expect(a.name.length).toBeGreaterThan(2); expect(a.desc.length).toBeGreaterThan(5); }
  });

  it('collecting every basic kind earns Collector', () => {
    const kinds = ['untangle', 'sort', 'word', 'code', 'target', 'sequence', 'lights', 'slide', 'pipes', 'mastermind', 'memory'] as const;
    let p = defaultProfile();
    for (const k of kinds) p = applyRun(p, run({ puzzleLog: [{ kind: k, solved: true, skipped: false, ms: 5000 }] }));
    expect(p.achievements).toContain('kinds-all');
    expect(p.achievements).toContain('kinds-3');
  });
});
