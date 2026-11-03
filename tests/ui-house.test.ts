import { defaultProfile } from '../src/core/save';
import { describe, expect, it } from 'vitest';
import { GameSession, allSpots, generateScenario } from '../src/logic';
import { LEGACY_ROOMS } from '../src/shared/types';
import type { PlayerProfile, RoomId, SpotId } from '../src/shared/types';
import { roomProgress } from '../src/scenes/houseProgress';

function profile(): PlayerProfile {
  return {
    ...defaultProfile(),
    version: 4, day: 10, coins: 0, streak: 0, lastDailyDate: null,
    unlockedRooms: [...LEGACY_ROOMS], owned: [], homeSpots: {},
    bestStars: {}, tutorialDone: true,
    stats: { mornings: 0, perfect: 0, itemsFound: 0, hintsUsed: 0, puzzlesSolved: 0, bestStreak: 0, fastestMs: null },
    achievements: [], weekMorning: 0, weekStars: 0,
    settings: defaultProfile().settings, puzzles: {},
  };
}

function setup(seed: number): { session: GameSession; scenario: ReturnType<typeof generateScenario>; spotRoom: Map<SpotId, RoomId> } {
  const p = profile();
  const scenario = generateScenario(seed, 'relaxed', p);
  const session = new GameSession(scenario, p, 'relaxed');
  const spotRoom = new Map<SpotId, RoomId>();
  for (const s of allSpots(p)) spotRoom.set(s.id, s.room);
  return { session, scenario, spotRoom };
}

describe('Dollhouse room progress', () => {
  it('starts at zero searched / zero clues and counts every padlock', () => {
    const { session, scenario, spotRoom } = setup(11);
    let locks = 0;
    for (const room of LEGACY_ROOMS) {
      const pr = roomProgress(session, scenario, spotRoom, room);
      expect(pr.searched).toBe(0);
      expect(pr.clues).toBe(0);
      expect(pr.total).toBeGreaterThan(0);
      expect(pr.locks).toBeLessThanOrEqual(pr.total);
      locks += pr.locks;
    }
    expect(locks).toBe(Object.keys(scenario.gates).length);
  });

  it('counts a searched container and never leaks more than numbers', () => {
    const { session, scenario, spotRoom } = setup(12);
    const room = scenario.startRoom;
    const open = (session.spotsIn(room) ?? []).find((s) => s.capacity > 0 && scenario.gates[s.id] === undefined);
    expect(open).toBeDefined();
    if (!open) return;
    const before = roomProgress(session, scenario, spotRoom, room);
    session.inspect(open.id);
    const after = roomProgress(session, scenario, spotRoom, room);
    expect(after.searched).toBe(before.searched + 1);
    expect(Object.keys(after).sort()).toEqual(['clues', 'locks', 'searched', 'total']);
    for (const v of Object.values(after)) expect(typeof v).toBe('number');
  });
});
