/**
 * Decor prop kinds for world layout v2. Names are Kenney model names (K) or our own (B/A) from docs/art/ASSET-LIST.md.
 * Footprint is at rot 0 (front faces +gy); rot 1/3 swap w and d. h is in height units (same scale as KIND_FOOT).
 * flat: lies on the floor and never blocks. top: small item that must sit on another piece (`onTop`). mount: hangs on a wall.
 * sym: looks the same from every side, so the wall-facing rule does not apply. seat: must face a `focus` piece.
 */
export interface PropKind { w: number; d: number; h: number; flat?: true; top?: true; mount?: true; sym?: true; seat?: true; focus?: true }

const B = (w: number, d: number, h: number, f: Partial<PropKind> = {}): PropKind => ({ w, d, h, ...f });
const TOP = B(1, 1, 1, { top: true });
const FLAT = B(1, 1, 1, { flat: true, sym: true });
const MOUNT = B(1, 1, 1, { mount: true });

export const PROP_KINDS: Record<string, PropKind> = {
  // seats
  loungeSofa: B(3, 1, 3, { seat: true }), loungeChair: B(1, 1, 3, { seat: true }), chairDesk: B(1, 1, 3, { seat: true }),
  chair: B(1, 1, 3, { seat: true }), stoolBar: B(1, 1, 3, { seat: true, sym: true }), bench: B(2, 1, 2),
  // tables and storage furniture
  tableCoffee: B(2, 1, 2, { focus: true }), tableRound: B(2, 2, 2, { focus: true }), desk: B(2, 1, 3, { focus: true }),
  sideTable: B(1, 1, 2), sideTableDrawers: B(1, 1, 2), bookcaseOpen: B(1, 1, 5), bookcaseClosed: B(1, 1, 5),
  cabinetTelevision: B(2, 1, 2, { focus: true }), speaker: B(1, 1, 3, { sym: true }),
  // kitchen and bath
  kitchenCabinet: B(1, 1, 3), kitchenStove: B(1, 1, 3), kitchenFridgeSmall: B(1, 1, 4), kitchenBar: B(2, 1, 3, { focus: true }),
  bathtub: B(2, 1, 2), toilet: B(1, 1, 3), shower: B(1, 1, 6), washer: B(1, 1, 4), dryer: B(1, 1, 4),
  // tall singles
  coatRackStanding: B(1, 1, 5, { sym: true }), lampRoundFloor: B(1, 1, 4, { sym: true }), lampSquareFloor: B(1, 1, 4, { sym: true }),
  pottedPlant: B(1, 1, 4, { sym: true }), trashcan: B(1, 1, 2, { sym: true }),
  // flat floor pieces
  rugRect: B(3, 2, 1, { flat: true }), rugRound: B(2, 2, 1, { flat: true, sym: true }), rugDoormat: B(2, 1, 1, { flat: true }),
  bathMat: FLAT, catBed: FLAT, catBowl: FLAT, shoesPair: FLAT, slippers: FLAT, robotVacuum: FLAT,
  // small things that sit on other pieces
  lampRoundTable: TOP, books: TOP, bookStack: TOP, laptop: TOP, computerScreen: TOP, mug: TOP, teacup: TOP, teapot: TOP,
  plantSmall1: TOP, plantSmall2: TOP, plantSmall3: TOP, vase: TOP, photoFrame1: TOP, photoFrame2: TOP, radio: TOP,
  speakerSmall: TOP, bear: TOP, pillow: TOP, pillowBlue: TOP, bowl: TOP, toaster: TOP, kettle: TOP, bread: TOP,
  cuttingBoard: TOP, pan: TOP, apple: TOP, banana: TOP, magazine: TOP, desk_lamp: TOP, alarmClock: TOP, hat: TOP,
  keyring: TOP, towelStack: TOP, soap: TOP, toothbrush: TOP, candle: TOP, cookies: TOP, umbrella: TOP,
  // wall mounts (w along the wall)
  poster1: MOUNT, poster2: MOUNT, poster3: MOUNT, calendar: MOUNT, clockWall: MOUNT, mirrorWall: MOUNT, lampWall: MOUNT,
  kitchenCabinetUpper: MOUNT, hangingPlant: MOUNT, bunting: B(2, 1, 1, { mount: true }),
};

export type Rot = 0 | 1 | 2 | 3;
export const FRONT_STEP: Record<Rot, readonly [number, number]> = { 0: [0, 1], 1: [1, 0], 2: [0, -1], 3: [-1, 0] };

/** Floor footprint of a kind at a cell and rotation. */
export function footprint(kind: string, gx: number, gy: number, rot: Rot): { gx: number; gy: number; w: number; d: number; h: number } {
  const k = PROP_KINDS[kind] as PropKind;
  const swap = rot === 1 || rot === 3;
  return { gx, gy, w: swap ? k.d : k.w, d: swap ? k.w : k.d, h: k.h };
}
