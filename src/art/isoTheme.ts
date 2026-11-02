import { LAYOUTS } from '../content/layout';
import type { RoomId } from '../shared/types';

export interface Theme {
  floor: 'planks' | 'tiles';
  floorA: number; floorB: number; wall: number; trim: number; accent: number; rug: number; rugB: number;
}

/** Five calm palettes, one per room. Shared dark navy backdrop for the dollhouse view. */
export const BACKDROP = 0x1f2942;
export const THEMES: Record<RoomId, Theme> = {
  entrance: { floor: 'planks', floorA: 0xc4a37a, floorB: 0xb89468, wall: 0xdccaa6, trim: 0xf3ead6, accent: 0x8a6a4a, rug: 0x9b6a5a, rugB: 0xd9b89a },
  living: { floor: 'planks', floorA: 0xbfa58a, floorB: 0xb09478, wall: 0xa9bba0, trim: 0xeff1e6, accent: 0x6f9070, rug: 0x5f7f96, rugB: 0xd8d0b8 },
  kitchen: { floor: 'tiles', floorA: 0xe3ddd0, floorB: 0xc9c2b2, wall: 0xe8d28e, trim: 0xfaf3dc, accent: 0xd8795a, rug: 0xc7655a, rugB: 0xf0e0c0 },
  bedroom: { floor: 'planks', floorA: 0xc9b3a4, floorB: 0xbaa292, wall: 0xe1b6b9, trim: 0xf8ece8, accent: 0x9a6a78, rug: 0x8aa0b8, rugB: 0xe8d8d0 },
  bathroom: { floor: 'tiles', floorA: 0xd6e2e6, floorB: 0xbdd0d8, wall: 0xa9cde0, trim: 0xf2f8fa, accent: 0x5fa8a0, rug: 0x7fb0c0, rugB: 0xe6f0f2 },
};

export interface ShellSpec {
  cols: number; rows: number; theme: RoomId;
  doors: Array<{ wall: 'left' | 'right'; at: number }>;
  windows: Array<{ wall: 'left' | 'right'; at: number; w: number }>;
}

/** Shell spec straight from AI-2's layout data (room size, doors, windows). */
export function specFor(room: RoomId): ShellSpec {
  const l = LAYOUTS[room];
  return {
    cols: l.cols, rows: l.rows, theme: room,
    doors: l.doors.map((d) => ({ wall: d.wall, at: d.at })),
    windows: l.windows.map((w) => ({ wall: w.wall, at: w.at, w: w.w })),
  };
}
