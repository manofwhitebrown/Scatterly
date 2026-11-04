import type Phaser from 'phaser';
import { KEY, KEY_GAP as GAP } from './layout';
import { PAL, makeButton } from './ui';

export { KEY, KEYPAD_W } from './layout';

export interface KeypadHandlers { digit(d: string): void; back(): void; enter(): void }

/**
 * Digits 0-4 over 5-9, with Back and Enter as a 6th column. Every key is 96x96.
 * `top` is the y of the first row's centre; the block is two rows tall (ends at top + 150).
 */
export function buildKeypad(scene: Phaser.Scene, left: number, top: number, h: KeypadHandlers): void {
  for (let d = 0; d < 10; d++) {
    const x = left + KEY / 2 + (d % 5) * (KEY + GAP);
    const y = top + (d < 5 ? 0 : KEY + GAP);
    makeButton(scene, x, y, KEY, KEY, String(d), () => h.digit(String(d)), { fill: PAL.terracotta, size: 44 });
  }
  const x = left + KEY / 2 + 5 * (KEY + GAP);
  makeButton(scene, x, top, KEY, KEY, 'Back', () => h.back(), { fill: PAL.steel, size: 28 });
  makeButton(scene, x, top + KEY + GAP, KEY, KEY, 'OK', () => h.enter(), { fill: PAL.sage, size: 40 });
}
