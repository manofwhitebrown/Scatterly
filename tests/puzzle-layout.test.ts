import { describe, expect, it } from 'vitest';
import { GAME_H, GAME_W } from '../src/shared/types';
import { BAR_TOP, KEY, KEYPAD_W, NOTES_LEFT, PH, PW, PX, PY } from '../src/puzzles/layout';



describe('puzzle layout guards', () => {
  it('panel sits inside the screen', () => {
    expect(PX + PW).toBeLessThanOrEqual(GAME_W);
    expect(PY + PH).toBeLessThanOrEqual(GAME_H);
  });
  it('keypad rows end above the bottom bar and left of the notes drawer', () => {
    for (const top of [PY + 400, PY + 390]) {
      const bottom = top + KEY + 6 + KEY / 2; // centre of the 2nd row plus half a key
      expect(bottom).toBeLessThanOrEqual(BAR_TOP);
    }
    expect(PX + 16 + KEYPAD_W).toBeLessThanOrEqual(NOTES_LEFT);
  });
  it('target scene rows end above the bottom bar', () => {
    expect(PY + 496 + 48).toBeLessThanOrEqual(BAR_TOP);
  });
  it('5x5 lights grid fits between the title and the bottom bar', () => {
    const top = PY + 56;
    expect(top).toBeGreaterThanOrEqual(PY + 54); // below the title line
    expect(top + 5 * 96 + 4 * 3).toBeLessThanOrEqual(BAR_TOP);
  });
  it('slide grid and side panel stay inside the panel', () => {
    expect(PY + 120 + 3 * 96 + 2 * 6).toBeLessThanOrEqual(BAR_TOP);
    expect(PX + 740 + 110).toBeLessThanOrEqual(PX + PW);
  });
  it('keys are at least 96 px', () => {
    expect(KEY).toBeGreaterThanOrEqual(96);
  });
});
