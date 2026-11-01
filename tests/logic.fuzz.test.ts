import { describe, expect, it } from 'vitest';
import { GameSession, generateScenario } from '../src/logic';
import { Rng } from '../src/logic/rng';
import { ITEM_IDS, ROOM_ORDER } from '../src/shared/types';
import type { GameMode, ItemId, PlayerProfile } from '../src/shared/types';

function profile(day: number, rooms: number): PlayerProfile {
  return {
    version: 2, day, coins: 0, streak: 0, lastDailyDate: null,
    unlockedRooms: ROOM_ORDER.slice(0, rooms) as PlayerProfile['unlockedRooms'], owned: [], homeSpots: {},
    bestStars: {}, tutorialDone: false,
    stats: { mornings: 0, perfect: 0, itemsFound: 0, hintsUsed: 0, puzzlesSolved: 0, bestStreak: 0, fastestMs: null },
    achievements: [], weekMorning: 0, weekStars: 0,
    settings: { sfx: true, music: true, vibration: true, lowFx: false, reducedMotion: false },
  };
}

const MODES: GameMode[] = ['rush', 'relaxed', 'daily'];
const BOGUS = ['', 'nowhere.void', 'kitchen.', '__proto__', 'bathroom.sink'];

function runFuzz(seed: number, mode: GameMode, p: PlayerProfile): void {
  const sc = generateScenario(seed, mode, p);
  const g = new GameSession(sc, p, mode);
  const rng = new Rng(seed * 7919 + 13);
  const ids = ROOM_ORDER.flatMap((r) => g.spotsIn(r).map((s) => s.id));
  let completes = 0;
  g.on('complete', () => { completes++; });
  let lastSearches = 0;
  let lastHints = 0;
  for (let step = 0; step < 120; step++) {
    const spot = rng.chance(0.1) ? rng.pick(BOGUS) : rng.pick(ids);
    const item = (rng.chance(0.1) ? 'ghost' : rng.pick([...ITEM_IDS])) as ItemId;
    const op = rng.int(0, 7);
    if (op === 0 || op === 1) g.inspect(spot);
    else if (op === 2) g.take(item);
    else if (op === 3) g.solveGate(spot, rng.chance(0.3));
    else if (op === 4) {
      const before = g.remainingTargets();
      const h = g.hint();
      if (h === null) expect(before).toEqual([]);
      else if (h.spotId) expect(before.some((t) => sc.placement[t] === h.spotId), 'hint reveals found item').toBe(true);
    } else if (op === 5) g.setMark(spot, rng.chance(0.2) ? null : rng.pick(['ruledOut', 'hunch'] as const));
    else if (op === 6) g.cycleMark(spot);
    else {
      const r = g.finish(rng.int(0, 200000), rng.chance(0.2));
      expect(r.searches).toBeGreaterThanOrEqual(lastSearches);
      expect(r.hintsUsed).toBeGreaterThanOrEqual(lastHints);
      lastSearches = r.searches;
      lastHints = r.hintsUsed;
    }
    for (const f of g.found()) expect(sc.targets).toContain(f);
    for (const id of g.marks().keys()) expect(g.isOpened(id)).toBe(false);
    expect(g.isComplete()).toBe(sc.targets.every((t) => g.inventory().includes(t)));
    expect(new Set(g.inventory()).size).toBe(g.inventory().length);
  }
  expect(completes).toBeLessThanOrEqual(1);
  expect(completes).toBe(g.isComplete() ? 1 : 0);
}

describe('session fuzz', () => {
  for (const [name, p] of [['fresh', profile(1, 4)], ['mid', profile(10, 4)], ['all', profile(20, 5)]] as const) {
    it(`random action sequences keep invariants: ${name}`, () => {
      for (const mode of MODES) for (let seed = 1; seed <= 50; seed++) runFuzz(seed, mode, p);
    });
  }
  it('a scripted perfect run completes exactly once, in any duplicate order', () => {
    const p = profile(10, 4);
    for (let seed = 1; seed <= 100; seed++) {
      const sc = generateScenario(seed, 'relaxed', p);
      const g = new GameSession(sc, p, 'relaxed');
      let completes = 0;
      g.on('complete', () => { completes++; });
      for (const t of [...sc.targets, ...sc.targets]) {
        const where = sc.placement[t] as string;
        g.solveGate(where);
        g.solveGate(where);
        g.inspect(where);
        g.take(t);
        g.take(t);
      }
      expect(completes).toBe(1);
      expect(g.hint()).toBeNull();
    }
  });
});
