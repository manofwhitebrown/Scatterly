import type { PuzzleDef } from './types';

/** The three hint rungs: 0 nudge (where to look), 1 the rule restated, 2 a partial reveal (the generator's own hint). */
export type HintStep = 0 | 1 | 2;

/** Per-kind rung texts. `rule` may read the spec; `aha` is the one-line insight shown after solving. Pure data, no Phaser. */
export interface LadderText<S> { nudge: string; rule: (spec: S) => string; aha: string }

const fixed = (s: string) => (): string => s;
/** Types one entry against its own spec, then stores it spec-erased (the registry passes the matching spec). */
const entry = <S>(t: LadderText<S>): LadderText<unknown> => t as unknown as LadderText<unknown>;

export const LADDER: Record<string, LadderText<unknown>> = {
  code: entry({ nudge: 'The numbers you need are written on the notes you found. Check the Notes tab.', rule: (s: { digits: number }) => `Work out the sum or difference the lock asks for, then enter its ${s.digits} digits.`, aha: 'The lock never needed guessing: every digit was already on a note.' }),
  target: entry({ nudge: 'Try joining the two biggest numbers first, then see what is left to reach.', rule: fixed('Pick two numbers and an operation; the result joins the pool. Reach the target number exactly.'), aha: 'Work backwards from the target: what two numbers would make it?' }),
  sequence: entry({ nudge: 'Look at how much each term changes from the one before it.', rule: fixed('Every term follows the same rule: adding, multiplying, or alternating. Find it, then fill the gap.'), aha: 'Gaps between terms tell the story: the gaps often follow a pattern of their own.' }),
  lights: entry({ nudge: 'Each press also flips its neighbours. Start from the top row and work down.', rule: fixed('Switch every light off. A press flips that light and the ones touching it.'), aha: 'Fix the top row first; each row below it settles the row above.' }),
  slide: entry({ nudge: 'Solve the top row first, then the next, and leave the last rows for the end.', rule: fixed('Slide tiles into the gap until they are in order. Only tiles next to the gap can move.'), aha: 'Finish whole rows, never single tiles, and the last two rows cannot be undone.' }),
  pipes: entry({ nudge: 'Start at the source and follow the water; turn the first pipe that leaks.', rule: fixed('Tap a pipe to turn it. Connect the source to every sink.'), aha: 'Corner pieces and straight pieces are different jobs: place the corners first.' }),
  mastermind: entry({ nudge: 'Use a guess to test just one or two new symbols at a time.', rule: (s: { slots: number; repeats: boolean }) => `Find the ${s.slots}-symbol secret. A full match is in the right slot; a part match is the right symbol in the wrong slot.${s.repeats ? ' Symbols may repeat.' : ' No symbol repeats.'}`, aha: 'Each answer removes whole families of guesses: write down what it rules out.' }),
  memory: entry({ nudge: 'Say each pad out loud as it lights up. A rhythm is easier to keep than a picture.', rule: fixed('Watch the pads, then tap them in the same order.'), aha: 'Chunk the pattern into pairs and the long run feels short.' }),
  untangle: entry({ nudge: 'Pick a knot that sits in the middle of many crossings and move it out.', rule: fixed('Drag the knots until no two cords cross.'), aha: 'A tidy net has the outer knots on a loop and the rest tucked inside it.' }),
  sort: entry({ nudge: 'Read the rule at the top, then place the item you are most sure of.', rule: (s: { rule: string }) => `Put every item in its bin. ${s.rule}`, aha: 'Sort by one question at a time: it is the same question for every item.' }),
  word: entry({ nudge: 'Look at the clue line: it describes the word, it does not spell it.', rule: fixed('Fill in the letters to make the word the clue describes.'), aha: 'The clue and the letter count together leave only one word.' }),
  sudoku: entry({ nudge: 'Find a row, column or box that is nearly full.', rule: fixed('Every row, column and box holds each symbol exactly once.'), aha: 'Look for the symbol with only one place left to go.' }),
  kenken: entry({ nudge: 'Start with a cage that has one cell: its number is given.', rule: fixed('Each row and column holds each number once. Every cage must make its target with its sign.'), aha: 'Small cages first; a big product often has only one factor pair that fits.' }),
  balance: entry({ nudge: 'Compare the two scales that share a shape.', rule: fixed('Each scale is level. Use them together to find what the missing pan needs.'), aha: 'Swap one shape for what it equals and the puzzle shrinks.' }),
  dial: entry({ nudge: 'Try each button once and watch how far the dial moves.', rule: fixed('Press buttons to bring the dial to the mark. The dial wraps around.'), aha: 'Wrapping means a big jump forward is the same as a small step back.' }),
  tangram: entry({ nudge: 'Place the largest piece first: it has the fewest places to go.', rule: fixed('Fit every piece into the outline with no gaps and no overlaps.'), aha: 'Corners of the outline match corners of pieces.' }),
};

/** Wraps a definition so `hint(spec, progress, step)` serves the 3-rung ladder; no `step` keeps the old behaviour. */
export function withLadder<S, A>(kind: string, def: PuzzleDef<S, A>): PuzzleDef<S, A> {
  const text = LADDER[kind];
  if (!text) return def;
  return {
    ...def,
    hint: (spec, progress = 0, step) => {
      if (step === 0) return text.nudge;
      if (step === 1) return text.rule(spec);
      return def.hint(spec, progress, step);
    },
  };
}

/** One-line insight for the result screen. */
export function ahaLine(kind: string): string { return LADDER[kind]?.aha ?? ''; }
