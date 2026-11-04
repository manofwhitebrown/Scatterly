import { ROOM_ORDER } from '../shared/types';
import type { GameMode, PlacedPiece, PlayerProfile, ProfileSettings, Quality, RoomId, SessionLength } from '../shared/types';
import type { SessionSnapshot } from '../logic/snapshot';

/** Validators for the v4 profile fields. Stored data is never trusted: every field falls back to its default. */
type Rec = Record<string, unknown>;

const MODES: readonly GameMode[] = ['rush', 'relaxed', 'daily'];
const QUALITIES: readonly Quality[] = ['auto', 'low', 'high'];
const LENGTHS: readonly SessionLength[] = ['short', 'standard', 'long'];
const MAX_PIECES_PER_ROOM = 200;
const MAX_COLLECTION = 500;
const MAX_SNAPSHOT_CHARS = 200_000;

export const DEFAULT_SETTINGS: ProfileSettings = {
  sfx: true, music: true, vibration: true, lowFx: false, reducedMotion: false,
  quality: 'auto', musicVol: 0.7, sfxVol: 0.8, ambienceVol: 0.6, ambience: 'auto',
  matchClock: false, walkAnim: true, sessionLength: 'standard', showLockIcons: false,
};
export const DEFAULT_PET: PlayerProfile['pet'] = { name: 'Biscuit', outfit: null, treats: 0 };

export const isRecord = (v: unknown): v is Rec => typeof v === 'object' && v !== null && !Array.isArray(v);
const whole = (v: unknown, min: number, max: number, fb: number): number =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, Math.floor(v))) : fb;
const unit = (v: unknown, fb: number): number =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : fb;
const bool = (v: unknown, fb: boolean): boolean => (typeof v === 'boolean' ? v : fb);
const text = (v: unknown, max: number): string | null => (typeof v === 'string' && v.length > 0 && v.length <= max ? v : null);
const isRoom = (k: string): k is RoomId => (ROOM_ORDER as readonly string[]).includes(k);

export function sanitizeSettings(raw: unknown): ProfileSettings {
  const s: Rec = isRecord(raw) ? raw : {};
  const d = DEFAULT_SETTINGS;
  const q = s.quality, l = s.sessionLength;
  return {
    sfx: bool(s.sfx, d.sfx), music: bool(s.music, d.music), vibration: bool(s.vibration, d.vibration),
    lowFx: bool(s.lowFx, d.lowFx), reducedMotion: bool(s.reducedMotion, d.reducedMotion),
    quality: QUALITIES.find((x) => x === q) ?? d.quality,
    musicVol: unit(s.musicVol, d.musicVol), sfxVol: unit(s.sfxVol, d.sfxVol), ambienceVol: unit(s.ambienceVol, d.ambienceVol),
    ambience: text(s.ambience, 40) ?? d.ambience,
    matchClock: bool(s.matchClock, d.matchClock), walkAnim: bool(s.walkAnim, d.walkAnim),
    sessionLength: LENGTHS.find((x) => x === l) ?? d.sessionLength,
    showLockIcons: bool(s.showLockIcons, d.showLockIcons),
  };
}

function sanitizePiece(raw: unknown): PlacedPiece | null {
  if (!isRecord(raw)) return null;
  const id = text(raw.id, 80);
  const r = raw.rot;
  if (!id || typeof raw.gx !== 'number' || typeof raw.gy !== 'number') return null;
  if (!Number.isFinite(raw.gx) || !Number.isFinite(raw.gy)) return null;
  const rot = r === 1 || r === 2 || r === 3 ? r : 0;
  return { id, gx: whole(raw.gx, -64, 64, 0), gy: whole(raw.gy, -64, 64, 0), rot, flip: raw.flip === true };
}

export function sanitizeBuilder(raw: unknown): PlayerProfile['builder'] {
  const out: PlayerProfile['builder'] = {};
  if (!isRecord(raw)) return out;
  for (const [room, list] of Object.entries(raw)) {
    if (!isRoom(room) || !Array.isArray(list)) continue;
    const pieces: PlacedPiece[] = [];
    for (const p of list) {
      if (pieces.length >= MAX_PIECES_PER_ROOM) break;
      const piece = sanitizePiece(p);
      if (piece) pieces.push(piece);
    }
    out[room] = pieces;
  }
  return out;
}

export function sanitizeThemes(raw: unknown): PlayerProfile['themes'] {
  const out: PlayerProfile['themes'] = {};
  if (!isRecord(raw)) return out;
  for (const [room, t] of Object.entries(raw)) {
    if (!isRoom(room) || !isRecord(t)) continue;
    const wall = text(t.wall, 40), floor = text(t.floor, 40);
    if (wall && floor) out[room] = { wall, floor };
  }
  return out;
}

export function sanitizePet(raw: unknown): PlayerProfile['pet'] {
  if (!isRecord(raw)) return { ...DEFAULT_PET };
  return {
    name: text(raw.name, 24) ?? DEFAULT_PET.name,
    outfit: text(raw.outfit, 40),
    treats: whole(raw.treats, 0, 99, 0),
  };
}

export function sanitizeChill(raw: unknown): PlayerProfile['chill'] {
  const r: Rec = isRecord(raw) ? raw : {};
  return { minutes: whole(r.minutes, 0, 1_000_000, 0), sessions: whole(r.sessions, 0, 1_000_000, 0) };
}

export function sanitizeCollection(raw: unknown): string[] {
  const out: string[] = [];
  if (!Array.isArray(raw)) return out;
  for (const id of raw) {
    if (out.length >= MAX_COLLECTION) break;
    const t = text(id, 80);
    if (t && !out.includes(t)) out.push(t);
  }
  return out;
}

/** A snapshot that does not parse as the expected shape (or is huge) is dropped: the player gets a fresh case. */
export function sanitizeResume(raw: unknown): SessionSnapshot | null {
  if (!isRecord(raw) || raw.v !== 1 || !isRecord(raw.state)) return null;
  const scenarioId = text(raw.scenarioId, 120);
  const mode = MODES.find((m) => m === raw.mode);
  if (!scenarioId || !mode || typeof raw.seed !== 'number' || !Number.isFinite(raw.seed)) return null;
  try {
    if (JSON.stringify(raw.state).length > MAX_SNAPSHOT_CHARS) return null;
  } catch {
    return null;
  }
  return { v: 1, scenarioId, mode, seed: Math.floor(raw.seed), state: raw.state };
}
