import { beforeEach, describe, expect, it } from 'vitest';
import { defaultProfile, loadProfile, migrate } from '../src/core/save';
import { SAVE_VERSION } from '../src/shared/types';

const KEY = 'scatterly.profile.v1';

class MemStorage {
  data = new Map<string, string>();
  throwOnGet = false;
  getItem(k: string): string | null {
    if (this.throwOnGet) throw new Error('SecurityError');
    return this.data.get(k) ?? null;
  }
  setItem(k: string, v: string): void { this.data.set(k, v); }
  removeItem(k: string): void { this.data.delete(k); }
}

let store: MemStorage;
beforeEach(() => {
  store = new MemStorage();
  (globalThis as unknown as { window: unknown }).window = {
    localStorage: store,
    setTimeout: globalThis.setTimeout.bind(globalThis),
    clearTimeout: globalThis.clearTimeout.bind(globalThis),
    addEventListener: () => undefined,
  };
});

const v1 = {
  version: 1, day: 12, coins: 340, streak: 4, lastDailyDate: '2026-10-30',
  unlockedRooms: ['entrance', 'living', 'kitchen', 'bedroom', 'bathroom'],
  owned: ['plant1', 'rug2'], homeSpots: { keys: 'entrance.keyHook' },
  bestStars: { a: 3, b: 1 }, tutorialDone: true,
  settings: { sfx: false, music: true, vibration: true, lowFx: true },
};

describe('save migration', () => {
  it('v1 save migrates intact with safe v2 defaults', () => {
    store.setItem(KEY, JSON.stringify(v1));
    const p = loadProfile();
    expect(p.version).toBe(SAVE_VERSION);
    expect(p.day).toBe(12);
    expect(p.coins).toBe(340);
    expect(p.streak).toBe(4);
    expect(p.lastDailyDate).toBe('2026-10-30');
    expect(p.unlockedRooms).toContain('bathroom');
    expect(p.owned).toEqual(['plant1', 'rug2']);
    expect(p.homeSpots).toEqual({ keys: 'entrance.keyHook' });
    expect(p.bestStars).toEqual({ a: 3, b: 1 });
    expect(p.tutorialDone).toBe(true);
    expect(p.settings).toEqual({ ...defaultProfile().settings, sfx: false, music: true, vibration: true, lowFx: true, reducedMotion: false });
    expect(p.stats).toEqual(defaultProfile().stats);
    expect(p.achievements).toEqual([]);
    expect(p.weekMorning).toBe(0);
    expect(p.weekStars).toBe(0);
  });

  it('corrupted JSON falls back to defaults', () => {
    store.setItem(KEY, '{not json');
    expect(loadProfile()).toEqual(defaultProfile());
  });

  it('non-object values fall back to defaults', () => {
    for (const bad of [null, 5, 'x', [], true, undefined]) {
      expect(migrate(bad)).toEqual(defaultProfile());
    }
  });

  it('wrong types and missing fields are repaired field by field', () => {
    const p = migrate({
      day: 'ten', coins: -5, streak: NaN, owned: 'nope', homeSpots: [], bestStars: { a: 9, b: 2 },
      unlockedRooms: ['attic', 'bathroom'], stats: { mornings: 'x', fastestMs: -1, perfect: 3.9 },
      achievements: [1, 'ok', 'ok'], weekMorning: 99, weekStars: -4, settings: 5,
    });
    expect(p.day).toBe(1);
    expect(p.coins).toBe(0);
    expect(p.streak).toBe(0);
    expect(p.owned).toEqual([]);
    expect(p.homeSpots).toEqual({});
    expect(p.bestStars).toEqual({ b: 2 });
    expect(p.unlockedRooms).toContain('bathroom');
    expect(p.unlockedRooms).not.toContain('attic');
    expect(p.stats.mornings).toBe(0);
    expect(p.stats.perfect).toBe(3);
    expect(p.stats.fastestMs).toBeNull();
    expect(p.achievements).toEqual(['ok']);
    expect(p.weekMorning).toBe(6);
    expect(p.weekStars).toBe(0);
    expect(p.settings).toEqual(defaultProfile().settings);
  });

  it('future version never crashes and is normalised to the current version', () => {
    const p = migrate({ ...v1, version: 99, coins: 7, futureThing: { a: 1 } });
    expect(p.version).toBe(SAVE_VERSION);
    expect(p.coins).toBe(7);
  });

  it('unknown fields are dropped, never trusted', () => {
    const p = migrate({ ...v1, evil: 'x', __proto__: { polluted: true }, settings: { ...v1.settings, hack: true } });
    expect('evil' in p).toBe(false);
    expect('hack' in p.settings).toBe(false);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it('prototype-pollution keys in maps are ignored', () => {
    const p = migrate(JSON.parse('{"homeSpots":{"__proto__":"x","keys":"a.b"},"bestStars":{"__proto__":3}}'));
    expect(p.homeSpots).toEqual({ keys: 'a.b' });
    expect(Object.keys(p.bestStars)).toEqual([]);
  });

  it('localStorage that throws on read falls back safely', () => {
    store.throwOnGet = true;
    expect(loadProfile()).toEqual(defaultProfile());
  });

  it('missing window.localStorage falls back safely', () => {
    (globalThis as unknown as { window: unknown }).window = {};
    expect(loadProfile()).toEqual(defaultProfile());
  });

  it('v2 save migrates to v4 with empty puzzle mastery and keeps progress', () => {
    const v2 = { ...v1, version: 2, stats: { mornings: 5, puzzlesSolved: 9 }, settings: { sfx: true, music: true, vibration: true, lowFx: false, reducedMotion: true } };
    store.setItem(KEY, JSON.stringify(v2));
    const p = loadProfile();
    expect(p.version).toBe(SAVE_VERSION);
    expect(p.puzzles).toEqual({});
    expect(p.stats.mornings).toBe(5);
    expect(p.stats.puzzlesSolved).toBe(9);
    expect(p.settings.reducedMotion).toBe(true);
    expect(p.coins).toBe(340);
  });

  it('v3 puzzle mastery is validated per known kind', () => {
    const raw = {
      ...v1, version: 3,
      puzzles: {
        code: { solved: 4, skipped: 1, bestMs: 12000.7, seen: true },
        lights: { solved: -3, skipped: 'x', bestMs: -1 },
        bogus: { solved: 9, skipped: 9, bestMs: 1 },
        sort: 'nope',
      },
    };
    store.setItem(KEY, JSON.stringify(raw));
    const p = loadProfile();
    expect(p.puzzles.code).toEqual({ solved: 4, skipped: 1, bestMs: 12000, seen: true });
    expect(p.puzzles.lights).toEqual({ solved: 0, skipped: 0, bestMs: null, seen: false });
    expect(p.puzzles.bogus).toBeUndefined();
    expect(p.puzzles.sort).toBeUndefined();
  });

  it('non-object puzzles field and null save never crash', () => {
    store.setItem(KEY, JSON.stringify({ ...v1, version: 3, puzzles: [1, 2] }));
    expect(loadProfile().puzzles).toEqual({});
    store.setItem(KEY, 'null');
    expect(loadProfile()).toEqual(defaultProfile());
  });
});

describe('save migration v3 -> v4', () => {
  const v3 = { ...v1, version: 3, puzzles: { code: { solved: 2, skipped: 0, bestMs: 9000 } } };

  it('keeps all v3 progress and fills every v4 field with its default', () => {
    store.setItem(KEY, JSON.stringify(v3));
    const p = loadProfile();
    const d = defaultProfile();
    expect(p.version).toBe(4);
    expect(p.coins).toBe(340);
    expect(p.puzzles.code).toEqual({ solved: 2, skipped: 0, bestMs: 9000, seen: false });
    expect(p.builder).toEqual({});
    expect(p.themes).toEqual({});
    expect(p.pet).toEqual(d.pet);
    expect(p.chill).toEqual({ minutes: 0, sessions: 0 });
    expect(p.collection).toEqual([]);
    expect(p.resume).toBeNull();
    expect(p.settings).toMatchObject({ quality: 'auto', matchClock: false, walkAnim: true, sessionLength: 'standard' });
  });

  it('a full v4 profile survives a save/load round trip unchanged', () => {
    const p = { ...defaultProfile(), day: 9, collection: ['mug', 'vase'], chill: { minutes: 12, sessions: 2 } };
    p.builder = { living: [{ id: 'plant1', gx: 2, gy: -3, rot: 1, flip: true }] };
    p.themes = { living: { wall: 'sage', floor: 'oak' } };
    p.pet = { name: 'Pip', outfit: 'scarf', treats: 3 };
    p.resume = { v: 1, scenarioId: 's1', mode: 'relaxed', seed: 42, state: { found: ['keys'] } };
    store.setItem(KEY, JSON.stringify(p));
    expect(loadProfile()).toEqual(p);
  });

  it('settings are clamped and enum-checked', () => {
    const raw = { ...v1, version: 4, settings: { quality: 'ultra', musicVol: 7, sfxVol: -2, ambienceVol: 'x', ambience: '', sessionLength: 'forever', walkAnim: 'yes' } };
    const s = migrate(raw).settings;
    expect(s).toMatchObject({ quality: 'auto', musicVol: 1, sfxVol: 0, ambienceVol: 0.6, ambience: 'auto', sessionLength: 'standard', walkAnim: true });
    expect(migrate({ ...raw, settings: { quality: 'high', sessionLength: 'long', matchClock: true } }).settings)
      .toMatchObject({ quality: 'high', sessionLength: 'long', matchClock: true });
  });

  it('builder, themes, pet, chill and collection reject malformed entries', () => {
    const p = migrate({
      ...v1, version: 4,
      builder: {
        living: [{ id: 'a', gx: 1, gy: 2, rot: 9, flip: 'x' }, { id: '', gx: 0, gy: 0 }, 'junk', { id: 'b', gx: 999, gy: -999, rot: 3, flip: true }],
        nowhere: [{ id: 'a', gx: 0, gy: 0, rot: 0, flip: false }], kitchen: 'bad',
      },
      themes: { living: { wall: 'sage', floor: 'oak' }, kitchen: { wall: 5 }, bogus: { wall: 'a', floor: 'b' } },
      pet: { name: 'x'.repeat(50), outfit: 7, treats: 1e9 },
      chill: { minutes: -4, sessions: 'a' },
      collection: ['a', 'a', 3, '', 'b'],
    });
    expect(p.builder).toEqual({ living: [{ id: 'a', gx: 1, gy: 2, rot: 0, flip: false }, { id: 'b', gx: 64, gy: -64, rot: 3, flip: true }] });
    expect(p.themes).toEqual({ living: { wall: 'sage', floor: 'oak' } });
    expect(p.pet).toEqual({ name: 'Biscuit', outfit: null, treats: 99 });
    expect(p.chill).toEqual({ minutes: 0, sessions: 0 });
    expect(p.collection).toEqual(['a', 'b']);
  });

  it('a corrupt or oversized resume snapshot falls back to null, never crashes', () => {
    const good = { v: 1, scenarioId: 's', mode: 'daily', seed: 7.9, state: {} };
    expect(migrate({ version: 4, resume: good }).resume).toEqual({ ...good, seed: 7 });
    for (const bad of [null, 'x', 5, [], { ...good, v: 2 }, { ...good, mode: 'blitz' }, { ...good, state: 'no' }, { ...good, scenarioId: '' },
      { ...good, seed: Infinity }, { ...good, state: { blob: 'y'.repeat(250_000) } }]) {
      expect(migrate({ version: 4, resume: bad }).resume).toBeNull();
    }
  });

  it('future versions are read field by field, never trusted wholesale', () => {
    const p = migrate({ ...v3, version: 99, coins: 5, pet: { name: 'Zed' }, newThing: { a: 1 } });
    expect(p.version).toBe(4);
    expect(p.coins).toBe(5);
    expect(p.pet.name).toBe('Zed');
    expect('newThing' in p).toBe(false);
  });

  it('new room ids are valid in unlockedRooms; unknown ids are dropped', () => {
    const p = migrate({ ...v3, unlockedRooms: ['entrance', 'laundry', 'garden', 'attic'] });
    expect(p.unlockedRooms).toEqual(expect.arrayContaining(['laundry', 'garden']));
    expect(p.unlockedRooms).not.toContain('attic');
  });
});
