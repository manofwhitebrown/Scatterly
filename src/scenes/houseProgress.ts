import type { GameSession } from '../logic';
import type { RoomId, Scenario, SpotId } from '../shared/types';

/** Spoiler-free numbers shown on a Dollhouse room tile. */
export interface RoomProgress { searched: number; total: number; locks: number; clues: number }

/**
 * Searched/total containers, padlocks left and clues found for a room. Counts only: it never says where
 * an item is or what a clue says. `spotRoom` maps every spot id (incl. owned storage) to its room.
 */
export function roomProgress(
  session: GameSession,
  scenario: Scenario,
  spotRoom: ReadonlyMap<SpotId, RoomId>,
  room: RoomId,
): RoomProgress {
  const spots = session.spotsIn(room) ?? [];
  const containers = spots.filter((s) => s.capacity > 0);
  const searched = containers.filter((s) => session.isOpened(s.id)).length;
  const locks = spots.filter((s) => scenario.gates[s.id] !== undefined && !session.isOpened(s.id)).length;
  const clues = session.discoveredClues().filter((c) => spotRoom.get(c.spotId) === room).length;
  return { searched, total: containers.length, locks, clues };
}
