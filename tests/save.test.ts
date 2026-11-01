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
    expect(p.settings).toEqual({ sfx: false, music: true, vibration: true, lowFx: true, reducedMotion: false });
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
});
