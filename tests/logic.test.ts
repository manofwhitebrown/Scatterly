import { describe, expect, it } from 'vitest';
import { DECOR, GameSession, HOUSE, allSpots, applyRun, buyDecor, generateScenario, homeSpotCandidates, listDecor, setHomeSpot } from '../src/logic';
import { fallbackScenario } from '../src/logic/generator';
import { Rng } from '../src/logic/rng';
import { solveScenario } from '../src/logic/solver';
import { validateScenario } from '../src/logic/validator';
import { STORAGE_SPOTS } from '../src/content/decor';
import { IMPLY } from '../src/content/phrases';
import { TEMPLATES } from '../src/content/templates';
import { SPOT_SIZE, ROOM_ORDER } from '../src/shared/types';
import type { GameMode, PlayerProfile, RunResult, Spot } from '../src/shared/types';

function fresh(): PlayerProfile {
  return {
    version: 3, day: 1, coins: 0, streak: 0, lastDailyDate: null,
    unlockedRooms: ['entrance', 'living', 'kitchen', 'bedroom'], owned: [], homeSpots: {},
    bestStars: {}, tutorialDone: false,
    stats: { mornings: 0, perfect: 0, itemsFound: 0, hintsUsed: 0, puzzlesSolved: 0, bestStreak: 0, fastestMs: null },
    achievements: [], weekMorning: 0, weekStars: 0, settings: { sfx: true, music: true, vibration: true, lowFx: false, reducedMotion: false }, puzzles: {},
  };
}
const day10: PlayerProfile = {
  ...fresh(), day: 10, coins: 400, owned: ['keyHook', 'walletBowl', 'shoeBench'],
  homeSpots: { keys: 'entrance.keyHook', wallet: 'entrance.walletBowl', shoes: 'entrance.shoeBench' },
};
const rich: PlayerProfile = {
  ...fresh(), day: 20, coins: 999, unlockedRooms: [...ROOM_ORDER], owned: DECOR.map((d) => d.id),
  homeSpots: { keys: 'entrance.keyHook', wallet: 'entrance.walletBowl', phone: 'bedroom.dock', bag: 'entrance.bagHook', shoes: 'entrance.shoeBench' },
};
const MODES: GameMode[] = ['rush', 'relaxed', 'daily'];

function overlap(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

describe('rng and determinism', () => {
  it('same seed gives same sequence', () => {
    const a = new Rng(5), b = new Rng(5);
    for (let i = 0; i < 20; i++) expect(a.next()).toBe(b.next());
  });
  it('generates identical scenarios for identical inputs', () => {
    for (const mode of MODES) for (const p of [fresh(), day10, rich]) {
      expect(generateScenario(77, mode, p)).toEqual(generateScenario(77, mode, p));
    }
  });
  it('daily ignores profile day', () => {
    const a = generateScenario(20261101, 'daily', { ...fresh(), day: 1 });
    const b = generateScenario(20261101, 'daily', { ...fresh(), day: 30 });
    expect(a).toEqual(b);
    expect(a.difficulty).toBe(2);
  });
});

describe('fairness over many seeds', () => {
  for (const [name, p] of [['fresh', fresh()], ['day10', day10], ['rich', rich]] as const) {
    it(`valid and solvable: ${name}`, () => {
      for (const mode of MODES) for (let seed = 1; seed <= 400; seed++) {
        const s = generateScenario(seed, mode, p);
        expect(validateScenario(s, p), `${mode} ${seed}`).toEqual([]);
        expect(solveScenario(s).ok, `${mode} ${seed}`).toBe(true);
        expect(s.id.endsWith('tutorial')).toBe(false);
      }
    });
  }
  it('days 1-3 are tutorial friendly', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const s = generateScenario(seed, 'relaxed', fresh());
      expect(s.difficulty).toBe(1);
      expect(s.targets.length).toBe(2);
      // Day 1 is the fixed guided morning: exactly one easy puzzle. Days 2-3 may have up to 2 gates.
      const gates = Object.values(s.gates);
      expect(gates.length).toBe(1);
      expect(gates[0]?.difficulty).toBe(1);
    }
    for (let seed = 1; seed <= 100; seed++) {
      const s = generateScenario(seed, 'relaxed', { ...fresh(), day: 2 + (seed % 2) });
      expect(s.difficulty).toBe(1);
      expect(Object.keys(s.gates).length).toBeLessThanOrEqual(2);
    }
  });
  it('never places in locked rooms and uses every template eventually', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 400; seed++) {
      const s = generateScenario(seed, 'relaxed', fresh());
      for (const id of Object.values(s.placement)) expect(id?.startsWith('bathroom')).toBe(false);
      seen.add(s.title);
    }
    for (let seed = 1; seed <= 600; seed++) seen.add(generateScenario(seed, 'relaxed', rich).title);
    seen.delete('Your First Morning');
    expect(seen.size).toBe(TEMPLATES.length);
  });
  it('tidy homes use the home spot and emit a strong habit clue', () => {
    let hits = 0;
    for (let seed = 1; seed <= 300; seed++) {
      const s = generateScenario(seed, 'relaxed', day10);
      for (const c of s.clues.filter((x) => x.id.startsWith('habit-'))) {
        hits++;
        expect(c.links[0]?.strength).toBe('strong');
        expect(s.placement[c.links[0]?.item ?? 'keys']).toBe(c.links[0]?.spotId);
      }
    }
    expect(hits).toBeGreaterThan(20);
  });
  it('fallback scenario is valid', () => {
    const s = fallbackScenario(1, 'rush');
    expect(validateScenario(s, fresh())).toEqual([]);
    expect(solveScenario(s).ok).toBe(true);
  });
  it('templates are well formed and clue text fits worst case', () => {
    const longest = Math.max(...Object.values(IMPLY).flat().map((x) => x.length));
    for (const t of TEMPLATES) {
      for (const st of t.steps) {
        if (st.slot) expect(t.slots[st.slot], `${t.id} ${st.slot}`).toBeDefined();
        if (st.item && st.slot) expect(t.slots[st.slot]?.items ?? []).toContain(st.item);
      }
      const visited = new Set(t.steps.map((s) => s.slot));
      for (const c of t.clues) {
        expect(visited.has(c.slot), `${t.id} visits ${c.slot}`).toBe(true);
        for (const l of c.links) {
          if (l.slot) expect(t.slots[l.slot]).toBeDefined();
          if (l.roomOf) expect(t.slots[l.roomOf]).toBeDefined();
        }
        const tokens = (c.text.match(/\{where:/g) ?? []).length;
        const flat = c.text.replace(/\{where:[A-Za-z0-9]+\}/g, '').replace(/\{fact:[a-z]+\}/g, '99');
        expect(flat.length + tokens * longest, c.title).toBeLessThan(101);
      }
    }
  });
});

describe('house and decor spatial rules', () => {
  it('HOUSE obeys the contract', () => {
    expect(HOUSE.length).toBeGreaterThanOrEqual(48);
    expect(HOUSE.length).toBeLessThanOrEqual(58);
    expect(new Set(HOUSE.map((s) => s.id)).size).toBe(HOUSE.length);
    for (const r of ROOM_ORDER) expect(HOUSE.filter((s) => s.room === r).length).toBeGreaterThanOrEqual(8);
    for (const s of HOUSE) {
      expect(s.id).toBe(`${s.room}.${s.id.split('.')[1]}`);
      expect(s.w).toBe(SPOT_SIZE[s.kind].w);
      expect(s.h).toBe(SPOT_SIZE[s.kind].h);
      expect(s.x).toBeGreaterThanOrEqual(40);
      expect(s.x).toBeLessThanOrEqual(1240 - s.w);
      expect(s.y + s.h).toBeGreaterThanOrEqual(470);
      expect(s.y + s.h).toBeLessThanOrEqual(690);
      expect(s.plausible.length).toBeGreaterThan(0);
    }
    for (let i = 0; i < HOUSE.length; i++) for (let j = i + 1; j < HOUSE.length; j++) {
      const a = HOUSE[i] as Spot, b = HOUSE[j] as Spot;
      if (a.room === b.room) expect(overlap(a, b), `${a.id} ${b.id}`).toBe(false);
    }
  });
  it('DECOR does not overlap spots or each other and storage obeys spot rules', () => {
    expect(DECOR.length).toBeGreaterThanOrEqual(14);
    expect(DECOR.length).toBeLessThanOrEqual(18);
    expect(new Set(DECOR.map((d) => d.id)).size).toBe(DECOR.length);
    const all = [...HOUSE, ...STORAGE_SPOTS];
    for (const d of DECOR) {
      expect(d.price).toBeGreaterThanOrEqual(30);
      expect(d.price).toBeLessThanOrEqual(250);
      for (const s of all) if (s.room === d.room && s.id !== `${d.room}.${d.id}`) expect(overlap(d, s), `${d.id} ${s.id}`).toBe(false);
      if (d.kind === 'storage') {
        expect(d.benefit).toBeTruthy();
        expect(d.x).toBeGreaterThanOrEqual(40);
        expect(d.x).toBeLessThanOrEqual(1240 - d.w);
        expect(d.y + d.h).toBeGreaterThanOrEqual(470);
        expect(d.y + d.h).toBeLessThanOrEqual(690);
      } else {
        expect(d.y + d.h).toBeLessThanOrEqual(690);
      }
    }
    for (const a of DECOR) for (const b of DECOR) if (a !== b && a.room === b.room) expect(overlap(a, b), `${a.id} ${b.id}`).toBe(false);
  });
});

describe('session', () => {
  it('happy path: follow clues, find targets, finish', () => {
    const p = fresh();
    const s = generateScenario(3, 'relaxed', p);
    const game = new GameSession(s, p, 'relaxed');
    const events: string[] = [];
    game.on('clue', () => events.push('clue'));
    game.on('found', () => events.push('found'));
    game.on('complete', () => events.push('complete'));
    // Cheat-free walk: open every spot a clue or target lives in.
    const spotsToOpen = [...new Set([...s.clues.map((c) => c.spotId), ...s.targets.map((t) => s.placement[t] as string)])];
    for (const id of spotsToOpen) {
      if (s.gates[id]) {
        expect(game.inspect(id).kind).toBe('locked');
        game.solveGate(id);
      }
      const out = game.inspect(id);
      for (const i of out.items) game.take(i);
    }
    expect(game.isComplete()).toBe(true);
    expect(events.filter((e) => e === 'complete').length).toBe(1);
    expect(game.remainingTargets()).toEqual([]);
    const r = game.finish(30000, false);
    expect(r.stars).toBeGreaterThan(0);
    expect(r.found.sort()).toEqual([...s.targets].sort());
  });
  it('re-inspect is free and unopened items cannot be taken', () => {
    const p = fresh();
    const s = generateScenario(4, 'relaxed', p);
    const game = new GameSession(s, p, 'relaxed');
    const t = s.targets[0] as 'keys';
    expect(game.take(t)).toBe(false);
    const spot = s.placement[t] as string;
    if (!s.gates[spot]) {
      game.inspect(spot);
      game.inspect(spot);
      expect(game.finish(1, false).searches).toBe(1);
    }
  });
  it('hints escalate room then spot', () => {
    const p = fresh();
    const s = generateScenario(5, 'relaxed', p);
    const game = new GameSession(s, p, 'relaxed');
    const h1 = game.hint();
    const h2 = game.hint();
    expect(h1?.room).toBeDefined();
    expect(h1?.spotId).toBeUndefined();
    expect(h2?.spotId).toBeDefined();
  });
  it('star and coin math', () => {
    const p: PlayerProfile = { ...fresh(), streak: 3 };
    const s = generateScenario(9, 'rush', p);
    const run = (searchesOpen: number, hints: number, complete: boolean, ms: number): RunResult => {
      const g = new GameSession(s, p, 'rush');
      const ids = [...new Set([...s.clues.map((c) => c.spotId), ...Object.values(s.placement) as string[]])];
      let n = 0;
      for (const id of ids) {
        if (n >= searchesOpen) break;
        if (s.gates[id]) g.solveGate(id);
        g.inspect(id);
        n++;
      }
      if (complete) for (const t of s.targets) { const w = s.placement[t] as string; if (s.gates[w]) g.solveGate(w); g.inspect(w); g.take(t); }
      for (let i = 0; i < hints; i++) g.solveGate('none', true);
      return g.finish(ms, false);
    };
    const quick = run(0, 0, true, 1000);
    expect(quick.stars === 3 || quick.stars === 2).toBe(true);
    expect(quick.coinsEarned).toBe(Math.round((10 + 15 * quick.stars + 5 * s.difficulty + 6) * 1.25));
    const fail = new GameSession(s, p, 'rush').finish(5000, true);
    expect(fail.stars).toBe(0);
    expect(fail.coinsEarned).toBe(10 + 5 * s.difficulty);
  });
});

describe('progression', () => {
  it('applyRun updates and does not mutate', () => {
    const p = fresh();
    const frozen = JSON.stringify(p);
    const r: RunResult = { scenarioId: 'x', mode: 'daily', targets: [], found: [], timeMs: 1, searches: 1, hintsUsed: 0, timedOut: false, stars: 2, coinsEarned: 40, habitHits: [], newAchievements: [], puzzleLog: [] };
    const a = applyRun(p, r, '2026-11-01');
    expect(a.day).toBe(2);
    expect(a.coins).toBe(40);
    expect(a.streak).toBe(1);
    expect(a.bestStars.x).toBe(2);
    const b = applyRun(a, { ...r, stars: 1 }, '2026-11-02');
    expect(b.streak).toBe(2);
    expect(b.bestStars.x).toBe(2);
    expect(applyRun(b, r, '2026-11-05').streak).toBe(1);
    expect(JSON.stringify(p)).toBe(frozen);
    let q = p;
    for (let i = 0; i < 5; i++) q = applyRun(q, { ...r, mode: 'relaxed' });
    expect(q.unlockedRooms).toContain('bathroom');
  });
  it('buyDecor and setHomeSpot are immutable and validated', () => {
    const p: PlayerProfile = { ...fresh(), coins: 100 };
    const frozen = JSON.stringify(p);
    expect(buyDecor(p, 'tray')).toBeNull();
    expect(buyDecor(p, 'nope')).toBeNull();
    const bought = buyDecor(p, 'keyHook');
    expect(bought?.coins).toBe(60);
    expect(bought?.owned).toContain('keyHook');
    expect(buyDecor(bought as PlayerProfile, 'keyHook')).toBeNull();
    expect(JSON.stringify(p)).toBe(frozen);
    expect(allSpots(p).some((s) => s.id === 'entrance.keyHook')).toBe(false);
    expect(allSpots(bought as PlayerProfile).some((s) => s.id === 'entrance.keyHook')).toBe(true);
    const set = setHomeSpot(bought as PlayerProfile, 'keys', 'entrance.keyHook');
    expect(set.homeSpots.keys).toBe('entrance.keyHook');
    expect(setHomeSpot(set, 'keys', 'living.charger')).toBe(set);
    expect(setHomeSpot(set, 'keys', null).homeSpots.keys).toBeUndefined();
    expect(homeSpotCandidates(fresh(), 'keys').every((s) => s.plausible.includes('keys'))).toBe(true);
    expect(listDecor(p).find((v) => v.def.id === 'keyHook')?.canBuy).toBe(true);
  });
});

describe('performance', () => {
  it('generates 400 scenarios under 1.5s', () => {
    const t0 = Date.now();
    for (let seed = 1; seed <= 400; seed++) generateScenario(seed, 'relaxed', rich);
    expect(Date.now() - t0).toBeLessThan(1500);
  });
});

describe('deduction marks', () => {
  function sess(profile: PlayerProfile = fresh()): GameSession {
    return new GameSession(generateScenario(5, 'relaxed', profile), profile, 'relaxed');
  }
  it('sets, clears and cycles marks', () => {
    const g = sess();
    const id = g.spotsIn('kitchen')[0]?.id as string;
    expect(g.setMark(id, 'hunch')).toBe(true);
    expect(g.marks().get(id)).toBe('hunch');
    expect(g.setMark(id, 'hunch')).toBe(false);
    expect(g.setMark(id, null)).toBe(true);
    expect(g.marks().has(id)).toBe(false);
    expect([g.cycleMark(id), g.cycleMark(id), g.cycleMark(id)]).toEqual(['ruledOut', 'hunch', null]);
  });
  it('ignores unknown and locked-room spot ids', () => {
    const g = sess();
    expect(g.setMark('nowhere.void', 'hunch')).toBe(false);
    expect(g.setMark('bathroom.sink', 'hunch')).toBe(false);
    expect(g.marks().size).toBe(0);
  });
  it('searching clears the mark and opened spots cannot be marked', () => {
    const g = sess();
    const id = g.spotsIn('living')[0]?.id as string;
    const seen: unknown[] = [];
    g.on('mark', (p) => seen.push(p));
    g.setMark(id, 'ruledOut');
    const out = g.inspect(id);
    if (out.kind !== 'locked') {
      expect(g.marks().has(id)).toBe(false);
      expect(g.setMark(id, 'hunch')).toBe(false);
      expect(seen.length).toBe(2);
    }
  });
  it('marks on gated spots survive the gate solve and never change scoring', () => {
    const p = { ...day10 };
    let found = false;
    for (let seed = 1; seed <= 200 && !found; seed++) {
      const sc = generateScenario(seed, 'relaxed', p);
      const gated = Object.keys(sc.gates)[0];
      if (!gated) continue;
      found = true;
      const a = new GameSession(sc, p, 'relaxed');
      const b = new GameSession(sc, p, 'relaxed');
      expect(a.setMark(gated, 'hunch')).toBe(true);
      expect(a.inspect(gated).kind).toBe('locked');
      expect(a.marks().get(gated)).toBe('hunch');
      a.solveGate(gated);
      b.solveGate(gated);
      expect(a.marks().get(gated)).toBe('hunch');
      a.inspect(gated);
      b.inspect(gated);
      expect(a.finish(1000, false)).toEqual(b.finish(1000, false));
    }
    expect(found).toBe(true);
  });
});

describe('habit payoff', () => {
  it('habitHits lists only found targets at their home spot', () => {
    let checked = 0;
    for (let seed = 1; seed <= 300; seed++) {
      const sc = generateScenario(seed, 'relaxed', day10);
      const g = new GameSession(sc, day10, 'relaxed');
      expect(g.habitHits()).toEqual([]);
      for (const t of sc.targets) {
        const where = sc.placement[t] as string;
        const sp = Object.keys(sc.gates).includes(where);
        if (sp) g.solveGate(where);
        g.inspect(where);
        g.take(t);
      }
      const expected = sc.targets.filter((t) => day10.homeSpots[t] === sc.placement[t]);
      expect(g.habitHits().sort()).toEqual(expected.sort());
      checked += expected.length;
    }
    expect(checked).toBeGreaterThan(0);
  });
});

describe('spotsIn cache', () => {
  it('returns the same array per room', () => {
    const g = new GameSession(generateScenario(3, 'relaxed', fresh()), fresh(), 'relaxed');
    expect(g.spotsIn('kitchen')).toBe(g.spotsIn('kitchen'));
    expect(g.spotsIn('bathroom')).toEqual([]);
  });
});
