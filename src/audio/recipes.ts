export type SfxName = 'tap' | 'open' | 'close' | 'found' | 'clue' | 'error' | 'win' | 'lose' | 'tick' | 'pop' | 'swoosh'
  | 'coin' | 'snap' | 'click' | 'success' | 'unlock' | 'bell' | 'fanfare';

export interface Blip { f: number; to?: number; d: number; at?: number; type?: OscillatorType; g?: number }
export interface Recipe { blips: Blip[]; noise?: { at: number; d: number; lo: number; hi: number; g: number } }

export const RECIPES: Record<SfxName, Recipe> = {
  tap: { blips: [{ f: 660, to: 560, d: 0.07 }] },
  open: { blips: [{ f: 330, to: 440, d: 0.12, type: 'triangle' }], noise: { at: 0, d: 0.06, lo: 600, hi: 1800, g: 0.25 } },
  close: { blips: [{ f: 440, to: 290, d: 0.12, type: 'triangle' }] },
  found: { blips: [{ f: 523, d: 0.09 }, { f: 659, d: 0.09, at: 0.08 }, { f: 784, d: 0.18, at: 0.16 }] },
  clue: { blips: [{ f: 880, d: 0.08 }, { f: 1175, d: 0.14, at: 0.07 }] },
  error: { blips: [{ f: 230, to: 160, d: 0.16, type: 'triangle' }] },
  win: { blips: [{ f: 523, d: 0.12 }, { f: 659, d: 0.12, at: 0.1 }, { f: 784, d: 0.12, at: 0.2 }, { f: 1047, d: 0.25, at: 0.3 }] },
  lose: { blips: [{ f: 392, d: 0.16, type: 'triangle' }, { f: 330, d: 0.16, at: 0.14, type: 'triangle' }, { f: 262, d: 0.24, at: 0.28, type: 'triangle' }] },
  tick: { blips: [{ f: 1200, d: 0.025, g: 0.6 }] },
  pop: { blips: [{ f: 400, to: 800, d: 0.07 }] },
  swoosh: { blips: [], noise: { at: 0, d: 0.2, lo: 300, hi: 2600, g: 0.5 } },
  coin: { blips: [{ f: 988, d: 0.07, type: 'triangle' }, { f: 1319, d: 0.2, at: 0.06, type: 'triangle' }] },
  snap: { blips: [{ f: 600, to: 420, d: 0.04 }], noise: { at: 0, d: 0.03, lo: 1500, hi: 4000, g: 0.5 } },
  click: { blips: [{ f: 900, to: 700, d: 0.03, type: 'square', g: 0.35 }] },
  success: { blips: [{ f: 660, d: 0.08 }, { f: 880, d: 0.16, at: 0.07 }] },
  unlock: {
    blips: [{ f: 300, to: 200, d: 0.04, type: 'square', g: 0.4 }, { f: 520, d: 0.05, at: 0.07, type: 'square', g: 0.4 },
      { f: 1047, d: 0.2, at: 0.15, type: 'triangle' }, { f: 1568, d: 0.25, at: 0.2, type: 'triangle', g: 0.7 }],
    noise: { at: 0, d: 0.03, lo: 1800, hi: 4200, g: 0.4 },
  },
  bell: { blips: [{ f: 1318, d: 0.5, g: 0.8 }, { f: 1976, d: 0.4, g: 0.35 }] },
  fanfare: { blips: [{ f: 392, d: 0.14, type: 'triangle' }, { f: 523, d: 0.14, at: 0.12, type: 'triangle' }, { f: 659, d: 0.14, at: 0.24, type: 'triangle' }, { f: 784, d: 0.4, at: 0.36, type: 'triangle' }] },
};

/** Extra success variants; one is picked at random so repeated solves do not sound identical. */
export const SUCCESS_VARIANTS: Recipe[] = [
  RECIPES.success,
  { blips: [{ f: 523, d: 0.08 }, { f: 659, d: 0.08, at: 0.07 }, { f: 784, d: 0.18, at: 0.14 }] },
  { blips: [{ f: 784, d: 0.07 }, { f: 988, d: 0.07, at: 0.06 }, { f: 1319, d: 0.2, at: 0.12 }] },
];
