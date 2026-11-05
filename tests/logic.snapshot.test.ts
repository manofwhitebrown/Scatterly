import { describe, expect, it } from 'vitest';
import { defaultProfile, migrate } from '../src/core/save';
import { generateCase } from '../src/logic/generator';
import { Rng } from '../src/logic/rng';
import { GameSession } from '../src/logic/session';
import { SNAPSHOT_REV, captureSnapshot, restoreSnapshot, scenarioFingerprint } from '../src/logic/snapshot';
import type { Restored, SessionSnapshot } from '../src/logic/snapshot';
import { LEGACY_ROOMS } from '../src/shared/types';
import type { GameMode, PlayerProfile, SessionLength } from '../src/shared/types';

const profile = (day: number, length: SessionLength = 'standard'): PlayerProfile => ({
  ...defaultProfile(), day, unlockedRooms: [...LEGACY_ROOMS, 'study'],
  settings: { ...defaultProfile().settings, sessionLength: length },
});
const roundTrip = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

/** Plays `steps` deterministic actions: open spots (solving gates first), take items, mark spots, ask for hints. */
function play(session: GameSession, rng: Rng, steps: number): void {
  const ids = Object.values(session.scenario.placement).concat(session.scenario.clues.map((c) => c.spotId));
  const all = [...new Set([...ids, ...Object.keys(session.scenario.gates)])];
  for (let i = 0; i < steps; i++) {
    const id = rng.pick(all);
    const roll = rng.next();
    if (roll < 0.15) { session.hint(); continue; }
    if (roll < 0.3) { session.setMark(id, rng.chance(0.5) ? 'ruledOut' : 'hunch'); continue; }
    if (session.scenario.gates[id]) session.solveGate(id, rng.chance(0.2));
    const out = session.inspect(id);
    for (const item of out.items) session.take(item);
  }
}

const summary = (s: GameSession): unknown => ({
  state: s.exportState(), found: s.found(), inv: s.inventory(), clues: s.discoveredClues().map((c) => c.id), done: s.isComplete(),
});

describe('resume: capture and restore', () => {
  it('round-trips through JSON for every mode, several days and 40 seeds, and the restored session plays on identically', () => {
    for (const [day, mode] of [[1, 'relaxed'], [3, 'relaxed'], [5, 'relaxed'], [8, 'relaxed'], [12, 'relaxed'], [6, 'rush'], [8, 'daily']] as Array<[number, GameMode]>) {
      const p = profile(day);
      for (let seed = 1; seed <= 40; seed++) {
        const scenario = generateCase(seed, mode, p);
        const a = new GameSession(scenario, p, mode);
        play(a, new Rng(seed * 7 + day), 6 + (seed % 12));
        const snap = roundTrip(captureSnapshot(a, seed, p, 123456));
        const r = restoreSnapshot(snap, p) as Restored;
        expect(r, `${mode} d${day} seed ${seed}`).not.toBeNull();
        expect(r.elapsedMs).toBe(123456);
        expect(r.seed).toBe(seed);
        expect(summary(r.session), `${mode} d${day} seed ${seed}`).toEqual(summary(a));
        // continue both with the same actions: they must stay identical to the end
        play(a, new Rng(99), 30);
        play(r.session, new Rng(99), 30);
        expect(summary(r.session)).toEqual(summary(a));
        expect(r.session.finish(60000, false)).toEqual(a.finish(60000, false));
      }
    }
  });

  it('survives a real save: profile -> JSON -> migrate keeps the snapshot and it restores', () => {
    const p = profile(5);
    const scenario = generateCase(11, 'relaxed', p);
    const a = new GameSession(scenario, p, 'relaxed');
    play(a, new Rng(5), 14);
    const saved = { ...p, resume: captureSnapshot(a, 11, p, 5000) };
    const loaded = migrate(JSON.parse(JSON.stringify(saved)));
    expect(loaded.resume).not.toBeNull();
    const r = restoreSnapshot(loaded.resume, loaded) as Restored;
    expect(summary(r.session)).toEqual(summary(a));
  });

  it('restores even if the player profile changed in ways the case does not depend on (coins, name)', () => {
    const p = profile(5);
    const a = new GameSession(generateCase(3, 'relaxed', p), p, 'relaxed');
    play(a, new Rng(2), 10);
    const snap = captureSnapshot(a, 3, p, 1000);
    expect(restoreSnapshot(snap, { ...p, coins: p.coins + 500 })).not.toBeNull();
  });

  it('a snapshot of an untouched case restores to an untouched case', () => {
    const p = profile(5);
    const a = new GameSession(generateCase(8, 'relaxed', p), p, 'relaxed');
    const r = restoreSnapshot(captureSnapshot(a, 8, p, 0), p) as Restored;
    expect(summary(r.session)).toEqual(summary(a));
  });
});

describe('resume: bad input falls back to a fresh case (null), never throws', () => {
  const p = profile(5);
  const a = new GameSession(generateCase(21, 'relaxed', p), p, 'relaxed');
  play(a, new Rng(21), 16);
  const good = (): SessionSnapshot => roundTrip(captureSnapshot(a, 21, p, 9000));
  const edit = (f: (s: Record<string, unknown>, snap: Record<string, unknown>) => void): unknown => {
    const snap = good() as unknown as Record<string, unknown>;
    f(snap.state as Record<string, unknown>, snap);
    return snap;
  };

  it('the unmodified snapshot is accepted (control)', () => { expect(restoreSnapshot(good(), p)).not.toBeNull(); });
  it('not an object, wrong version, other state revision', () => {
    for (const bad of [null, undefined, 0, 'x', [], {}, { v: 1 }, edit((_s, snap) => { snap.v = 2; }), edit((s) => { s.rev = SNAPSHOT_REV + 1; }), edit((s) => { delete s.rev; })]) {
      expect(restoreSnapshot(bad, p)).toBeNull();
    }
  });
  it('an older save: a v1 stub from before Phase 6 (empty state) is discarded', () => {
    expect(restoreSnapshot({ v: 1, scenarioId: 'relaxed-21', mode: 'relaxed', seed: 21, state: {} }, p)).toBeNull();
  });
  it('wrong identity: seed, mode, id or fingerprint', () => {
    expect(restoreSnapshot(edit((_s, snap) => { snap.seed = 22; }), p)).toBeNull();
    expect(restoreSnapshot(edit((_s, snap) => { snap.mode = 'rush'; }), p)).toBeNull();
    expect(restoreSnapshot(edit((_s, snap) => { snap.mode = 'nope'; }), p)).toBeNull();
    expect(restoreSnapshot(edit((_s, snap) => { snap.scenarioId = 'relaxed-99'; }), p)).toBeNull();
    expect(restoreSnapshot(edit((s) => { s.fp = 'deadbeef-1'; }), p)).toBeNull();
    expect(restoreSnapshot(edit((s) => { s.day = 6; }), p)).toBeNull(); // a different day is a different case
  });
  it('progress that does not fit the case is refused', () => {
    expect(restoreSnapshot(edit((s) => { s.opened = ['no.such.spot']; s.searches = 1; }), p)).toBeNull();
    expect(restoreSnapshot(edit((s) => { s.taken = ['keys', 'keys']; }), p)).toBeNull();
    expect(restoreSnapshot(edit((s) => { s.searches = -1; }), p)).toBeNull();
    expect(restoreSnapshot(edit((s) => { s.searches = 1e9; }), p)).toBeNull();
    expect(restoreSnapshot(edit((s) => { s.hints = [['keys', 7000]]; }), p)).toBeNull();
    expect(restoreSnapshot(edit((s) => { s.marks = [['x', 'weird']]; }), p)).toBeNull();
    expect(restoreSnapshot(edit((s) => { s.opened = Array.from({ length: 5000 }, (_, i) => `s${i}`); }), p)).toBeNull();
    expect(restoreSnapshot(edit((s) => { s.elapsedMs = 'soon'; }), p)).toBeNull();
    expect(restoreSnapshot(edit((s) => { s.elapsedMs = Number.NaN; }), p)).toBeNull();
  });
  it('a locked spot cannot be recorded as opened without its gate solved', () => {
    const gated = Object.keys(a.scenario.gates)[0] as string;
    expect(restoreSnapshot(edit((s) => { s.opened = [gated]; s.solved = []; s.clues = []; s.taken = []; s.searches = 1; }), p)).toBeNull();
  });
  it('fuzz: 1500 random corruptions never throw; any accepted result is a self-consistent session', () => {
    const rng = new Rng(4242);
    const junk: unknown[] = [null, undefined, -1, 1e9, 'x', [], {}, [[]], ['a', 'a'], true, NaN];
    for (let i = 0; i < 1500; i++) {
      const snap = good() as unknown as Record<string, unknown>;
      const st = snap.state as Record<string, unknown>;
      const target = rng.chance(0.3) ? snap : st;
      const key = rng.pick(Object.keys(target));
      const mode = rng.int(0, 2);
      if (mode === 0) delete target[key];
      else if (mode === 1) target[key] = rng.pick(junk);
      else if (Array.isArray(target[key])) (target[key] as unknown[]).push(rng.pick(junk));
      let r: Restored | null = null;
      expect(() => { r = restoreSnapshot(roundTrip(snap), p); }).not.toThrow();
      if (r) {
        const res = r as Restored;
        const re = restoreSnapshot(roundTrip(captureSnapshot(res.session, res.seed, p, res.elapsedMs)), p);
        expect(re, 'an accepted snapshot re-captures and restores').not.toBeNull();
      }
    }
  });
});

describe('scenario fingerprint', () => {
  it('is stable for a seed and differs between seeds', () => {
    const p = profile(5);
    const fps = Array.from({ length: 30 }, (_, i) => scenarioFingerprint(generateCase(i + 1, 'relaxed', p)));
    expect(scenarioFingerprint(generateCase(1, 'relaxed', p))).toBe(fps[0]);
    expect(new Set(fps).size).toBe(30);
  });
});
