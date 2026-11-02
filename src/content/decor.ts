import { SPOT_SIZE } from '../shared/types';
import type { DecorDef, ItemId, Spot, SpotAction, SpotId } from '../shared/types';
import { HOUSE, LOCKABLE_KINDS, SLOTS, isoFromBox, items } from './house';

export interface StorageInfo {
  label: string;
  action: SpotAction;
  capacity: number;
  plausible: ItemId[];
}

/** Spot behaviour for every storage decor (keyed by DecorDef id). */
export const STORAGE_INFO: Record<string, StorageInfo> = {
  keyHook: { label: 'Key hook', action: 'peek', capacity: 2, plausible: items('ki') },
  walletBowl: { label: 'Wallet bowl', action: 'search', capacity: 2, plausible: items('wke') },
  shoeBench: { label: 'Shoe bench', action: 'peek', capacity: 3, plausible: items('sb') },
  bagHook: { label: 'Bag hook', action: 'search', capacity: 2, plausible: items('bkwie') },
  jacketPeg: { label: 'Pegged coat', action: 'search', capacity: 2, plausible: items('kwpie') },
  dock: { label: 'Charging dock', action: 'peek', capacity: 1, plausible: items('pe') },
  tray: { label: 'Catch-all tray', action: 'peek', capacity: 2, plausible: items('kwgie') },
};

function storage(
  id: string, name: string, room: DecorDef['room'], price: number, unlockDay: number,
  spotKind: NonNullable<DecorDef['spotKind']>, benefit: string,
): DecorDef {
  const pos = SLOTS[`${room}.${id}`] ?? { x: 40, y: 400 };
  const size = SPOT_SIZE[spotKind];
  return { id, name, room, price, unlockDay, kind: 'storage', iso: isoFromBox(pos.x, pos.y, size.w, size.h), x: pos.x, y: pos.y, w: size.w, h: size.h, spotKind, benefit };
}

function cosmetic(
  id: string, name: string, room: DecorDef['room'], price: number, unlockDay: number,
  x: number, y: number, w: number, h: number,
): DecorDef {
  return { id, name, room, price, unlockDay, kind: 'cosmetic', iso: isoFromBox(x, y, w, h), x, y, w, h };
}

export const DECOR: DecorDef[] = [
  cosmetic('mirror', 'Round mirror', 'entrance', 30, 1, 700, 30, 100, 100),
  cosmetic('print', 'Framed print', 'living', 45, 2, 520, 40, 150, 100),
  cosmetic('clock', 'Wall clock', 'kitchen', 55, 3, 600, 30, 70, 70),
  cosmetic('plantHerbs', 'Herb plant', 'kitchen', 70, 4, 300, 90, 140, 70),
  cosmetic('curtains', 'Warm curtains', 'living', 120, 5, 960, 10, 200, 150),
  cosmetic('lampLights', 'Fairy lamp', 'bedroom', 150, 7, 300, 20, 300, 60),
  cosmetic('shelfTowels', 'Towel shelf', 'bathroom', 90, 6, 480, 40, 180, 70),
  cosmetic('rugBathMat', 'Bath rug', 'bathroom', 80, 6, 800, 620, 220, 70),
  storage('keyHook', 'Key hook', 'entrance', 40, 1, 'keyHook', 'Keys left near the door are easier to find'),
  storage('walletBowl', 'Wallet bowl', 'entrance', 60, 2, 'basket', 'A wallet bowl gives your wallet a home'),
  storage('shoeBench', 'Shoe bench', 'entrance', 80, 3, 'shoeRack', 'Shoes and work bags land in one obvious place'),
  storage('bagHook', 'Bag hook', 'entrance', 90, 4, 'bagSpot', 'Your work bag always has a hook to hang on'),
  storage('jacketPeg', 'Jacket peg', 'entrance', 110, 5, 'jacket', 'Coat pockets become a predictable stash'),
  storage('dock', 'Charging dock', 'bedroom', 130, 6, 'charger', 'Your phone sleeps on the dock, not under the duvet'),
  storage('tray', 'Catch-all tray', 'kitchen', 150, 8, 'papers', 'Pocket-emptying has a tidy landing zone'),
];

export function decorSpotId(d: DecorDef): SpotId {
  return `${d.room}.${d.id}`;
}

export function storageSpot(d: DecorDef): Spot | null {
  const info = STORAGE_INFO[d.id];
  if (d.kind !== 'storage' || !d.spotKind || !info) return null;
  return {
    id: decorSpotId(d), room: d.room, kind: d.spotKind, label: info.label,
    x: d.x, y: d.y, w: d.w, h: d.h, iso: d.iso, lockable: LOCKABLE_KINDS.includes(d.spotKind), action: info.action, capacity: info.capacity,
    plausible: info.plausible.slice(),
  };
}

/** Every storage decor as a Spot (owned or not). */
export const STORAGE_SPOTS: Spot[] = DECOR.map(storageSpot).filter((s): s is Spot => s !== null);

const ANY: Map<SpotId, Spot> = new Map([...HOUSE, ...STORAGE_SPOTS].map((s) => [s.id, s]));

/** Looks up a house spot or a storage-decor spot, owned or not. */
export function anySpot(id: SpotId): Spot | undefined {
  return ANY.get(id);
}
