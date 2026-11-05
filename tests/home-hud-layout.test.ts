import { describe, expect, it } from 'vitest';
import { HUD_BTN, HUD_EDGE, hudBoxes, overlaps } from '../src/ui/hudLayout';
import type { Box } from '../src/ui/hudLayout';

const SIZES: Array<[number, number]> = [[1280, 720], [1400, 720], [1560, 720], [1680, 720]];

function named(w: number, h: number, tray: number, nav: number): Array<[string, Box]> {
  const b = hudBoxes(w, h, tray, nav);
  const out: Array<[string, Box]> = [['pause', b.pause], ['house', b.house], ['clues', b.clues], ['hint', b.hint], ['strip', b.strip], ['timer', b.timer], ['show', b.show], ['tray', b.tray]];
  b.nav.forEach((n, i) => out.push([`nav${i}`, n]));
  return out;
}

describe('HUD grid: nothing overlaps and everything stays on screen', () => {
  for (const [w, h] of SIZES) {
    for (const [tray, nav] of [[3, 3], [6, 3], [0, 0], [4, 2]] as const) {
      it(`${w}x${h}, ${tray} items, ${nav} room buttons`, () => {
        const items = named(w, h, tray, nav);
        for (let i = 0; i < items.length; i++) {
          const [name, r] = items[i];
          if (r.w === 0) continue;
          expect(r.x, `${name} left`).toBeGreaterThanOrEqual(HUD_EDGE);
          expect(r.y, `${name} top`).toBeGreaterThanOrEqual(HUD_EDGE);
          expect(r.x + r.w, `${name} right`).toBeLessThanOrEqual(w - HUD_EDGE);
          expect(r.y + r.h, `${name} bottom`).toBeLessThanOrEqual(h - HUD_EDGE);
          for (let j = i + 1; j < items.length; j++) expect(overlaps(r, items[j][1]), `${name} overlaps ${items[j][0]}`).toBe(false);
        }
      });
    }
  }

  it('every tappable target is at least 96 game px', () => {
    const b = hudBoxes(1280, 720, 4, 3);
    for (const r of [b.pause, b.house, b.clues, b.hint, b.show, ...b.nav]) {
      expect(r.w).toBeGreaterThanOrEqual(HUD_BTN);
      expect(r.h).toBeGreaterThanOrEqual(HUD_BTN);
    }
  });

  it('top-left pair, top-right pair and the bottom-right column sit at their screen corners', () => {
    const b = hudBoxes(1680, 720, 4, 3);
    expect(b.pause.x).toBe(HUD_EDGE);
    expect(b.hint.x + b.hint.w).toBe(1680 - HUD_EDGE);
    expect(b.nav[0].y + b.nav[0].h).toBe(720 - HUD_EDGE);
    expect(b.tray.x + b.tray.w / 2).toBe(840);
  });
});
