import type { WorldRoomDecor } from './worldProps';

/** Ground floor decor. Tuples: [kind, gx, gy, rot, id?, onTop?]; mounts: [kind, wall, t, base h]. rot = direction the front faces. */
export const ENTRANCE: WorldRoomDecor = {
  theme: 'Warm welcome: honey plank floor, cream stripe wallpaper, brick-red trim; story props: umbrella, hat, keys, post, a cat bed by the door.',
  windows: [{ wall: 'L', t: 1, w: 2 }],
  props: [
    ['sideTableDrawers', 6, 0, 0, 'st'], ['lampRoundTable', 6, 0, 0, '', 'st'], ['photoFrame1', 6, 0, 0, '', 'st'], ['keyring', 6, 0, 0, '', 'st'],
    ['coatRackStanding', 5, 1, 0, 'cr'], ['hat', 5, 1, 0, '', 'cr'], ['umbrella', 5, 1, 0, '', 'cr'],
    ['bench', 0, 1, 1, 'bn'], ['pillowBlue', 0, 1, 1, '', 'bn'], ['bear', 0, 2, 1, '', 'bn'], ['plantSmall1', 0, 1, 1, '', 'bn'],
    ['pottedPlant', 0, 8, 0], ['pottedPlant', 2, 8, 0],
    ['rugRect', 2, 3, 0], ['rugDoormat', 1, 5, 1],
    ['shoesPair', 3, 7, 0], ['slippers', 4, 7, 0], ['robotVacuum', 4, 5, 0], ['catBed', 4, 8, 0], ['catBowl', 5, 8, 0],
  ],
  mounts: [['mirrorWall', 'L', 4, 4], ['lampWall', 'L', 3, 6], ['poster2', 'L', 7, 4], ['hangingPlant', 'L', 8, 6], ['poster1', 'R', 6, 5], ['calendar', 'R', 7, 5], ['poster3', 'L', 6, 4]],
};

export const LIVING: WorldRoomDecor = {
  theme: 'Sage and cream living room: oak boards, sage stripe wallpaper, a fern, a TV corner and a long sofa; story props: books, tea, a radio, a sleepy cat.',
  windows: [{ wall: 'R', t: 5, w: 2 }, { wall: 'L', t: 6, w: 2 }],
  props: [
    ['loungeChair', 5, 3, 3], ['loungeChair', 5, 4, 3],
    ['sideTable', 2, 6, 0, 's1'], ['lampRoundTable', 2, 6, 0, '', 's1'], ['bear', 2, 6, 0, '', 's1'],
    ['sideTable', 6, 6, 0, 's2'], ['radio', 6, 6, 0, '', 's2'], ['plantSmall2', 6, 6, 0, '', 's2'],
    ['lampRoundFloor', 7, 6, 0], ['bookcaseOpen', 0, 1, 1], ['bookcaseClosed', 0, 3, 1],
    ['pottedPlant', 11, 3, 0], ['lampSquareFloor', 11, 6, 0], ['pottedPlant', 11, 8, 0], ['pottedPlant', 0, 8, 0],
    ['rugRound', 8, 7, 0], ['rugDoormat', 1, 2, 1], ['catBed', 9, 6, 0], ['catBowl', 10, 7, 0], ['robotVacuum', 6, 8, 0],
    ['bowl', 3, 3, 0, '', 'living.coffeeTable'], ['magazine', 4, 4, 0, '', 'living.coffeeTable'], ['mug', 4, 3, 0, '', 'living.coffeeTable'], ['vase', 3, 4, 0, '', 'living.coffeeTable'],
    ['pillow', 3, 6, 0, '', 'living.sofa'], ['pillowBlue', 5, 6, 0, '', 'living.sofa'], ['bear', 4, 6, 0, '', 'living.sofa'],
    ['photoFrame2', 2, 0, 0, '', 'living.drawer'], ['speakerSmall', 3, 0, 0, '', 'living.tv'],
  ],
  mounts: [['poster1', 'R', 3, 5], ['poster2', 'R', 4, 5], ['clockWall', 'R', 7, 5], ['hangingPlant', 'R', 9, 6], ['poster3', 'L', 5, 5], ['lampWall', 'L', 3, 6]],
};

export const KITCHEN: WorldRoomDecor = {
  theme: 'Butter-yellow kitchen: checker floor, cream cabinets, copper pans; story props: kettle, bread, fruit, a cat bowl, herbs.',
  windows: [{ wall: 'L', t: 2, w: 2 }, { wall: 'R', t: 2, w: 2 }],
  props: [
    ['kitchenStove', 5, 0, 0, 'sv'], ['pan', 5, 0, 0, '', 'sv'], ['kitchenCabinet', 6, 0, 0, 'k1'], ['kettle', 6, 0, 0, '', 'k1'], ['bread', 6, 0, 0, '', 'k1'],
    ['kitchenCabinet', 9, 0, 0, 'k2'], ['cuttingBoard', 9, 0, 0, '', 'k2'], ['teapot', 9, 0, 0, '', 'k2'],
    ['chair', 3, 3, 1], ['chair', 3, 4, 1], ['chair', 6, 3, 3], ['chair', 6, 4, 3],
    ['bowl', 4, 3, 0, '', 'kitchen.table'], ['mug', 5, 4, 0, '', 'kitchen.table'],
    ['pottedPlant', 9, 8, 0], ['pottedPlant', 0, 8, 0], ['rugDoormat', 1, 4, 1], ['rugRect', 3, 3, 0],
    ['catBed', 5, 7, 0], ['catBowl', 6, 7, 0],
    ['sideTable', 9, 3, 3, 'ks'], ['plantSmall3', 9, 3, 3, '', 'ks'], ['apple', 9, 3, 3, '', 'ks'], ['banana', 9, 3, 3, '', 'ks'],
  ],
  mounts: [
    ['kitchenCabinetUpper', 'R', 5, 5], ['kitchenCabinetUpper', 'R', 6, 5], ['clockWall', 'R', 9, 5], ['poster1', 'R', 4, 5], ['hangingPlant', 'R', 1, 6],
    ['poster2', 'L', 6, 5], ['poster3', 'L', 7, 5], ['lampWall', 'L', 1, 5], ['calendar', 'L', 8, 5],
  ],
};
