import type { SpotKind } from '../shared/types';

/** Base colour per kind. Greyish so setTint can vary pieces between rooms. */
export const KIND_COLOR: Record<SpotKind, number> = {
  drawer: 0xc9a47a, cabinet: 0xd0b08a, fridge: 0xd8dde0, sofa: 0xa9b8a0, table: 0xc9a47a, shelf: 0xbf9a70,
  bed: 0xd9c3b8, wardrobe: 0xb48c64, jacket: 0xa8a29a, bagSpot: 0xb59f86, basket: 0xcfae78, keyHook: 0xb8956a,
  shoeRack: 0xa98a64, sink: 0xdfe6ea, tv: 0x6f7780, charger: 0xbfc4c8, rug: 0xc9a0a0, plant: 0x93b585,
  papers: 0xeee6d2, bin: 0x9aa4ab,
};
