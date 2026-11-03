import type { GameSession } from '../logic';
import type { RoomId, Scenario, SpotId } from '../shared/types';

/** Spoiler-free numbers for the case strip: counts only, never where anything is. */
export interface CaseProgress { roomsSearched: number; roomsTotal: number; found: number; targets: number; locksLeft: number }

export function caseProgress(
  session: GameSession,
  scenario: Scenario,
  rooms: readonly RoomId[],
  spotRoom: ReadonlyMap<SpotId, RoomId>,
): CaseProgress {
  const searched = new Set<RoomId>();
  let locksLeft = 0;
  for (const room of rooms) {
    for (const s of session.spotsIn(room) ?? []) {
      const opened = session.isOpened(s.id);
      if (opened && s.capacity > 0 && spotRoom.get(s.id) === room) searched.add(room);
      if (!opened && scenario.gates[s.id] !== undefined) locksLeft++;
    }
  }
  return { roomsSearched: searched.size, roomsTotal: rooms.length, found: session.found().length, targets: scenario.targets.length, locksLeft };
}

export function stripText(p: CaseProgress): string {
  return `Rooms ${p.roomsSearched}/${p.roomsTotal}  Found ${p.found}/${p.targets}  Locks ${p.locksLeft}`;
}

/** Text for the calm checkpoint after a find; null when the case is done. */
export function checkpointText(p: CaseProgress): string | null {
  const left = p.targets - p.found;
  if (left <= 0) return null;
  return left === 1 ? 'Nice find! One more to go.' : `Nice find! ${left} more to go.`;
}
