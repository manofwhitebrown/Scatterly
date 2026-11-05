import type { PuzzleKind } from '../shared/types';

/** One-sentence rules shown once per kind on first play (flag `profile.puzzles[kind].seen`). Pure data, no Phaser. */
export const HOWTO: Partial<Record<PuzzleKind, string>> = {
  untangle: 'Drag the knots until no two cords cross.',
  sort: 'Put each item in the right bin. The rule is shown at the top.',
  word: 'Spell the word the line above asks for. Tap the letters in order.',
  code: 'Enter the code. Clues you have found are in the Notes drawer.',
  target: 'Pick a number, an operation, then a number. Build the target.',
  sequence: 'Every number follows a rule. Find the one missing from the gap.',
  lights: 'Tapping a light flips it and its neighbours. Switch them all off.',
  slide: 'Slide the tiles into the empty space until the picture is in order.',
  pipes: 'Turn the pipe pieces so water can flow from the start to the end.',
  mastermind: 'Guess the hidden row. Pegs tell you how close you are.',
  memory: 'Watch the pads light up, then tap them in the same order.',
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
