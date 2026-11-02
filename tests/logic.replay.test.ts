import { describe, expect, it } from 'vitest';
import { defaultProfile } from '../src/core/save';
import { generateScenario, guidedScenario } from '../src/logic/generator';
import { replayDuration, replayScript } from '../src/logic/replay';
import type { GameMode, ItemId } from '../src/shared/types';

const MODES: GameMode[] = ['rush', 'relaxed', 'daily'];
const profile = (day: number) => ({ ...defaultProfile(), day, unlockedRooms: ['entrance', 'living', 'kitchen', 'bedroom', 'bathroom'] as const });

describe('replayScript', () => {
  it('ends where every item ended up, for 600 scenarios', () => {
    for (let seed = 1; seed <= 600; seed++) {
      const sc = generateScenario(seed * 31, MODES[seed % 3] as GameMode, { ...profile(1 + (seed % 14)), unlockedRooms: [...profile(1).unlockedRooms] });
      const steps = replayScript(sc);
      const lastSpot = new Map<ItemId, string | undefined>();
      for (const s of steps) if (s.itemId) lastSpot.set(s.itemId, s.spotId);
      for (const [item, spot] of Object.entries(sc.placement) as Array<[ItemId, string]>) {
        if (lastSpot.has(item)) expect(lastSpot.get(item), `${seed} ${item}`).toBe(spot);
      }
      for (const t of sc.targets) expect(lastSpot.get(t), `${seed} target ${t} never placed`).toBe(sc.placement[t]);
    }
  });

  it('has one step per evening step, increasing time, valid rooms and icons', () => {
    const sc = generateScenario(7, 'relaxed', { ...profile(6), unlockedRooms: [...profile(6).unlockedRooms] });
    const steps = replayScript(sc);
    expect(steps.length).toBe(sc.evening.length);
    for (let i = 1; i < steps.length; i++) expect((steps[i] as typeof steps[0]).t).toBeGreaterThan((steps[i - 1] as typeof steps[0]).t);
    expect((steps[0] as typeof steps[0]).t).toBe(0);
    for (const s of steps) expect(s.icon.startsWith('icon/')).toBe(true);
    expect(replayDuration(steps)).toBeGreaterThan(0);
    expect(replayDuration([])).toBe(0);
  });

  it('is deterministic, does not mutate the scenario, and flags found items', () => {
    const sc = generateScenario(11, 'daily', { ...profile(5), unlockedRooms: [...profile(5).unlockedRooms] });
    const before = JSON.stringify(sc);
    expect(JSON.stringify(replayScript(sc))).toBe(JSON.stringify(replayScript(sc)));
    const target = sc.targets[0] as ItemId;
    const flagged = replayScript(sc, { found: [target] }).filter((s) => s.found);
    expect(flagged.length).toBeGreaterThan(0);
    expect(flagged.every((s) => s.itemId === target)).toBe(true);
    expect(replayScript(sc).some((s) => s.found)).toBe(false);
    expect(JSON.stringify(sc)).toBe(before);
  });

  it('works for the guided day-1 morning', () => {
    const g = guidedScenario(3, 'relaxed');
    expect(replayScript(g).length).toBe(g.evening.length);
  });
});
