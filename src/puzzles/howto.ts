import type { PuzzleKind } from '../shared/types';

/** One-sentence rules shown once per kind on first play (flag `profile.puzzles[kind].seen`). Pure data, no Phaser. */
export const HOWTO: Partial<Record<PuzzleKind, string>> = {
  untangle: 'Drag the dots until no two lines cross.',
  sort: 'Move items between containers until each one holds a single kind.',
  word: 'Fill the letter slots. Tap a slot, then a letter.',
  code: 'Enter the code. Clues you have found are in the Notes drawer.',
  target: 'Tap the targets in the order the rule says.',
  sequence: 'Watch the pattern, then repeat it in the same order.',
  lights: 'Tapping a light flips it and its neighbours. Turn them all on.',
  slide: 'Slide the tiles into the empty space until the picture is in order.',
  pipes: 'Turn the pipe pieces so water can flow from the start to the end.',
  mastermind: 'Guess the hidden colour row. Pegs tell you how close you are.',
  memory: 'Flip two cards at a time and find every matching pair.',
};
export const HOWTO_FALLBACK = 'Look for the pattern, then try one small change.';

export function howToText(kind: PuzzleKind): string {
  return HOWTO[kind] ?? HOWTO_FALLBACK;
}

/** The hint ladder: each press costs a hint and climbs one rung; the last rung repeats. */
export const HINT_STEPS = ['Nudge', 'The rule', 'Partial reveal'] as const;
export type HintStep = 0 | 1 | 2;

export function hintStep(presses: number): HintStep {
  return Math.max(0, Math.min(HINT_STEPS.length - 1, presses - 1)) as HintStep;
}

export function hintLabel(presses: number): string {
  const s = hintStep(presses);
  return `Hint ${s + 1}/${HINT_STEPS.length} · ${HINT_STEPS[s]}`;
}
