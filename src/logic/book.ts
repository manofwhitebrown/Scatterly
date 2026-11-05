import { PUZZLE_NAME } from '../content/puzzleNames';
import { ENABLED } from '../content/puzzleRoster';
import { ITEM_LABEL, PUZZLE_KINDS } from '../shared/types';
import type { GameMode, ItemId, PlayerProfile, PuzzleKind } from '../shared/types';
import { ACHIEVEMENTS } from './achievements';
import { PUZZLES } from './puzzles';
import type { GameSession } from './session';

/** One Puzzle Book card. Everything is derived from the saved profile; nothing is stored twice. */
export interface PuzzleBookEntry {
  kind: PuzzleKind;
  name: string;
  /** The generator may use it (or the player already played it). */
  unlocked: boolean;
  /** The player has opened this kind at least once. */
  seen: boolean;
  solved: number;
  skipped: number;
  /** Best time in ms, or null before the first clean solve. */
  bestMs: number | null;
  /** What a pro needs for a standard (level 2) puzzle of this kind, in ms; null for kinds without a generator. */
  parMs: number | null;
  /** bestMs is at or under parMs. */
  beatPar: boolean;
  /** Whole percent of attempts that were skipped, or null before any attempt. */
  skipPct: number | null;
}

const PAR_LEVEL = 2;

/** One entry per puzzle kind in PUZZLE_KINDS order. Pure; never mutates the profile. */
export function puzzleBook(profile: PlayerProfile, enabled: readonly PuzzleKind[] = ENABLED): PuzzleBookEntry[] {
  return PUZZLE_KINDS.map((kind) => {
    const s = profile.puzzles[kind];
    const solved = s?.solved ?? 0, skipped = s?.skipped ?? 0, tries = solved + skipped;
    const bestMs = s?.bestMs ?? null;
    const def = kind in PUZZLES ? PUZZLES[kind as keyof typeof PUZZLES] : undefined;
    const parMs = def ? def.parSeconds(PAR_LEVEL) * 1000 : null;
    return {
      kind, name: PUZZLE_NAME[kind], unlocked: enabled.includes(kind) || tries > 0 || !!s?.seen,
      seen: !!s?.seen || tries > 0, solved, skipped, bestMs, parMs,
      beatPar: bestMs !== null && parMs !== null && bestMs <= parMs,
      skipPct: tries > 0 ? Math.round((skipped / tries) * 100) : null,
    };
  });
}

export interface AchievementView {
  id: string; name: string; desc: string; earned: boolean;
  /** Progress n of m; n === m when earned. Run-based achievements show 0/1 until earned. */
  n: number; m: number;
}

/** Every achievement in display order with progress for the Achievements screen. */
export function achievements(profile: PlayerProfile): AchievementView[] {
  return ACHIEVEMENTS.map((a) => {
    const earned = profile.achievements.includes(a.id);
    const [n, m] = a.progress ? a.progress(profile) : [0, 1];
    const cap = Math.max(1, m);
    return { id: a.id, name: a.name, desc: a.desc, earned, n: earned ? cap : Number.isFinite(n) ? Math.max(0, Math.min(cap, Math.floor(n))) : 0, m: cap };
  });
}

export interface ResultSummary {
  mode: GameMode;
  complete: boolean;
  timedOut: boolean;
  stars: 0 | 1 | 2 | 3;
  coins: number;
  searches: number;
  /** Searches a sharp player needs; 3 stars need at most 125% of it and no hints. */
  parSearches: number;
  hintsUsed: number;
  timeMs: number;
  found: Array<{ id: ItemId; label: string }>;
  missed: Array<{ id: ItemId; label: string }>;
}

/** Numbers for the result screen. Pure: it reads the session and does not change it, so the scene may still call `finish`. */
export function resultSummary(session: GameSession, timeMs: number, timedOut = false): ResultSummary {
  const r = session.finish(timeMs, timedOut);
  const label = (id: ItemId): { id: ItemId; label: string } => ({ id, label: ITEM_LABEL[id] });
  return {
    mode: session.mode, complete: session.isComplete() && !timedOut, timedOut, stars: r.stars, coins: r.coinsEarned,
    searches: r.searches, parSearches: session.scenario.parSearches, hintsUsed: r.hintsUsed, timeMs,
    found: r.found.map(label), missed: session.remainingTargets().map(label),
  };
}
