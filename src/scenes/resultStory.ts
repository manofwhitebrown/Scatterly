import { ITEM_LABEL } from '../shared/types';
import type { ItemId } from '../shared/types';

export const STAR_STEP_MS = 240;
export const STAR_FIRST_MS = 150;

/** One line about habit hits (items found in their usual spot), or null when there were none. */
export function habitLine(hits: readonly ItemId[]): string | null {
  if (hits.length === 0) return null;
  const names = hits.slice(0, 3).map((i) => ITEM_LABEL[i].toLowerCase());
  const more = hits.length > 3 ? ` +${hits.length - 3}` : '';
  return `Habit hit: ${names.join(', ')}${more} in the usual spot`;
}

/** Gap between timeline lines so the whole evening reveals in about 3 s, never faster than 120 ms. */
export function revealStepMs(lines: number): number {
  return lines <= 0 ? 0 : Math.max(120, Math.min(380, Math.floor(3000 / lines)));
}
