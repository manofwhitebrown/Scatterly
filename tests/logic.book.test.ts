import { describe, expect, it } from 'vitest';
import { defaultProfile } from '../src/core/save';
import { ENABLED } from '../src/content/puzzleRoster';
import { ACHIEVEMENTS } from '../src/logic/achievements';
import { achievements, puzzleBook, resultSummary } from '../src/logic/book';
import { fallbackScenario, generateCase } from '../src/logic/generator';
import { PUZZLES } from '../src/logic/puzzles';
import { replayDuration, replayScript } from '../src/logic/replay';
import { GameSession } from '../src/logic/session';
import { LEGACY_ROOMS, PUZZLE_KINDS } from '../src/shared/types';
import type { GameMode, ItemId, PlayerProfile } from '../src/shared/types';

const profile = (day = 5): PlayerProfile => ({ ...defaultProfile(), day, unlockedRooms: [...LEGACY_ROOMS, 'study'] });

describe('puzzleBook(profile)', () => {
  it('lists every kind in order; a new player has the enabled kinds unlocked and nothing seen', () => {
    const book = puzzleBook(profile());
    expect(book.map((e) => e.kind)).toEqual([...PUZZLE_KINDS]);
    for (const e of book) {
      expect(e.unlocked, e.kind).toBe(ENABLED.includes(e.kind));
      expect(e).toMatchObject({ seen: false, solved: 0, skipped: 0, bestMs: null, skipPct: null, beatPar: false });
      expect(e.name.length).toBeGreaterThan(2);
    }
  });
  it('par comes from the generator (level 2) and is null for kinds without one', () => {
    for (const e of puzzleBook(profile())) {
      if (e.kind in PUZZLES) expect(e.parMs, e.kind).toBe(PUZZLES[e.kind as keyof typeof PUZZLES].parSeconds(2) * 1000);
      else expect(e.parMs, e.kind).toBeNull();
    }
  });
  it('reports solved, skipped, best time, skip percent and beating par from the saved stats', () => {
    const p = profile();
    const par = PUZZLES.lights.parSeconds(2) * 1000;
    p.puzzles.lights = { solved: 3, skipped: 1, bestMs: par - 1, seen: true };
    p.puzzles.pipes = { solved: 1, skipped: 0, bestMs: par * 10, seen: true };
    p.puzzles.kenken = { solved: 0, skipped: 2, bestMs: null, seen: true };
    const by = Object.fromEntries(puzzleBook(p).map((e) => [e.kind, e]));
    expect(by.lights).toMatchObject({ solved: 3, skipped: 1, skipPct: 25, seen: true, beatPar: true });
    expect(by.pipes?.beatPar).toBe(false);
    expect(by.kenken).toMatchObject({ unlocked: true, skipPct: 100, bestMs: null, beatPar: false });
  });
  it('does not change the profile', () => {
    const p = profile();
    p.puzzles.lights = { solved: 1, skipped: 0, bestMs: 5000, seen: true };
    const before = JSON.stringify(p);
    puzzleBook(p);
    expect(JSON.stringify(p)).toBe(before);
  });
});

describe('achievements(profile)', () => {
  it('lists every achievement once, in order, with a name and a description', () => {
    const list = achievements(profile());
    expect(list.map((a) => a.id)).toEqual(ACHIEVEMENTS.map((a) => a.id));
    expect(new Set(list.map((a) => a.id)).size).toBe(list.length);
    for (const a of list) { expect(a.name.length).toBeGreaterThan(2); expect(a.desc.length).toBeGreaterThan(5); }
  });
  it('a new player has 0 of m everywhere and nothing earned', () => {
    for (const a of achievements(profile())) expect(a, a.id).toMatchObject({ earned: false, n: 0 });
  });
  it('shows counter progress and caps it below m until earned', () => {
    const p = profile();
    p.stats = { ...p.stats, mornings: 4, itemsFound: 20, puzzlesSolved: 10 };
    const by = Object.fromEntries(achievements(p).map((a) => [a.id, a]));
    expect(by['ten-mornings']).toMatchObject({ n: 4, m: 10, earned: false });
    expect(by['finder-50']).toMatchObject({ n: 20, m: 50 });
    expect(by['puzzles-25']).toMatchObject({ n: 10, m: 25 });
    p.stats = { ...p.stats, mornings: 99 };
    expect(achievements(p).find((a) => a.id === 'ten-mornings')).toMatchObject({ n: 10, m: 10, earned: false });
  });
  it('an earned achievement shows m of m, including the run-based ones', () => {
    const p = profile();
    p.achievements = ['sharp-eye', 'ten-mornings'];
    const by = Object.fromEntries(achievements(p).map((a) => [a.id, a]));
    expect(by['sharp-eye']).toMatchObject({ earned: true, n: 1, m: 1 });
    expect(by['ten-mornings']).toMatchObject({ earned: true, n: 10, m: 10 });
  });
  it('kinds-all counts the basic kinds the player solved', () => {
    const p = profile();
    p.puzzles.lights = { solved: 1, skipped: 0, bestMs: 1, seen: true };
    const a = achievements(p).find((x) => x.id === 'kinds-all');
    expect(a?.n).toBe(1);
    expect(a?.m).toBeGreaterThan(1);
  });
  it('odd saved numbers never give NaN, negatives or n > m', () => {
    const p = profile();
    p.stats = { mornings: -5, perfect: Number.NaN, itemsFound: 1e9, hintsUsed: 0, puzzlesSolved: 2.7, bestStreak: 0, fastestMs: null };
    p.streak = -1;
    for (const a of achievements(p)) {
      expect(Number.isFinite(a.n), a.id).toBe(true);
      expect(a.n, a.id).toBeGreaterThanOrEqual(0);
      expect(a.n, a.id).toBeLessThanOrEqual(a.m);
    }
  });
});

/** Opens everything on the way to the targets (solving gates), takes what it finds. */
function solveAll(s: GameSession): void {
  const ids = [...new Set([...Object.values(s.scenario.placement), ...s.scenario.clues.map((c) => c.spotId), ...Object.keys(s.scenario.gates)])];
  for (let round = 0; round < 3; round++) for (const id of ids) {
    if (s.scenario.gates[id]) s.solveGate(id);
    for (const item of s.inspect(id).items) s.take(item);
  }
}

describe('resultSummary(session, timeMs, timedOut)', () => {
  const p = profile(5);
  it('a finished case: all targets found, stars and coins, nothing missed', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const s = new GameSession(generateCase(seed, 'relaxed', p), p, 'relaxed');
      solveAll(s);
      const r = resultSummary(s, 90_000);
      expect(r.complete, `seed ${seed}`).toBe(true);
      expect(r.found.map((f) => f.id).sort()).toEqual([...s.scenario.targets].sort());
      expect(r.missed).toEqual([]);
      expect(r.stars).toBeGreaterThanOrEqual(1);
      expect(r.coins).toBeGreaterThan(0);
      expect(r.parSearches).toBe(s.scenario.parSearches);
      expect(r.searches).toBeGreaterThan(0);
      expect(r.found.every((f) => f.label.length > 0)).toBe(true);
      expect(r.mode).toBe('relaxed');
    }
  });
  it('an unfinished or timed-out case: stars 0, the rest is listed as missed', () => {
    const s = new GameSession(generateCase(4, 'rush', profile(6)), profile(6), 'rush');
    const r = resultSummary(s, 30_000, true);
    expect(r).toMatchObject({ complete: false, timedOut: true, stars: 0 });
    expect(r.missed.map((m) => m.id).sort()).toEqual([...s.scenario.targets].sort());
    const done = new GameSession(generateCase(4, 'rush', profile(6)), profile(6), 'rush');
    solveAll(done);
    expect(resultSummary(done, 30_000, true)).toMatchObject({ complete: false, stars: 0 });
  });
  it('does not change the session: the scene may still call finish and gets the same result', () => {
    const s = new GameSession(generateCase(9, 'relaxed', p), p, 'relaxed');
    solveAll(s);
    const before = JSON.stringify(s.exportState());
    const r = resultSummary(s, 45_000);
    expect(JSON.stringify(s.exportState())).toBe(before);
    expect(s.finish(45_000, false).stars).toBe(r.stars);
    expect(s.finish(45_000, false).coinsEarned).toBe(r.coins);
  });
});

describe('replayScript is a sensible Evening Replay in every mode', () => {
  const ROOMS: readonly string[] = ['entrance', 'living', 'kitchen', 'bedroom', 'bathroom', 'study', 'hall', 'garden'];
  const MODES: GameMode[] = ['relaxed', 'rush', 'daily'];
  it('for 3 modes x 6 days x 30 seeds (case builder, guided day 1, fallback): ordered, 8-30 s, 5-14 steps, ends where items ended up', () => {
    let n = 0;
    for (const mode of MODES) for (const day of [1, 2, 3, 5, 8, 12]) for (let seed = 1; seed <= 30; seed++) {
      const sc = generateCase(seed, mode, profile(day));
      const steps = replayScript(sc);
      const tag = `${mode} d${day} seed ${seed}`;
      expect(steps.length, tag).toBe(sc.evening.length);
      expect(steps.length, tag).toBeGreaterThanOrEqual(5);
      expect(steps.length, tag).toBeLessThanOrEqual(14);
      const dur = replayDuration(steps);
      expect(dur, tag).toBeGreaterThanOrEqual(8);
      expect(dur, tag).toBeLessThanOrEqual(30);
      for (let i = 1; i < steps.length; i++) expect((steps[i] as { t: number }).t, tag).toBeGreaterThan((steps[i - 1] as { t: number }).t);
      for (const st of steps) { expect(ROOMS, tag).toContain(st.room); expect(st.icon.startsWith('icon/'), tag).toBe(true); expect(st.found, tag).toBeUndefined(); }
      const last = new Map<ItemId, string | undefined>();
      for (const st of steps) if (st.itemId) last.set(st.itemId, st.spotId);
      for (const t of sc.targets) expect(last.get(t), `${tag} target ${t}`).toBe(sc.placement[t]);
      expect(JSON.stringify(replayScript(sc)), tag).toBe(JSON.stringify(steps));
      n++;
    }
    expect(n).toBe(540);
    const fb = fallbackScenario(1, 'relaxed');
    expect(replayDuration(replayScript(fb))).toBeGreaterThanOrEqual(8);
  });
  it('marks exactly the found targets that were really at their spot', () => {
    const sc = generateCase(3, 'relaxed', profile(5));
    const t = sc.targets[0] as ItemId;
    const flagged = replayScript(sc, { found: [t] }).filter((s) => s.found);
    expect(flagged.length).toBeGreaterThanOrEqual(1);
    expect(flagged.every((s) => s.itemId === t)).toBe(true);
    expect(replayScript(sc, { found: [] }).some((s) => s.found)).toBe(false);
  });
});
