import type Phaser from 'phaser';
import { ITEM_IDS, ROOM_ORDER } from '../shared/types';
import { SAVE_VERSION } from '../shared/types';
import type { ItemId, PlayerProfile, ProfileStats, RoomId, SpotId } from '../shared/types';

const STORAGE_KEY = 'scatterly.profile.v1'; // key kept so v1 saves are found and migrated in place
const MAX_ACHIEVEMENTS = 200;
const WRITE_DELAY_MS = 300;
const DEFAULT_ROOMS: RoomId[] = ['entrance', 'living', 'kitchen', 'bedroom'];

export function defaultProfile(): PlayerProfile {
  return {
    version: SAVE_VERSION,
    day: 1,
    coins: 0,
    streak: 0,
    lastDailyDate: null,
    unlockedRooms: DEFAULT_ROOMS.slice(),
    owned: [],
    homeSpots: {},
    bestStars: {},
    tutorialDone: false,
    stats: defaultStats(),
    achievements: [],
    weekMorning: 0,
    weekStars: 0,
    settings: { sfx: true, music: true, vibration: true, lowFx: false, reducedMotion: false },
  };
}

export function defaultStats(): ProfileStats {
  return { mornings: 0, perfect: 0, itemsFound: 0, hintsUsed: 0, puzzlesSolved: 0, bestStreak: 0, fastestMs: null };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function wholeNumber(v: unknown, min: number, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? Math.max(min, Math.floor(v)) : fallback;
}

function bool(v: unknown, fallback: boolean): boolean {
  return typeof v === 'boolean' ? v : fallback;
}

function isRoomId(v: unknown): v is RoomId {
  return typeof v === 'string' && (ROOM_ORDER as readonly string[]).includes(v);
}

function isItemId(v: unknown): v is ItemId {
  return typeof v === 'string' && (ITEM_IDS as readonly string[]).includes(v);
}

function sanitizeStats(raw: unknown): ProfileStats {
  const d = defaultStats();
  if (!isRecord(raw)) return d;
  const f = raw.fastestMs;
  return {
    mornings: wholeNumber(raw.mornings, 0, d.mornings),
    perfect: wholeNumber(raw.perfect, 0, d.perfect),
    itemsFound: wholeNumber(raw.itemsFound, 0, d.itemsFound),
    hintsUsed: wholeNumber(raw.hintsUsed, 0, d.hintsUsed),
    puzzlesSolved: wholeNumber(raw.puzzlesSolved, 0, d.puzzlesSolved),
    bestStreak: wholeNumber(raw.bestStreak, 0, d.bestStreak),
    fastestMs: typeof f === 'number' && Number.isFinite(f) && f >= 0 ? Math.floor(f) : null,
  };
}

/**
 * Migrates any stored value to the current version. v1 -> v2 keeps all progress and fills new
 * fields with defaults. Future versions (> SAVE_VERSION) are read field-by-field, never trusted
 * wholesale. Anything that is not an object yields a fresh profile. Never throws.
 */
export function migrate(raw: unknown): PlayerProfile {
  return sanitize(raw);
}

/** Field-by-field validation: stored data is never trusted, every field falls back to its default. */
function sanitize(raw: unknown): PlayerProfile {
  const d = defaultProfile();
  if (!isRecord(raw)) return d;

  const rooms = new Set<RoomId>(DEFAULT_ROOMS);
  if (Array.isArray(raw.unlockedRooms)) {
    for (const r of raw.unlockedRooms) if (isRoomId(r)) rooms.add(r);
  }

  const owned: string[] = [];
  if (Array.isArray(raw.owned)) {
    for (const id of raw.owned) {
      if (typeof id === 'string' && id.length > 0 && id.length < 80 && !owned.includes(id)) owned.push(id);
    }
  }

  const homeSpots: Partial<Record<ItemId, SpotId>> = {};
  if (isRecord(raw.homeSpots)) {
    for (const [k, v] of Object.entries(raw.homeSpots)) {
      if (isItemId(k) && typeof v === 'string' && v.length > 0 && v.length < 80) homeSpots[k] = v;
    }
  }

  const bestStars: Record<string, 0 | 1 | 2 | 3> = {};
  if (isRecord(raw.bestStars)) {
    for (const [k, v] of Object.entries(raw.bestStars)) {
      if (v === 0 || v === 1 || v === 2 || v === 3) bestStars[k] = v;
    }
  }

  const achievements: string[] = [];
  if (Array.isArray(raw.achievements)) {
    for (const id of raw.achievements) {
      if (achievements.length >= MAX_ACHIEVEMENTS) break;
      if (typeof id === 'string' && id.length > 0 && id.length < 80 && !achievements.includes(id)) achievements.push(id);
    }
  }

  const s = isRecord(raw.settings) ? raw.settings : {};
  const last = raw.lastDailyDate;

  return {
    version: SAVE_VERSION,
    day: wholeNumber(raw.day, 1, d.day),
    coins: wholeNumber(raw.coins, 0, d.coins),
    streak: wholeNumber(raw.streak, 0, d.streak),
    lastDailyDate: typeof last === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(last) ? last : null,
    unlockedRooms: ROOM_ORDER.filter((r) => rooms.has(r)),
    owned,
    homeSpots,
    bestStars,
    tutorialDone: bool(raw.tutorialDone, d.tutorialDone),
    stats: sanitizeStats(raw.stats),
    achievements,
    weekMorning: Math.min(6, wholeNumber(raw.weekMorning, 0, 0)),
    weekStars: wholeNumber(raw.weekStars, 0, 0),
    settings: {
      sfx: bool(s.sfx, d.settings.sfx),
      music: bool(s.music, d.settings.music),
      vibration: bool(s.vibration, d.settings.vibration),
      lowFx: bool(s.lowFx, d.settings.lowFx),
      reducedMotion: bool(s.reducedMotion, d.settings.reducedMotion),
    },
  };
}

/** Never throws. Missing, corrupt or older data is repaired field-by-field. */
export function loadProfile(): PlayerProfile {
  try {
    const text = window.localStorage.getItem(STORAGE_KEY);
    if (!text) return defaultProfile();
    return sanitize(JSON.parse(text) as unknown);
  } catch {
    return defaultProfile();
  }
}

let pending: PlayerProfile | null = null;
let timer: number | null = null;
let listening = false;

/** Writes any pending profile to localStorage immediately. Safe to call at any time. */
export function flushProfile(): void {
  if (timer !== null) {
    window.clearTimeout(timer);
    timer = null;
  }
  if (!pending) return;
  const p = pending;
  pending = null;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    // Storage full or blocked (private mode): the game keeps running from the registry.
  }
}

function listenForExit(): void {
  if (listening) return;
  listening = true;
  window.addEventListener('pagehide', flushProfile);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) flushProfile();
  });
}

/** Sets registry key 'profile' immediately; persists to localStorage debounced (<= 1 write / 300 ms). */
export function commitProfile(game: Phaser.Game, p: PlayerProfile): void {
  game.registry.set('profile', p);
  pending = p;
  listenForExit();
  if (timer === null) timer = window.setTimeout(flushProfile, WRITE_DELAY_MS);
}
