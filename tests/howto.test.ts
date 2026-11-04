import { describe, expect, it } from 'vitest';
import { HINT_STEPS, HOWTO, HOWTO_FALLBACK, hintLabel, hintStep, howToText } from '../src/puzzles/howto';
import { IMPLEMENTED } from '../src/puzzles/manifest';

describe('how-to cards', () => {
  it('every implemented puzzle kind has its own one-sentence rule', () => {
    for (const k of IMPLEMENTED) {
      expect(HOWTO[k], k).toBeTruthy();
      expect(howToText(k)).not.toBe(HOWTO_FALLBACK);
      expect(howToText(k).length, k).toBeLessThan(110);
    }
  });
  it('kinds without a scene fall back to the generic line', () => {
    expect(howToText('gears')).toBe(HOWTO_FALLBACK);
  });
});

describe('hint ladder', () => {
  it('climbs nudge -> rule -> partial reveal and then repeats the last rung', () => {
    expect([1, 2, 3, 4, 9].map(hintStep)).toEqual([0, 1, 2, 2, 2]);
    expect(HINT_STEPS).toEqual(['Nudge', 'The rule', 'Partial reveal']);
  });
  it('never goes below rung 0 and labels the rung', () => {
    expect(hintStep(0)).toBe(0);
    expect(hintLabel(2)).toBe('Hint 2/3 · The rule');
  });
});
