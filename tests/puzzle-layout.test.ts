import { describe, expect, it } from 'vitest';
import { GAME_H, GAME_W } from '../src/shared/types';
import { BAR_TOP, BTN_H, KEY, KEYPAD_W, NOTES_LEFT, PH, PW, PX, PY } from '../src/puzzles/layout';



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
  it('mastermind: history, palette and Check button fit above the bar', () => {
    const history = PY + 90 + 9 * 46; // up to 9 attempts
    expect(history).toBeLessThanOrEqual(BAR_TOP);
    expect(PY + 508 + 48).toBeLessThanOrEqual(BAR_TOP);
    expect(PX + 720 + 162).toBeLessThanOrEqual(PX + PW);
  });
  it('memory: 3x3 pads and side panel fit', () => {
    const rowsH = 3 * 110 + 2 * 8;
    expect(PY + 250 + rowsH / 2).toBeLessThanOrEqual(BAR_TOP);
    expect(PY + 250 - rowsH / 2).toBeGreaterThanOrEqual(PY + 60);
    expect(PX + 740 + 130).toBeLessThanOrEqual(PX + PW);
  });
  it('keys are at least 96 px', () => {
    expect(KEY).toBeGreaterThanOrEqual(96);
  });

  it('Hint / Notes / Skip sit inside the panel, 96 px tall, and the panel stays on screen', () => {
    expect(BTN_H).toBe(96);
    expect(BAR_TOP + BTN_H).toBeLessThanOrEqual(PY + PH);
    expect(BAR_TOP).toBeGreaterThanOrEqual(PY + 560); // below every scene's content (see the bounds above)
    expect(PY).toBeGreaterThanOrEqual(0);
    expect(PY + PH).toBeLessThanOrEqual(720 - 8);
  });
});
