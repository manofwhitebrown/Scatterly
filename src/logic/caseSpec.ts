import type { GameMode, SessionLength } from '../shared/types';

/** What a case should look like for a given day, mode and session length. Pure; the generator and the sim read it. */
export interface CaseSpec {
  /** Target playing time of the whole case in minutes (par, not a limit). */
  minutes: number;
  /** Items to find (4-5: the templates hold at most five). */
  targets: number;
  /** Padlocked containers in total, decoys included. */
  gatesMin: number;
  gatesMax: number;
  /** Gates that become compound (a second puzzle stage after the first). */
  chainsMin: number;
  chainsMax: number;
  /** Extra puzzle stages on a compound gate (1-2) and on the finale (1-2). Longer sessions chain deeper. */
  chainDepth: 1 | 2;
  finaleDepth: 1 | 2;
  /** The last target sits behind a code lock that needs facts from three clues. */
  finale: boolean;
  /** False for the gentle days, Rush and the Daily: those keep the classic generator. */
  scaled: boolean;
}

/** Day ramp for Relaxed: day 1 at most 10 min, then about 15, 20, 25, and 30 from day 5. */
export const DAY_RAMP: readonly number[] = [8, 15, 20, 25, 30];
export const LENGTH_FACTOR: Record<SessionLength, number> = { short: 0.5, standard: 1, long: 1.5 };
const RUSH_MINUTES = 12;

export function caseMinutes(day: number, length: SessionLength, mode: GameMode): number {
  if (mode === 'rush') return RUSH_MINUTES;
  const base = DAY_RAMP[Math.min(Math.max(day, 1), DAY_RAMP.length) - 1] as number;
  // Days 1-2 are gentle whatever the setting says; from day 3 the length setting scales the ramp.
  return day <= 2 ? base : Math.round(base * LENGTH_FACTOR[length]);
}

export function caseSpec(day: number, length: SessionLength, mode: GameMode): CaseSpec {
  const minutes = caseMinutes(day, length, mode);
  const scaled = mode === 'relaxed' && day >= 3 && minutes >= 15;
  if (!scaled) {
    return { minutes, targets: 3, gatesMin: 0, gatesMax: 0, chainsMin: 0, chainsMax: 0, chainDepth: 1, finaleDepth: 1, finale: false, scaled: false };
  }
  const gatesMax = Math.min(12, Math.round(minutes / 2.5));
  const gatesMin = Math.min(gatesMax, Math.max(4, Math.round(minutes * 0.27)));
  const chains = minutes >= 45 ? [7, 8] : minutes >= 30 ? [6, 7] : minutes >= 25 ? [3, 4] : minutes >= 20 ? [3, 3] : [2, 2];
  return {
    minutes, targets: minutes >= 30 ? 5 : 4, gatesMin, gatesMax,
    chainsMin: chains[0] as number, chainsMax: chains[1] as number, finale: minutes >= 25, scaled: true,
    chainDepth: minutes >= 20 ? 2 : 1, finaleDepth: minutes >= 25 ? 2 : 1,
  };
}
