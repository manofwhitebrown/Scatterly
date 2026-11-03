import { describe, expect, it } from 'vitest';
import { replayScript } from '../src/logic/replay';
import { foundBeats, planBeats } from '../src/scenes/replayPlan';
import { fallbackScenario } from '../src/logic/generator';
import { HOUSE_MAP } from '../src/content/layout';
import type { RoomId } from '../src/shared/types';

const centre = Object.fromEntries(HOUSE_MAP.map((s, i) => [s.room, { x: i * 100, y: s.floor * 50 }])) as Record<RoomId, { x: number; y: number }>;

describe('evening replay plan', () => {
  const sc = fallbackScenario(12345, 'relaxed');
  const steps = replayScript(sc, { found: sc.targets });
  const beats = planBeats(steps, centre);
  it('one beat per step, in time order, first has no origin', () => {
    expect(beats).toHaveLength(steps.length);
    expect(beats[0]!.from).toBeNull();
    for (let i = 1; i < beats.length; i++) expect(beats[i]!.atMs).toBeGreaterThanOrEqual(beats[i - 1]!.atMs);
  });
  it('walks only on room change, at most 600 ms', () => {
    beats.forEach((b, i) => {
      if (i === 0) return expect(b.walkMs).toBe(0);
      const moved = steps[i]!.room !== steps[i - 1]!.room;
      expect(b.walkMs).toBe(moved ? 600 : 0);
    });
  });
  it('found beats are exactly the found steps', () => {
    expect(foundBeats(beats).every((b) => b.step.found)).toBe(true);
  });
});
