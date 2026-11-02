import { ACHIEVEMENTS } from '../logic/achievements';

export interface AchievementRow { id: string; name: string; desc: string; earned: boolean }

/** Every achievement in display order, earned ones flagged. Unknown saved ids are ignored. */
export function achievementRows(earnedIds: readonly string[]): AchievementRow[] {
  const have = new Set(earnedIds);
  return ACHIEVEMENTS.map((a) => ({ id: a.id, name: a.name, desc: a.desc, earned: have.has(a.id) }));
}

/** Earned first (in display order), then locked. Used for the "x / y" header. */
export function achievementCount(earnedIds: readonly string[]): { earned: number; total: number } {
  return { earned: achievementRows(earnedIds).filter((r) => r.earned).length, total: ACHIEVEMENTS.length };
}
