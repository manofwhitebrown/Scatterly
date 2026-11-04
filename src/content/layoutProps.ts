import type { IsoPlacement, LegacyRoomId, RoomId } from '../shared/types';
import type { Prop, PropKind } from './layout';

const p = (id: string, kind: PropKind, gx: number, gy: number, w: number, d: number, h: number, gz?: number): Prop => {
  const iso: IsoPlacement = { gx, gy, w, d, h };
  if (gz) iso.gz = gz;
  return { id, kind, iso };
};

const PROPS_PHASE3: Record<LegacyRoomId, Prop[]> = {
  entrance: [
    p('frontDoor', 'frontDoor', 0, 5, 1, 1, 8), p('matIn', 'mat', 3, 3, 2, 2, 1), p('frameHall', 'frame', 4, 0, 2, 1, 2, 6),
    p('lampCorner', 'lampFloor', 0, 7, 1, 1, 4), p('stool', 'stool', 2, 4, 1, 1, 2), p('umbrellaPot', 'pot', 6, 2, 1, 1, 2),
  ],
  living: [
    p('frameTv', 'frame', 3, 0, 2, 1, 2, 5), p('stairsUp', 'stairsUp', 1, 5, 1, 3, 1), p('lampSofa', 'lampFloor', 6, 6, 1, 1, 4),
    p('pouf', 'pouf', 5, 2, 1, 1, 2), p('pot', 'pot', 9, 2, 1, 1, 3), p('mat', 'mat', 1, 3, 1, 1, 1),
  ],
  kitchen: [
    p('lampTable', 'lampHang', 4, 3, 2, 2, 1, 7), p('runner', 'runner', 4, 5, 2, 1, 1), p('frameK', 'frame', 0, 4, 1, 1, 2, 5),
    p('stool', 'stool', 6, 5, 1, 1, 2), p('doorMat', 'mat', 1, 3, 1, 1, 1), p('pot', 'pot', 8, 3, 1, 1, 2),
  ],
  bedroom: [
    p('frameBed', 'frame', 3, 0, 3, 1, 2, 4), p('lampBed', 'lampFloor', 8, 3, 1, 1, 4), p('stool', 'stool', 1, 5, 1, 1, 2),
    p('pouf', 'pouf', 6, 6, 1, 1, 2), p('frameSide', 'frame', 0, 3, 1, 1, 2, 5), p('runner', 'runner', 1, 2, 1, 1, 1),
  ],
  bathroom: [
    p('frameBath', 'frame', 0, 0, 2, 1, 2, 6), p('stool', 'stool', 5, 6, 1, 1, 2), p('lampCorner', 'lampFloor', 7, 7, 1, 1, 4),
    p('pot', 'pot', 4, 7, 1, 1, 2), p('scale', 'mat', 2, 5, 1, 1, 1), p('frameSide', 'frame', 0, 6, 1, 1, 2, 5),
  ],
};

/** Phase 4 stub: new rooms start with no props until AI-2 lays them out. */
export const PROPS: Record<RoomId, Prop[]> = { ...PROPS_PHASE3, laundry: [], study: [], balcony: [], garden: [] };
