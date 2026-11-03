import type { DecorDef, DollhouseSlot, IsoPlacement, LegacyRoomId, RoomId, RoomLayout, SpotKind } from '../shared/types';
import { SPOT_POS } from './layoutSpots';
import { PROPS as PROP_DATA } from './layoutProps';

/**
 * Isometric layout data (2:1, tile 64x32).
 * Grid convention: gx runs along the right-hand wall (the wall on the plane gy = 0), gy runs along the left-hand wall
 * (the plane gx = 0). Cell (0,0) is the back corner; the open front edges are gx = cols and gy = rows.
 * Door/window `at` is a cell index along the wall: wall 'right' -> gx, wall 'left' -> gy. A door's entry cell is
 * (at, 0) on the right wall and (0, at) on the left wall; it is always kept free.
 * Windows span the height band WINDOW_Z; wall mounts (gz > 0) must touch a wall.
 */
export const WALL_H = 10;
export const WINDOW_Z = { from: 3, to: 8 } as const;

/** Footprint per spot kind in cells (w along gx, d along gy) and height units; gz > 0 means wall-mounted. */
export const KIND_FOOT: Record<SpotKind, { w: number; d: number; h: number; gz?: number }> = {
  drawer: { w: 1, d: 1, h: 3 }, cabinet: { w: 1, d: 1, h: 5 }, fridge: { w: 1, d: 1, h: 7 },
  sofa: { w: 3, d: 1, h: 3 }, table: { w: 2, d: 2, h: 2 }, shelf: { w: 2, d: 1, h: 5 },
  bed: { w: 3, d: 2, h: 2 }, wardrobe: { w: 2, d: 1, h: 7 }, jacket: { w: 1, d: 1, h: 4, gz: 2 },
  bagSpot: { w: 1, d: 1, h: 2 }, basket: { w: 1, d: 1, h: 2 }, keyHook: { w: 1, d: 1, h: 1, gz: 5 },
  shoeRack: { w: 2, d: 1, h: 1 }, sink: { w: 2, d: 1, h: 3 }, tv: { w: 2, d: 1, h: 3 },
  charger: { w: 1, d: 1, h: 1, gz: 3 }, rug: { w: 3, d: 2, h: 1 }, plant: { w: 1, d: 1, h: 4 },
  papers: { w: 1, d: 1, h: 1 }, bin: { w: 1, d: 1, h: 2 },
};

/** Iso placement of a spot (house spot or storage slot) by id, e.g. 'living.sofa'. */
export function spotIso(id: string, kind: SpotKind): IsoPlacement {
  const pos = SPOT_POS[id];
  if (!pos) throw new Error(`layout: no iso position for ${id}`);
  const f = KIND_FOOT[kind];
  const out: IsoPlacement = { gx: pos[0], gy: pos[1], w: f.w, d: f.d, h: f.h };
  if (f.gz) out.gz = f.gz;
  return out;
}

const L = (to: RoomId, at: number) => ({ to, wall: 'left' as const, at });
const R = (to: RoomId, at: number) => ({ to, wall: 'right' as const, at });

const LAYOUTS_PHASE3: Record<LegacyRoomId, RoomLayout> = {
  entrance: {
    id: 'entrance', cols: 8, rows: 8, theme: 'warm-entry',
    doors: [R('living', 6)],
    windows: [{ wall: 'left', at: 1, w: 2 }],
  },
  living: {
    id: 'living', cols: 10, rows: 8, theme: 'sage-living',
    doors: [L('entrance', 3), L('bedroom', 6), R('kitchen', 7)],
    windows: [{ wall: 'left', at: 1, w: 2 }, { wall: 'right', at: 5, w: 2 }],
  },
  kitchen: {
    id: 'kitchen', cols: 9, rows: 8, theme: 'butter-kitchen',
    doors: [L('living', 3)],
    windows: [{ wall: 'left', at: 1, w: 2 }, { wall: 'right', at: 5, w: 2 }],
  },
  bedroom: {
    id: 'bedroom', cols: 9, rows: 8, theme: 'dusk-bedroom',
    doors: [L('living', 2), R('bathroom', 8)],
    windows: [{ wall: 'left', at: 4, w: 2 }, { wall: 'right', at: 7, w: 1 }],
  },
  bathroom: {
    id: 'bathroom', cols: 8, rows: 8, theme: 'mint-bath',
    doors: [L('bedroom', 3)],
    windows: [{ wall: 'left', at: 1, w: 2 }, { wall: 'right', at: 6, w: 2 }],
  },
};

/** Phase 4 stub: the four new rooms have no geometry yet (AI-2 publishes world layout v2). Empty doors = unreachable. */
const stubLayout = (id: RoomId): RoomLayout => ({ id, cols: 8, rows: 8, theme: 'stub', doors: [], windows: [] });
export const LAYOUTS: Record<RoomId, RoomLayout> = {
  ...LAYOUTS_PHASE3,
  laundry: stubLayout('laundry'), study: stubLayout('study'), balcony: stubLayout('balcony'), garden: stubLayout('garden'),
};

/** Dollhouse plan. Floor 0 = ground, 1 = upper; the bedroom sits above the living room (stairs), the bathroom above the kitchen. */
export const HOUSE_MAP: DollhouseSlot[] = [
  { room: 'entrance', floor: 0, col: 0, row: 0 },
  { room: 'living', floor: 0, col: 1, row: 0 },
  { room: 'kitchen', floor: 0, col: 2, row: 0 },
  { room: 'bedroom', floor: 1, col: 1, row: 0 },
  { room: 'bathroom', floor: 1, col: 2, row: 0 },
];

export type PropKind =
  | 'frontDoor' | 'mat' | 'runner' | 'frame' | 'lampFloor' | 'lampHang' | 'stool' | 'pot' | 'pouf' | 'stairsUp';
export interface Prop { id: string; kind: PropKind; iso: IsoPlacement }
/** Decor-only pieces for AI-4 (not interactive, never hold items). */
export const PROPS: Record<RoomId, Prop[]> = PROP_DATA;

const P = (gx: number, gy: number, w: number, d: number, h: number, gz?: number): IsoPlacement =>
  gz ? { gx, gy, w, d, h, gz } : { gx, gy, w, d, h };

/** Iso placement of each cosmetic DecorDef (storage decor uses its slot in SPOT_POS). */
export const DECOR_ISO: Record<string, IsoPlacement> = {
  mirror: P(7, 0, 1, 1, 3, 4),
  print: P(0, 4, 1, 2, 2, 5),
  clock: P(4, 0, 1, 1, 1, 5),
  plantHerbs: P(1, 0, 1, 1, 1, 5),
  curtains: P(5, 0, 2, 1, 6, 2),
  lampLights: P(2, 0, 5, 1, 1, 7),
  shelfTowels: P(2, 0, 2, 1, 1, 6),
  rugBathMat: P(3, 3, 3, 2, 1),
};

export function decorIso(d: Pick<DecorDef, 'id' | 'room'>, kind?: SpotKind): IsoPlacement {
  if (kind) return spotIso(`${d.room}.${d.id}`, kind);
  const p = DECOR_ISO[d.id];
  if (!p) throw new Error(`layout: no iso placement for decor ${d.id}`);
  return p;
}
