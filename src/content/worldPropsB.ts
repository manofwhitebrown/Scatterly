import type { WorldRoomDecor } from './worldProps';

/** Upper floor decor (same tuple format as worldPropsA). */
export const BATHROOM: WorldRoomDecor = {
  theme: 'Mint and white bathroom: stone tile, mint stripe wallpaper, brass taps; story props: towels, candle, soap, a washer pair, a cat bed.',
  windows: [{ wall: 'R', t: 6, w: 2 }, { wall: 'L', t: 2, w: 2 }],
  props: [
    ['toilet', 6, 0, 0], ['sideTable', 7, 0, 0, 'sd'], ['plantSmall1', 7, 0, 0, '', 'sd'],
    ['shower', 0, 1, 1], ['bathtub', 0, 2, 1, 'bt'], ['candle', 0, 2, 1, '', 'bt'], ['bear', 0, 3, 1, '', 'bt'],
    ['bathMat', 1, 2, 1], ['rugRound', 3, 3, 0], ['bathMat', 2, 5, 0],
    ['washer', 7, 1, 3, 'wm'], ['towelStack', 7, 1, 3, '', 'wm'], ['dryer', 7, 2, 3],
    ['soap', 2, 0, 0, '', 'bathroom.sink'], ['toothbrush', 3, 0, 0, '', 'bathroom.sink'], ['towelStack', 0, 0, 0, '', 'bathroom.shelf'],
    ['catBed', 4, 7, 0], ['pottedPlant', 6, 8, 0],
  ],
  mounts: [
    ['mirrorWall', 'R', 3, 4], ['poster1', 'R', 0, 6], ['hangingPlant', 'R', 1, 6], ['lampWall', 'R', 4, 6], ['clockWall', 'R', 5, 5],
    ['mirrorWall', 'L', 4, 4], ['poster2', 'L', 5, 5], ['poster3', 'L', 1, 7], ['calendar', 'L', 8, 5], ['bunting', 'L', 6, 6],
  ],
};

export const BEDROOM: WorldRoomDecor = {
  theme: 'Dusk-rose bedroom: warm boards, rose dot wallpaper, a work corner by the window; story props: pillows, bear, alarm clock, books, a cat bed.',
  windows: [{ wall: 'R', t: 7, w: 2 }, { wall: 'L', t: 6, w: 2 }],
  props: [
    ['desk', 7, 0, 0, 'dk'], ['computerScreen', 7, 0, 0, '', 'dk'], ['laptop', 8, 0, 0, '', 'dk'], ['books', 8, 0, 0, '', 'dk'], ['desk_lamp', 8, 0, 0, '', 'dk'],
    ['chairDesk', 7, 1, 2], ['bookcaseOpen', 0, 2, 1], ['bookcaseClosed', 0, 3, 1],
    ['bench', 3, 2, 0],
    ['pillow', 3, 0, 0, '', 'bedroom.bed'], ['pillowBlue', 4, 0, 0, '', 'bedroom.bed'], ['bear', 5, 1, 0, '', 'bedroom.bed'],
    ['lampRoundTable', 2, 0, 0, '', 'bedroom.drawerL'], ['photoFrame1', 2, 0, 0, '', 'bedroom.drawerL'], ['alarmClock', 6, 0, 0, '', 'bedroom.drawerR'],
    ['lampRoundFloor', 9, 3, 0], ['lampSquareFloor', 11, 6, 0], ['pottedPlant', 11, 8, 0], ['pottedPlant', 9, 8, 0],
    ['rugRound', 6, 3, 0], ['rugDoormat', 1, 4, 1], ['catBed', 2, 7, 0], ['catBowl', 3, 7, 0],
    ['robotVacuum', 5, 6, 0], ['slippers', 2, 2, 0], ['shoesPair', 6, 7, 0],
  ],
  mounts: [['poster1', 'R', 3, 5], ['poster2', 'R', 4, 5], ['poster3', 'R', 5, 5], ['clockWall', 'R', 9, 5], ['mirrorWall', 'L', 5, 4], ['calendar', 'L', 8, 5], ['hangingPlant', 'L', 2, 6]],
};

export const STUDY: WorldRoomDecor = {
  theme: 'Oak and ink study: dark wood floor, olive stripe wallpaper, a reading corner; story props: books, tea set, desk lamp, a laptop, a sleepy cat.',
  windows: [{ wall: 'R', t: 4, w: 2 }, { wall: 'L', t: 6, w: 2 }],
  props: [
    ['chairDesk', 4, 2, 2], ['pottedPlant', 7, 0, 0], ['lampSquareFloor', 7, 1, 0],
    ['bookcaseOpen', 0, 1, 1], ['bookcaseOpen', 0, 2, 1], ['bookcaseClosed', 0, 3, 1], ['bookcaseOpen', 0, 5, 1],
    ['tableCoffee', 3, 5, 0, 'tc'], ['teapot', 3, 5, 0, '', 'tc'], ['teacup', 4, 5, 0, '', 'tc'],
    ['loungeChair', 5, 5, 3], ['loungeChair', 2, 5, 1],
    ['sideTable', 6, 5, 0, 'ss'], ['lampRoundTable', 6, 5, 0, '', 'ss'], ['mug', 6, 5, 0, '', 'ss'],
    ['laptop', 4, 0, 0, '', 'study.desk'], ['computerScreen', 5, 0, 0, '', 'study.desk'], ['desk_lamp', 4, 1, 0, '', 'study.desk'], ['bookStack', 5, 1, 0, '', 'study.desk'],
    ['photoFrame1', 3, 0, 0, '', 'study.drawerL'], ['alarmClock', 6, 0, 0, '', 'study.drawerR'],
    ['pillow', 3, 7, 0, '', 'study.sofa'], ['pillowBlue', 5, 7, 0, '', 'study.sofa'],
    ['rugRect', 3, 3, 0], ['rugDoormat', 1, 4, 1], ['pottedPlant', 9, 8, 0], ['pottedPlant', 0, 8, 0], ['catBed', 8, 5, 0], ['catBowl', 8, 6, 0],
  ],
  mounts: [
    ['hangingPlant', 'R', 1, 6], ['poster1', 'R', 2, 6], ['clockWall', 'R', 3, 5], ['poster2', 'R', 6, 5], ['calendar', 'R', 7, 5], ['poster3', 'R', 8, 6], ['lampWall', 'R', 9, 6],
    ['poster1', 'L', 1, 6], ['poster2', 'L', 2, 6], ['poster3', 'L', 3, 6],
  ],
};
