import { DECOR, storageSpot } from '../content/decor';
import { HOUSE, MAX_SPOTS_PER_ROOM } from '../content/house';
import type {
  DecorDef, DecorView, ItemId, PlayerProfile, PuzzleStat, RunResult, Spot, SpotId,
} from '../shared/types';
import { earnedAchievements } from './achievements';

/** HOUSE plus every owned storage decor (which becomes a real spot). */
export function allSpots(profile: PlayerProfile): Spot[] {
  const out = HOUSE.slice();
  for (const d of DECOR) {
    if (d.kind !== 'storage' || !profile.owned.includes(d.id)) continue;
    const s = storageSpot(d);
    if (s) out.push(s);
  }
  return out;
}

/** Interactive pieces currently in a room: house spots plus owned storage. */
export function spotCount(profile: PlayerProfile, room: Spot['room']): number {
  return allSpots(profile).filter((s) => s.room === room).length;
}

/** True when buying `def` would push its room over MAX_SPOTS_PER_ROOM (cosmetics never do). */
export function roomFull(profile: PlayerProfile, def: DecorDef): boolean {
  return def.kind === 'storage' && spotCount(profile, def.room) >= MAX_SPOTS_PER_ROOM;
}

export function listDecor(profile: PlayerProfile): DecorView[] {
  return DECOR.map((def) => {
    const owned = profile.owned.includes(def.id);
    const locked = profile.day < def.unlockDay || !profile.unlockedRooms.includes(def.room);
    const canBuy = !owned && !locked && profile.coins >= def.price && !roomFull(profile, def);
    return { def, owned, locked, canBuy };
  });
}

export function buyDecor(profile: PlayerProfile, id: string): PlayerProfile | null {
  const view = listDecor(profile).find((v) => v.def.id === id);
  if (!view || !view.canBuy) return null;
  return { ...profile, coins: profile.coins - view.def.price, owned: [...profile.owned, id] };
}

export function homeSpotCandidates(profile: PlayerProfile, item: ItemId): Spot[] {
  return allSpots(profile).filter((s) => profile.unlockedRooms.includes(s.room) && s.plausible.includes(item));
}

export function setHomeSpot(profile: PlayerProfile, item: ItemId, spot: SpotId | null): PlayerProfile {
  const homeSpots = { ...profile.homeSpots };
  if (spot === null) {
    delete homeSpots[item];
  } else {
    if (!homeSpotCandidates(profile, item).some((s) => s.id === spot)) return profile;
    homeSpots[item] = spot;
  }
  return { ...profile, homeSpots };
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function localDateString(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function yesterdayOf(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return localDateString(new Date(y ?? 1970, (m ?? 1) - 1, (d ?? 1) - 1));
}

/** Folds a finished run into the profile. `today` is injectable for tests. */
export function applyRun(profile: PlayerProfile, r: RunResult, today: string = localDateString()): PlayerProfile {
  const day = profile.day + 1;
  let streak = profile.streak;
  let lastDailyDate = profile.lastDailyDate;
  if (r.mode === 'daily' && r.stars > 0 && lastDailyDate !== today) {
    streak = lastDailyDate === yesterdayOf(today) ? streak + 1 : 1;
    lastDailyDate = today;
  }
  const prev = profile.bestStars[r.scenarioId] ?? 0;
  const unlockedRooms = day >= 6 && !profile.unlockedRooms.includes('bathroom')
    ? [...profile.unlockedRooms, 'bathroom' as const]
    : profile.unlockedRooms.slice();
  // Per-kind mastery from the puzzle log. A skipped puzzle never counts as solved.
  const puzzles: Record<string, PuzzleStat> = {};
  for (const [k, v] of Object.entries(profile.puzzles)) puzzles[k] = { ...v };
  let solvedNow = 0;
  for (const e of r.puzzleLog) {
    const st = puzzles[e.kind] ?? { solved: 0, skipped: 0, bestMs: null };
    if (e.skipped) st.skipped++;
    else if (e.solved) {
      st.solved++;
      solvedNow++;
      if (e.ms > 0 && (st.bestMs === null || e.ms < st.bestMs)) st.bestMs = e.ms;
    }
    puzzles[e.kind] = st;
  }
  const complete = r.stars > 0;
  const stats = {
    mornings: profile.stats.mornings + 1,
    perfect: profile.stats.perfect + (r.stars === 3 ? 1 : 0),
    itemsFound: profile.stats.itemsFound + r.found.length,
    hintsUsed: profile.stats.hintsUsed + r.hintsUsed,
    puzzlesSolved: profile.stats.puzzlesSolved + solvedNow,
    bestStreak: Math.max(profile.stats.bestStreak, streak),
    fastestMs: complete && r.timeMs > 0 ? (profile.stats.fastestMs === null ? r.timeMs : Math.min(profile.stats.fastestMs, r.timeMs)) : profile.stats.fastestMs,
  };
  const newWeek = profile.weekMorning >= 6;
  const next: PlayerProfile = {
    ...profile,
    day, streak, lastDailyDate, unlockedRooms, puzzles, stats,
    weekMorning: newWeek ? 1 : profile.weekMorning + 1,
    weekStars: (newWeek ? 0 : profile.weekStars) + r.stars,
    coins: profile.coins + r.coinsEarned,
    bestStars: { ...profile.bestStars, [r.scenarioId]: (r.stars > prev ? r.stars : prev) as 0 | 1 | 2 | 3 },
  };
  const earned = earnedAchievements(profile, next, r);
  return earned.length > 0 ? { ...next, achievements: [...next.achievements, ...earned] } : next;
}
