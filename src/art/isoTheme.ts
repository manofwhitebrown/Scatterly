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
  stairs: boolean;
  rug: { a: number; b: number; w: number; d: number } | null;
}

/** Defaults until AI-2's LAYOUTS drive the shells. */
export const DEFAULT_SPECS: Record<RoomId, ShellSpec> = {
  entrance: { cols: 8, rows: 8, theme: 'entrance', doors: [{ wall: 'right', at: 5 }], windows: [{ wall: 'left', at: 1, w: 1.6 }], stairs: true, rug: { a: 3, b: 2, w: 2.5, d: 2 } },
  living: { cols: 8, rows: 8, theme: 'living', doors: [{ wall: 'left', at: 5 }, { wall: 'right', at: 5.4 }], windows: [{ wall: 'right', at: 1.2, w: 2.6 }, { wall: 'left', at: 1.4, w: 1.8 }], stairs: false, rug: { a: 2.5, b: 2.5, w: 4, d: 3 } },
  kitchen: { cols: 8, rows: 8, theme: 'kitchen', doors: [{ wall: 'left', at: 5 }], windows: [{ wall: 'right', at: 1.4, w: 2.6 }], stairs: false, rug: { a: 2.5, b: 3, w: 3.5, d: 1.5 } },
  bedroom: { cols: 8, rows: 8, theme: 'bedroom', doors: [{ wall: 'right', at: 5.4 }], windows: [{ wall: 'left', at: 1.4, w: 2.4 }, { wall: 'right', at: 1.6, w: 1.8 }], stairs: true, rug: { a: 3, b: 3, w: 3, d: 2.4 } },
  bathroom: { cols: 8, rows: 8, theme: 'bathroom', doors: [{ wall: 'left', at: 5 }], windows: [{ wall: 'right', at: 3.2, w: 1.6 }], stairs: false, rug: { a: 3, b: 3.5, w: 2, d: 1.5 } },
};
