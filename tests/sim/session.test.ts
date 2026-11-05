import { describe, expect, it } from 'vitest';
import { defaultProfile } from '../../src/core/save';
import { generateCase } from '../../src/logic/generator';
import { LEGACY_ROOMS } from '../../src/shared/types';
import type { PlayerProfile, Scenario, SessionLength } from '../../src/shared/types';
import { CASUAL, EXPERT, playSession } from './session';

/** Deterministic sampling: seeds 1..N, N small enough to keep `npm test` fast (each config runs in well under a second). */
const N = 30;
const profile = (day: number, length: SessionLength = 'standard'): PlayerProfile => ({
  ...defaultProfile(), day, unlockedRooms: [...LEGACY_ROOMS, 'study'],
  settings: { ...defaultProfile().settings, sessionLength: length },
});
const cases = (p: PlayerProfile): Scenario[] => Array.from({ length: N }, (_, i) => generateCase(i + 1, 'relaxed', p));
const minutes = (p: PlayerProfile, model = CASUAL): number[] =>
  cases(p).map((s, i) => playSession(s, p, model, i + 1).seconds / 60);
const median = (a: number[]): number => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)] as number;

describe('session sim (casual bot, documented time model in session.ts)', () => {
  it('the bot finishes every case, and the same inputs give the same time', () => {
    const p = profile(5);
    for (const [i, s] of cases(p).entries()) {
      const a = playSession(s, p, CASUAL, i + 1), b = playSession(s, p, CASUAL, i + 1);
      expect(a.finished, s.id).toBe(true);
      expect(a).toEqual(b);
    }
  });
  it('an expert is clearly faster than a casual player on the same case', () => {
    const p = profile(5);
    expect(median(minutes(p, EXPERT))).toBeLessThan(median(minutes(p, CASUAL)) * 0.7);
  });
  it('time grows with the day ramp (day 3 < day 4 < day 5) and with session length (short < standard < long)', () => {
    const d = [3, 4, 5].map((day) => median(minutes(profile(day))));
    expect(d[0]).toBeLessThan(d[1] as number);
    expect(d[1]).toBeLessThan(d[2] as number);
    const l = (['short', 'standard', 'long'] as const).map((len) => median(minutes(profile(5, len))));
    expect(l[0]).toBeLessThan(l[1] as number);
    expect(l[2]).toBeGreaterThan((l[1] as number) * 1.15); // long must be visibly longer, not just not shorter
  });
  it('gentle days stay gentle: day 1 and day 2 cases take a casual player at most 10 and 15 minutes at the median', () => {
    expect(median(minutes(profile(1)))).toBeLessThanOrEqual(10);
    expect(median(minutes(profile(2)))).toBeLessThanOrEqual(15);
  });
});

describe('session length contract', () => {
  /**
   * The contract: the median Standard case from day 5 takes a casual player 25-35 minutes.
   * The case, not the time model, was changed to meet it: scaled cases chain more path gates (2 extra stages from 20 minutes),
   * the finale chains from 25 minutes, and code locks may be compound. Puzzle levels 4-5 are not in play yet (Gate has no level
   * field), so this window holds at levels 1-3; levels would add margin.
   */
  it('median Standard case from day 5 takes a casual player 25-35 minutes', () => {
    for (const day of [5, 8, 12]) {
      const m = median(minutes(profile(day)));
      expect(m, `day ${day}`).toBeGreaterThanOrEqual(25);
      expect(m, `day ${day}`).toBeLessThanOrEqual(35);
    }
  });
});
