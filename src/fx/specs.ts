import type { FxName } from './names';

export type FxTex = 'dot' | 'star' | 'ring' | 'confetti' | 'mote';

export interface FxSpec {
  tex: FxTex;
  count: number;
  tints: readonly number[];
  speed: readonly [number, number];
  life: readonly [number, number];
  gravity: number;
  scaleFrom: number;
  scaleTo: number;
  /** Direction in radians (-PI/2 is up) and spread in radians (2*PI is a full burst). */
  angle: number;
  spread: number;
  spin: number;
  /** Optional full-screen flash: colour, peak alpha, duration in ms. */
  flash?: { color: number; alpha: number; ms: number };
  /** Delay in ms before the burst appears. */
  delay?: number;
}

export const MAX_PARTICLES = 60;
export const MAX_CONFETTI = 40;
const UP = -Math.PI / 2;
const FULL = Math.PI * 2;
const WARM = [0xffd966, 0xffb347, 0xfff1b8] as const;
const CONFETTI = [0xe57373, 0xffd54f, 0x81c784, 0x64b5f6, 0xba68c8, 0xffb74d] as const;

/** Feel Spec as data: event -> particles. Counts are already within the caps. */
export const FX_SPECS: Record<FxName, FxSpec> = {
  tap: { tex: 'dot', count: 5, tints: [0xd8c3a5, 0xc9b08c], speed: [30, 90], life: [0.18, 0.3], gravity: 40, scaleFrom: 0.5, scaleTo: 0.1, angle: UP, spread: FULL, spin: 0 },
  open: { tex: 'mote', count: 6, tints: [0xfff1b8, 0xffffff], speed: [20, 70], life: [0.3, 0.5], gravity: -20, scaleFrom: 0.8, scaleTo: 0.2, angle: UP, spread: 1.2, spin: 0 },
  empty: { tex: 'dot', count: 3, tints: [0xb8b0a4], speed: [20, 50], life: [0.15, 0.25], gravity: 60, scaleFrom: 0.4, scaleTo: 0.1, angle: UP, spread: 1.6, spin: 0 },
  found: { tex: 'star', count: 10, tints: WARM, speed: [90, 190], life: [0.35, 0.6], gravity: 120, scaleFrom: 0.7, scaleTo: 0.1, angle: UP, spread: FULL, spin: 4, flash: { color: 0xfff1b8, alpha: 0.28, ms: 80 } },
  take: { tex: 'dot', count: 6, tints: [0xfff1b8, 0xffd966], speed: [40, 100], life: [0.2, 0.35], gravity: 0, scaleFrom: 0.5, scaleTo: 0.05, angle: UP, spread: FULL, spin: 0 },
  clue: { tex: 'mote', count: 5, tints: [0xfff8ea, 0xe2cfaa], speed: [30, 80], life: [0.3, 0.5], gravity: 30, scaleFrom: 0.7, scaleTo: 0.2, angle: UP, spread: 1.4, spin: 2 },
  hint: { tex: 'ring', count: 1, tints: [0x9ad0ff], speed: [0, 0], life: [0.5, 0.5], gravity: 0, scaleFrom: 0.2, scaleTo: 2.6, angle: UP, spread: 0, spin: 0 },
  room: { tex: 'mote', count: 8, tints: [0xffffff, 0xfff1b8], speed: [140, 260], life: [0.25, 0.4], gravity: 0, scaleFrom: 0.6, scaleTo: 0.1, angle: 0, spread: 0.5, spin: 0, flash: { color: 0xffffff, alpha: 0.12, ms: 120 } },
  urgent: { tex: 'ring', count: 1, tints: [0xff6b5b], speed: [0, 0], life: [0.4, 0.4], gravity: 0, scaleFrom: 0.6, scaleTo: 1.8, angle: UP, spread: 0, spin: 0, flash: { color: 0xc62828, alpha: 0.16, ms: 160 } },
  win: { tex: 'confetti', count: MAX_CONFETTI, tints: CONFETTI, speed: [160, 380], life: [0.9, 1.6], gravity: 360, scaleFrom: 1, scaleTo: 0.8, angle: UP, spread: 2.2, spin: 6 },
  lose: { tex: 'dot', count: 6, tints: [0x9aa4ae, 0x7d8791], speed: [10, 40], life: [0.4, 0.7], gravity: 90, scaleFrom: 0.6, scaleTo: 0.2, angle: Math.PI / 2, spread: 1.2, spin: 0, flash: { color: 0x3a4048, alpha: 0.22, ms: 300 } },
  coin: { tex: 'star', count: 5, tints: [0xffd54f, 0xffe082], speed: [60, 140], life: [0.3, 0.5], gravity: 160, scaleFrom: 0.5, scaleTo: 0.1, angle: UP, spread: 1.8, spin: 5 },
  star: { tex: 'star', count: 12, tints: WARM, speed: [80, 200], life: [0.4, 0.7], gravity: 100, scaleFrom: 0.8, scaleTo: 0.1, angle: UP, spread: FULL, spin: 3 },
  buy: { tex: 'star', count: 9, tints: [0x9ad98f, 0xffe082, 0xffffff], speed: [80, 170], life: [0.3, 0.55], gravity: 140, scaleFrom: 0.6, scaleTo: 0.1, angle: UP, spread: FULL, spin: 4 },
  unlock: { tex: 'mote', count: 14, tints: [0xfff1b8, 0xffd966, 0xffffff], speed: [100, 240], life: [0.4, 0.7], gravity: 40, scaleFrom: 0.9, scaleTo: 0.1, angle: UP, spread: FULL, spin: 0, flash: { color: 0xfff8ea, alpha: 0.3, ms: 140 } },
  puzzleOk: { tex: 'star', count: 8, tints: [0x9ad98f, 0xfff1b8], speed: [70, 170], life: [0.3, 0.55], gravity: 90, scaleFrom: 0.6, scaleTo: 0.1, angle: UP, spread: FULL, spin: 3 },
};

/** How many particles a spec may add right now, given what is alive. Never exceeds the caps. */
export function allowedCount(spec: FxSpec, alive: number, aliveConfetti: number): number {
  const room = Math.max(0, MAX_PARTICLES - alive);
  const cap = spec.tex === 'confetti' ? Math.max(0, MAX_CONFETTI - aliveConfetti) : room;
  return Math.min(spec.count, room, cap);
}
