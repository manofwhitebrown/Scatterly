import { SPOT_SIZE } from '../shared/types';
import type { ItemId, RoomId, Spot, SpotAction, SpotId, SpotKind } from '../shared/types';
import { spotIso } from './layout';

const CODE: Record<string, ItemId> = {
  k: 'keys', w: 'wallet', p: 'phone', i: 'officeId', s: 'shoes', g: 'glasses', e: 'earbuds', b: 'bag',
};

/** Expands a compact code string (e.g. 'kwp') into item ids. */
export function items(codes: string): ItemId[] {
  const out: ItemId[] = [];
  for (const ch of codes) {
    const id = CODE[ch];
    if (id) out.push(id);
  }
  return out;
}

/** Closed containers that may be locked by a puzzle gate. */
export const LOCKABLE_KINDS: readonly SpotKind[] = ['drawer', 'cabinet', 'fridge', 'wardrobe', 'basket', 'bin', 'bagSpot', 'shoeRack', 'tv'];

// [name, kind, label, action, capacity, plausible codes, optional bottom edge override]
type Def = readonly [string, SpotKind, string, SpotAction, number, string, number?];
interface Row { room: RoomId; x: number; bottom: number; gap?: number; defs: Def[] }

/** Reserved slots (names start with '~') are left empty for storage decor to occupy. */
export const SLOTS: Record<string, { x: number; y: number }> = {};

function layout(rows: Row[]): Spot[] {
  const out: Spot[] = [];
  for (const row of rows) {
    let x = row.x;
    for (const d of row.defs) {
      const [name, kind, label, action, capacity, codes, bottom] = d;
      const size = SPOT_SIZE[kind];
      const y = (bottom ?? row.bottom) - size.h;
      if (name.startsWith('~')) {
        SLOTS[`${row.room}.${name.slice(1)}`] = { x, y };
      } else {
        out.push({
          id: `${row.room}.${name}`, room: row.room, kind, label,
          x, y, w: size.w, h: size.h, action, capacity, plausible: items(codes),
          iso: spotIso(`${row.room}.${name}`, kind), lockable: LOCKABLE_KINDS.includes(kind),
        });
      }
      x += size.w + (row.gap ?? 12);
    }
  }
  return out;
}

const R = (name: string, kind: SpotKind): Def => [`~${name}`, kind, '', 'peek', 1, ''];

export const HOUSE: Spot[] = layout([
  // ---- Entrance (11) ----
  { room: 'entrance', x: 40, bottom: 500, defs: [
    ['coat1', 'jacket', 'Blue coat', 'search', 2, 'kwpige'],
    ['coat2', 'jacket', 'Rain jacket', 'search', 2, 'kwpige'],
    R('jacketPeg', 'jacket'),
    ['~keyHook', 'keyHook', '', 'peek', 1, '', 470],
    ['shelf', 'shelf', 'Hall shelf', 'peek', 2, 'kwige'],
    ['console', 'drawer', 'Console drawer', 'open', 2, 'kwige'],
    ['cabinet', 'cabinet', 'Shoe cabinet', 'open', 2, 'skb'],
    ['plant', 'plant', 'Hall plant', 'peek', 1, 'kge'],
  ] },
  { room: 'entrance', x: 40, bottom: 690, defs: [
    ['shoeRack', 'shoeRack', 'Shoe rack', 'peek', 3, 'skb'],
    R('shoeBench', 'shoeRack'),
    ['bag', 'bagSpot', 'Tote bag', 'search', 2, 'kwpige'],
    R('bagHook', 'bagSpot'),
    ['basket', 'basket', 'Door basket', 'search', 2, 'kwge'],
    R('walletBowl', 'basket'),
    ['papers', 'papers', 'Post pile', 'lift', 2, 'kwige'],
    ['bin', 'bin', 'Umbrella bin', 'search', 1, 'ki'],
  ] },
  // ---- Living room (11) ----
  { room: 'living', x: 40, bottom: 500, defs: [
    ['bookshelf', 'shelf', 'Bookshelf', 'peek', 2, 'kpge'],
    ['tv', 'tv', 'Telly unit', 'peek', 2, 'pgek'],
    ['drawer', 'drawer', 'Sideboard drawer', 'open', 2, 'kwige'],
    ['displayShelf', 'shelf', 'Display shelf', 'peek', 2, 'kpgw'],
    ['plant', 'plant', 'Big fern', 'peek', 1, 'kep'],
    ['charger', 'charger', 'Wall charger', 'peek', 1, 'pe', 480],
  ] },
  { room: 'living', x: 40, bottom: 690, gap: 10, defs: [
    ['sofa', 'sofa', 'Sofa cushions', 'lift', 3, 'kwpgeb'],
    ['rug', 'rug', 'Rug', 'lift', 2, 'kesb'],
    ['coffeeTable', 'table', 'Coffee table', 'peek', 3, 'kwpige'],
    ['basket', 'basket', 'Blanket basket', 'search', 2, 'pegk'],
    ['bin', 'bin', 'Recycling bin', 'search', 1, 'ki'],
  ] },
  // ---- Kitchen (12) ----
  { room: 'kitchen', x: 40, bottom: 500, defs: [
    ['fridge', 'fridge', 'Fridge', 'open', 2, 'kpw'],
    ['cabinet1', 'cabinet', 'Cupboard', 'open', 2, 'kwg'],
    ['sink', 'sink', 'Sink', 'peek', 1, 'peg'],
    ['cabinet2', 'cabinet', 'Pantry', 'open', 2, 'kwi'],
    ['spiceShelf', 'shelf', 'Spice shelf', 'peek', 2, 'kgpe'],
    ['drawer1', 'drawer', 'Cutlery drawer', 'open', 2, 'kwe'],
  ] },
  { room: 'kitchen', x: 40, bottom: 690, defs: [
    ['table', 'table', 'Dining table', 'peek', 3, 'kwpgieb'],
    ['bagSpot', 'bagSpot', 'Shopping bag', 'search', 2, 'kwpie'],
    ['basket', 'basket', 'Fruit basket', 'search', 2, 'kgew'],
    ['bin', 'bin', 'Kitchen bin', 'search', 1, 'ki'],
    ['drawer2', 'drawer', 'Utensil drawer', 'open', 2, 'kei'],
    ['papers', 'papers', 'Mail pile', 'lift', 2, 'kwige'],
    R('tray', 'papers'),
  ] },
  // ---- Bedroom (12) ----
  { room: 'bedroom', x: 40, bottom: 500, defs: [
    ['wardrobe', 'wardrobe', 'Wardrobe', 'open', 3, 'sbwki'],
    ['drawerL', 'drawer', 'Left bedside drawer', 'open', 2, 'pgewki'],
    ['bed', 'bed', 'Bed', 'lift', 3, 'pegwkb'],
    ['drawerR', 'drawer', 'Right bedside drawer', 'open', 2, 'pgewk'],
    ['jacket', 'jacket', 'Door-hook jacket', 'search', 2, 'kwpige'],
    ['charger', 'charger', 'Bedside charger', 'peek', 1, 'pe', 480],
  ] },
  { room: 'bedroom', x: 40, bottom: 690, defs: [
    ['rug', 'rug', 'Bedside rug', 'lift', 2, 'kseb'],
    ['laundry', 'basket', 'Laundry basket', 'search', 2, 'wkpie'],
    ['gymBag', 'bagSpot', 'Gym bag', 'search', 2, 'kwpies'],
    ['bin', 'bin', 'Waste bin', 'search', 1, 'ki'],
    ['papers', 'papers', 'Desk papers', 'lift', 2, 'kwige'],
    ['shoeRack', 'shoeRack', 'Shoe corner', 'peek', 2, 'skb'],
    ['~dock', 'charger', '', 'peek', 1, '', 600],
  ] },
  // ---- Bathroom (9) ----
  { room: 'bathroom', x: 40, bottom: 500, defs: [
    ['cabinet', 'cabinet', 'Mirror cabinet', 'open', 2, 'gepk'],
    ['sink', 'sink', 'Basin', 'peek', 1, 'gpek'],
    ['shelf', 'shelf', 'Towel shelf', 'peek', 2, 'pgek'],
    ['plant', 'plant', 'Bathroom plant', 'peek', 1, 'gpe'],
  ] },
  { room: 'bathroom', x: 40, bottom: 690, defs: [
    ['basket', 'basket', 'Hamper', 'search', 2, 'wkpi'],
    ['bin', 'bin', 'Bathroom bin', 'search', 1, 'ke'],
    ['bagSpot', 'bagSpot', 'Washbag', 'search', 2, 'gekwp'],
    ['drawer', 'drawer', 'Vanity drawer', 'open', 2, 'geki'],
    ['papers', 'papers', 'Magazine stack', 'lift', 2, 'pge'],
  ] },
]);

const BY_ID: Map<SpotId, Spot> = new Map(HOUSE.map((s) => [s.id, s]));

export function spotById(id: SpotId): Spot | undefined {
  return BY_ID.get(id);
}
