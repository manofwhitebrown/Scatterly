import type { HouseSlot, RoomId } from '../shared/types';

/**
 * World layout v2 (additive; the old LAYOUTS / HOUSE_MAP keep working until Gate B, when HOUSE_MAP_V2 becomes HOUSE_MAP).
 * One global iso grid. A room occupies cells wx..wx+w-1 by wy..wy+d-1 of its floor; its back corner is local (0,0).
 * Ground floor, left to right: entrance | living | kitchen. Upper floor: bathroom | bedroom | study.
 * Neighbours share a wall: the left wall (local gx = 0) of the right-hand room is the partition. One staircase joins
 * the living room to the bedroom above it. Laundry, balcony and garden are frozen and have no world slot.
 */
export type WorldRoom = 'entrance' | 'living' | 'kitchen' | 'bathroom' | 'bedroom' | 'study';
export const WORLD_ROOMS: readonly WorldRoom[] = ['entrance', 'living', 'kitchen', 'bathroom', 'bedroom', 'study'];

/** Room size in tiles: w along gx (right back wall), d along gy (left back wall). */
export const ROOM_SIZE: Record<WorldRoom, { w: number; d: number }> = {
  entrance: { w: 8, d: 9 }, living: { w: 12, d: 9 }, kitchen: { w: 10, d: 9 },
  bathroom: { w: 8, d: 9 }, bedroom: { w: 12, d: 9 }, study: { w: 10, d: 9 },
};

/**
 * Upper-floor set-back k: every floor-1 slot is the ground room below it shifted by (-k, -k) world cells. Floor 1 is raised 72 art px
 * (= 9 tiles of gx+gy), so without it an upper room hides the back half of the ground room under it. A shift of (-k,-k) moves it
 * straight up the screen by 16k art px; k=6 clears the ground interior. Local room coordinates are unaffected.
 */
export const UPPER_SETBACK = 6;

export const HOUSE_MAP_V2: HouseSlot[] = [
  { room: 'entrance', floor: 0, wx: 0, wy: 0 },
  { room: 'living', floor: 0, wx: 8, wy: 0 },
  { room: 'kitchen', floor: 0, wx: 20, wy: 0 },
  { room: 'bathroom', floor: 1, wx: 0 - UPPER_SETBACK, wy: 0 - UPPER_SETBACK },
  { room: 'bedroom', floor: 1, wx: 8 - UPPER_SETBACK, wy: 0 - UPPER_SETBACK },
  { room: 'study', floor: 1, wx: 20 - UPPER_SETBACK, wy: 0 - UPPER_SETBACK },
];

export interface Cell2 { x: number; y: number }
/** A doorway through the shared partition: `a` is the left room, `b` the right room, `at` the row (gy) of the opening. */
export interface WorldDoor { a: WorldRoom; b: WorldRoom; at: number }
export const WORLD_DOORS: WorldDoor[] = [
  { a: 'entrance', b: 'living', at: 2 }, { a: 'living', b: 'kitchen', at: 4 },
  { a: 'bathroom', b: 'bedroom', at: 4 }, { a: 'bedroom', b: 'study', at: 4 },
];

/**
 * The one staircase: 1 wide x 3 deep, climbing along -gy in the back-right corner against the partition (bottom at y=2, top at y=0);
 * footprint is blocked on both floors. You board from the cell below the bottom step and arrive beside the top step.
 */
export const STAIRS = {
  lower: 'living' as WorldRoom, upper: 'bedroom' as WorldRoom,
  footprint: { x: 11, y: 0, w: 1, d: 3 },
  board: { x: 11, y: 3 }, landing: { x: 10, y: 0 },
};

/** Cell just inside `room` where the door to `other` opens, or undefined when they are not neighbours. */
export function worldDoorCell(room: WorldRoom, other: WorldRoom): Cell2 | undefined {
  for (const d of WORLD_DOORS) {
    if (d.a === room && d.b === other) return { x: ROOM_SIZE[room].w - 1, y: d.at };
    if (d.b === room && d.a === other) return { x: 0, y: d.at };
  }
  return undefined;
}

export const floorOf = (room: RoomId): 0 | 1 | undefined => HOUSE_MAP_V2.find((s) => s.room === room)?.floor;
