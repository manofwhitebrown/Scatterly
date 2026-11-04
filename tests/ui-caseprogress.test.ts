import { describe, expect, it } from 'vitest';
import { checkpointText, stripText } from '../src/scenes/caseProgress';
import type { CaseProgress } from '../src/scenes/caseProgress';

const p = (o: Partial<CaseProgress> = {}): CaseProgress => ({ roomsSearched: 1, roomsTotal: 4, found: 1, targets: 3, locksFound: 5, ...o });

describe('case progress text', () => {
  it('strip shows counts only', () => {
    expect(stripText(p())).toBe('Rooms 1/4  Found 1/3  Locks 5');
  });
  it('checkpoint counts what is left and stops at the end', () => {
    expect(checkpointText(p())).toBe('Nice find! 2 more to go.');
    expect(checkpointText(p({ found: 2 }))).toBe('Nice find! One more to go.');
    expect(checkpointText(p({ found: 3 }))).toBeNull();
  });
});

import { defaultProfile } from '../src/core/save';
import { GameSession } from '../src/logic';
import { fallbackScenario } from '../src/logic/generator';
import { caseProgress, markTried, wasTried } from '../src/scenes/caseProgress';
import type { RoomId, SpotId } from '../src/shared/types';

describe('caseProgress on a real session', () => {
  const profile = defaultProfile();
  const sc = fallbackScenario(777, 'relaxed');
  const session = new GameSession(sc, profile, 'relaxed');
  const rooms = profile.unlockedRooms as RoomId[];
  const spotRoom = new Map<SpotId, RoomId>();
  for (const r of rooms) for (const s of session.spotsIn(r)) spotRoom.set(s.id, r);
  it('starts at zero searched, zero found, no locks found yet (never the total)', () => {
    const c = caseProgress(session, sc, rooms, spotRoom);
    expect(c.roomsSearched).toBe(0);
    expect(c.found).toBe(0);
    expect(c.targets).toBe(sc.targets.length);
    expect(c.locksFound).toBe(0);
  });
  it('a lock counts only after its piece was tapped', () => {
    const id = rooms.flatMap((r) => session.spotsIn(r)).find((s) => s.lockable)!.id;
    const gated = { ...sc, gates: { [id]: { kind: sc.gates[id]?.kind ?? ('combo' as never), difficulty: 1 as never } } };
    expect(caseProgress(session, gated, rooms, spotRoom).locksFound).toBe(0);
    markTried(session, id);
    expect(caseProgress(session, gated, rooms, spotRoom).locksFound).toBe(1);
    expect(wasTried(session, id)).toBe(true);
  });
  it('searching a container raises roomsSearched without revealing anything', () => {
    const spot = rooms.flatMap((r) => session.spotsIn(r)).find((s) => s.capacity > 0 && sc.gates[s.id] === undefined)!;
    session.inspect(spot.id);
    const c = caseProgress(session, sc, rooms, spotRoom);
    expect(c.roomsSearched).toBe(1);
    expect(Object.keys(c).sort()).toEqual(['found', 'locksFound', 'roomsSearched', 'roomsTotal', 'targets']);
  });
});
