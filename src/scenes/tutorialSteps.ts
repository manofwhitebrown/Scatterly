import type { Spot } from '../shared/types';

export type TutorialStepId = 'tap' | 'lock' | 'notebook' | 'mark' | 'done';

export interface TutorialStep {
  id: TutorialStepId;
  text: string;
  /** Informational steps move on by themselves after this many ms (no action to wait for). */
  autoMs?: number;
}

export const LOCK_TEXT_HERE = 'A padlock means a puzzle. Tap it to solve it.';
export const LOCK_TEXT_ELSEWHERE = 'Some furniture has a padlock. Solving its puzzle opens it.';

export const TUTORIAL_STEPS: readonly TutorialStep[] = [
  { id: 'tap', text: 'Tap the glowing furniture to search it.' },
  { id: 'lock', text: LOCK_TEXT_HERE },
  { id: 'notebook', text: 'Tap Clues to read what you have found.' },
  { id: 'mark', text: 'Not sure? Press and hold furniture to mark it.' },
  { id: 'done', text: "That's it. Good luck!", autoMs: 2500 },
];

/** The step after `cur`, or null after the last one. */
export function nextStep(cur: TutorialStepId): TutorialStep | null {
  const i = TUTORIAL_STEPS.findIndex((s) => s.id === cur);
  return TUTORIAL_STEPS[i + 1] ?? null;
}

/**
 * Which furniture to glow. 'free': the first unlocked, unsearched container (by id, so it is the same every time and
 * never depends on what is inside). 'locked': the first padlocked container still shut. Null when there is none.
 */
export function pickTarget(spots: readonly Spot[], gates: Readonly<Record<string, unknown>>, opened: (id: string) => boolean, want: 'free' | 'locked'): Spot | null {
  const ok = spots
    .filter((s) => s.capacity > 0 && !opened(s.id) && (want === 'locked') === (gates[s.id] !== undefined))
    .sort((a, b) => a.id.localeCompare(b.id));
  return ok[0] ?? null;
}
