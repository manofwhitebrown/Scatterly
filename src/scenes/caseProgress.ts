import type { GameSession } from '../logic';
import type { RoomId, Scenario, SpotId } from '../shared/types';

/** Pieces the player has tapped at least once, per session. A padlock only shows (and counts) after the first tap. */
const TRIED = new WeakMap<GameSession, Set<SpotId>>();
export function markTried(session: GameSession, id: SpotId): void {
  const set = TRIED.get(session) ?? new Set<SpotId>();
  set.add(id);
  TRIED.set(session, set);
}
export const wasTried = (session: GameSession, id: SpotId): boolean => TRIED.get(session)?.has(id) === true;

/** Spoiler-free numbers for the case strip: counts only, never where anything is. `locksFound` = padlocks met and still shut; never the total. */
export interface CaseProgress { roomsSearched: number; roomsTotal: number; found: number; targets: number; locksFound: number }

export function caseProgress(
  session: GameSession,
  scenario: Scenario,
  rooms: readonly RoomId[],
  spotRoom: ReadonlyMap<SpotId, RoomId>,
): CaseProgress {
  const searched = new Set<RoomId>();
  let locksFound = 0;
  for (const room of rooms) {
    for (const s of session.spotsIn(room) ?? []) {
      const opened = session.isOpened(s.id);
      if (opened && s.capacity > 0 && spotRoom.get(s.id) === room) searched.add(room);
      if (!opened && scenario.gates[s.id] !== undefined && wasTried(session, s.id)) locksFound++;
    }
  }
  return { roomsSearched: searched.size, roomsTotal: rooms.length, found: session.found().length, targets: scenario.targets.length, locksFound };
}

export function stripText(p: CaseProgress): string {
  return `Rooms ${p.roomsSearched}/${p.roomsTotal}  Found ${p.found}/${p.targets}  Locks ${p.locksFound}`;
}

/** Text for the calm checkpoint after a find; null when the case is done. */
export function checkpointText(p: CaseProgress): string | null {
  const left = p.targets - p.found;
  if (left <= 0) return null;
  return left === 1 ? 'Nice find! One more to go.' : `Nice find! ${left} more to go.`;
}
