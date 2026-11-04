import { describe, expect, it } from 'vitest';
import { LEGACY_ROOMS } from '../src/shared/types';
import { defaultProfile } from '../src/core/save';
import { anySpot } from '../src/content/decor';
import { generateScenario } from '../src/logic/generator';
import { applyRun } from '../src/logic/progression';
import { solveScenario } from '../src/logic/solver';
import { validateScenario } from '../src/logic/validator';
import type { PlayerProfile, RunResult, Scenario } from '../src/shared/types';

const withStudy = (day: number): PlayerProfile => ({ ...defaultProfile(), day, unlockedRooms: [...LEGACY_ROOMS, 'study'] });
const inStudy = (s: Scenario) => Object.values(s.placement).filter((id) => id?.startsWith('study.')).length;

describe('study in the case pool', () => {
  it('study templates run, put items in the study, validate and solve', () => {
    let withItems = 0;
    for (let seed = 1; seed <= 400; seed++) {
      const p = withStudy(14);
      const s = generateScenario(seed, 'relaxed', p);
      expect(validateScenario(s, p), `${s.id}`).toEqual([]);
      expect(solveScenario(s).ok, `${s.id}`).toBe(true);
      if (inStudy(s) > 0) withItems++;
    }
    expect(withItems).toBeGreaterThan(20);
  });

  it('nothing is placed in the study before it is unlocked', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const s = generateScenario(seed, 'relaxed', { ...defaultProfile(), day: 8, unlockedRooms: [...LEGACY_ROOMS] });
      expect(inStudy(s)).toBe(0);
    }
  });

  it('study spots exist, are tagged to the room and include lockable containers', () => {
    const ids = ['cabinet', 'drawerL', 'drawerR', 'desk', 'papers', 'sofa'].map((n) => anySpot(`study.${n}`));
    expect(ids.every((x) => x?.room === 'study')).toBe(true);
    expect(anySpot('study.cabinet')?.lockable).toBe(true);
    expect(anySpot('study.drawerL')?.lockable).toBe(true);
  });

  it('progression unlocks the study when day 12 is reached, and not before', () => {
    const run: RunResult = { scenarioId: 's', mode: 'relaxed', targets: ['keys'], found: ['keys'], timeMs: 1, searches: 1, hintsUsed: 0,
      timedOut: false, stars: 3, coinsEarned: 0, habitHits: [], newAchievements: [], puzzleLog: [] };
    const before = applyRun({ ...defaultProfile(), day: 10 }, run);
    expect(before.unlockedRooms).not.toContain('study');
    const at = applyRun({ ...defaultProfile(), day: 11 }, run);
    expect(at.unlockedRooms).toContain('study');
    expect(at.unlockedRooms).toContain('bathroom');
  });
});
