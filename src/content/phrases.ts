import type { SpotKind } from '../shared/types';

/** Preposition used when a spot is named plainly: "on the coffee table". */
export const PREP: Record<SpotKind, string> = {
  drawer: 'in', cabinet: 'in', fridge: 'in', sofa: 'in', table: 'on', shelf: 'on',
  bed: 'in', wardrobe: 'in', jacket: 'in', bagSpot: 'in', basket: 'in', keyHook: 'on',
  shoeRack: 'on', sink: 'by', tv: 'by', charger: 'on', rug: 'under', plant: 'behind',
  papers: 'under', bin: 'in',
};

/** Oblique ways to point at a spot kind without naming it (used from difficulty 2 up). */
export const IMPLY: Record<SpotKind, readonly string[]> = {
  drawer: ['somewhere with a handle that slides', 'somewhere that rattles when pulled'],
  cabinet: ['somewhere behind a door', 'somewhere shut away with a click'],
  fridge: ['somewhere cold', 'somewhere that hums at midnight'],
  sofa: ['somewhere soft and lumpy', 'somewhere made for flopping'],
  table: ['somewhere flat for elbows', 'somewhere with a tabletop'],
  shelf: ['somewhere above knee height', 'somewhere up on a ledge'],
  bed: ['somewhere under a duvet', 'somewhere with pillows'],
  wardrobe: ['somewhere full of hangers', 'somewhere that smells of cedar'],
  jacket: ['somewhere with sleeves and pockets', 'somewhere that hangs and drips'],
  bagSpot: ['somewhere with straps and a zip', 'somewhere that rustles'],
  basket: ['somewhere woven', 'somewhere you dump things'],
  keyHook: ['somewhere with a little hook', 'somewhere right by the door'],
  shoeRack: ['somewhere among the shoes', 'somewhere you kick things off'],
  sink: ['somewhere damp near the taps', 'somewhere that drips'],
  tv: ['somewhere near the screen', 'somewhere under the telly'],
  charger: ['somewhere with a cable', 'somewhere that hums with power'],
  rug: ['somewhere underfoot', 'somewhere beneath your feet'],
  plant: ['somewhere leafy', 'somewhere green'],
  papers: ['somewhere under a pile of paper', 'somewhere buried in paper'],
  bin: ['somewhere you throw things away', "somewhere you'd never look twice"],
};

/** Candidate answers for word gates, with riddle-style context. */
export const WORD_GATES: ReadonlyArray<readonly [string, string]> = [
  ['TOAST', 'Pops up golden at breakfast.'],
  ['PILLOW', 'You drooled on it all night.'],
  ['KETTLE', 'Whistles when it is cross.'],
  ['SLIPPER', 'Soft shoe for a lazy evening.'],
  ['BISCUIT', 'Best dunked in tea.'],
  ['CUSHION', 'Sofa bodyguard.'],
  ['LAMP', 'Switch it on to see.'],
  ['PORRIDGE', 'Oats and patience.'],
  ['UMBRELLA', 'Opens only after you leave it.'],
  ['MORNING', 'Arrives far too early.'],
];
