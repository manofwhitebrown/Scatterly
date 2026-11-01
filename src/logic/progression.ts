import { DECOR, storageSpot } from '../content/decor';
import { HOUSE } from '../content/house';
import type {
  DecorView, ItemId, PlayerProfile, RunResult, Spot, SpotId,
} from '../shared/types';

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

export function listDecor(profile: PlayerProfile): DecorView[] {
  return DECOR.map((def) => {
    const owned = profile.owned.includes(def.id);
    const locked = profile.day < def.unlockDay || !profile.unlockedRooms.includes(def.room);
    return { def, owned, locked, canBuy: !owned && !locked && profile.coins >= def.price };
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
  return {
    ...profile,
    day, streak, lastDailyDate, unlockedRooms,
    coins: profile.coins + r.coinsEarned,
    bestStars: { ...profile.bestStars, [r.scenarioId]: (r.stars > prev ? r.stars : prev) as 0 | 1 | 2 | 3 },
  };
}
