import { PUZZLES } from './puzzles';
import type { PlayerProfile, PuzzleKind, RunResult } from '../shared/types';

export interface AchievementDef { id: string; name: string; desc: string; test: (after: PlayerProfile, r: RunResult) => boolean }

const solvedKinds = (p: PlayerProfile): number => Object.values(p.puzzles).filter((s) => s.solved > 0).length;
const TIER1 = Object.entries(PUZZLES).filter(([, d]) => d.tier === 1).map(([k]) => k as PuzzleKind);

/** Order is display order. Ids are stable (they are saved). */
export const ACHIEVEMENTS: readonly AchievementDef[] = [
  { id: 'first-morning', name: 'First Morning', desc: 'Finish your first morning.', test: (p) => p.stats.mornings >= 1 },
  { id: 'ten-mornings', name: 'Creature of Habit', desc: 'Finish 10 mornings.', test: (p) => p.stats.mornings >= 10 },
  { id: 'thirty-mornings', name: 'Home Sweet Home', desc: 'Finish 30 mornings.', test: (p) => p.stats.mornings >= 30 },
  { id: 'sharp-eye', name: 'Sharp Eye', desc: 'Three stars with no hints.', test: (_p, r) => r.stars === 3 && r.hintsUsed === 0 },
  { id: 'perfect-five', name: 'Five Perfect', desc: 'Earn three stars on 5 mornings.', test: (p) => p.stats.perfect >= 5 },
  { id: 'streak-3', name: 'Three in a Row', desc: 'A daily streak of 3.', test: (p) => p.streak >= 3 },
  { id: 'streak-7', name: 'Week Warrior', desc: 'A daily streak of 7.', test: (p) => p.streak >= 7 },
  { id: 'finder-50', name: 'Lost and Found', desc: 'Find 50 belongings.', test: (p) => p.stats.itemsFound >= 50 },
  { id: 'habit-keeper', name: 'Habit Keeper', desc: 'Find something where you always keep it.', test: (_p, r) => r.habitHits.length > 0 },
  { id: 'first-puzzle', name: 'Lock Picker', desc: 'Solve your first puzzle.', test: (p) => p.stats.puzzlesSolved >= 1 },
  { id: 'puzzles-25', name: 'Puzzle Fan', desc: 'Solve 25 puzzles.', test: (p) => p.stats.puzzlesSolved >= 25 },
  { id: 'puzzles-100', name: 'Puzzle Master', desc: 'Solve 100 puzzles.', test: (p) => p.stats.puzzlesSolved >= 100 },
  { id: 'kinds-3', name: 'Variety Pack', desc: 'Solve 3 different kinds of puzzle.', test: (p) => solvedKinds(p) >= 3 },
  { id: 'kinds-all', name: 'Collector', desc: 'Solve every basic kind of puzzle.', test: (p) => TIER1.every((k) => (p.puzzles[k]?.solved ?? 0) > 0) },
  {
    id: 'quick-fingers', name: 'Quick Fingers', desc: 'Solve a puzzle faster than a pro.',
    test: (_p, r) => r.puzzleLog.some((e) => e.solved && !e.skipped && e.kind in PUZZLES && e.ms > 0 && e.ms <= PUZZLES[e.kind as keyof typeof PUZZLES].parSeconds(1) * 1000 * 0.5),
  },
];

/** Ids earned by this run that the player did not have before. */
export function earnedAchievements(before: PlayerProfile, after: PlayerProfile, r: RunResult): string[] {
  return ACHIEVEMENTS.filter((a) => !before.achievements.includes(a.id) && a.test(after, r)).map((a) => a.id);
}
