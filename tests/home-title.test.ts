import { describe, expect, it } from 'vitest';
import { WORLD_ROOMS } from '../src/content/world';
import { overviewCamera, roomPolygon } from '../src/scenes/homeWorld';
import type { Pt } from '../src/scenes/homeWorld';
import { overlaps, titleBox } from '../src/ui/hudLayout';
import type { Box } from '../src/ui/hudLayout';

// Window shapes the owner and manager use: 1280x720 (16:9), 1366x640 and 1200x540 (20:9 phones), a wide 1680x720.
const VIEWS: Array<[number, number]> = [[1280, 720], [1537, 720], [1600, 720], [1680, 720]];

const segHit = (a: Pt, b: Pt, c: Pt, d: Pt): boolean => {
  const o = (p: Pt, q: Pt, r: Pt): number => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
  return o(a, b, c) * o(a, b, d) < 0 && o(c, d, a) * o(c, d, b) < 0;
};
const inPoly = (poly: Pt[], p: Pt): boolean => {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i]; const b = poly[j];
    if ((a.y > p.y) !== (b.y > p.y) && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) hit = !hit;
  }
  return hit;
};
/** Does a convex-or-not polygon touch the rectangle? */
function polyHitsBox(poly: Pt[], r: Box): boolean {
  const corners: Pt[] = [{ x: r.x, y: r.y }, { x: r.x + r.w, y: r.y }, { x: r.x + r.w, y: r.y + r.h }, { x: r.x, y: r.y + r.h }];
  if (poly.some((p) => p.x > r.x && p.x < r.x + r.w && p.y > r.y && p.y < r.y + r.h)) return true;
  if (corners.some((c) => inPoly(poly, c))) return true;
  for (let i = 0; i < poly.length; i++) for (let k = 0; k < 4; k++) if (segHit(poly[i], poly[(i + 1) % poly.length], corners[k], corners[(k + 1) % 4])) return true;
  return false;
}

describe('Overview: the title never covers a room', () => {
  for (const [w, h] of VIEWS) {
    it(`${w}x${h}`, () => {
      const cam = overviewCamera(w, h);
      const toScreen = (p: Pt): Pt => ({ x: (p.x - cam.cx) * cam.zoom + w / 2, y: (p.y - cam.cy) * cam.zoom + h / 2 });
      const title = titleBox(w);
      for (const room of WORLD_ROOMS) {
        const poly = roomPolygon(room).map(toScreen);
        expect(polyHitsBox(poly, title), `${room} under the title`).toBe(false);
      }
      expect(overlaps(title, { x: 0, y: 0, w: 0, h: 0 })).toBe(false);
    });
  }

  it('the house is centred on the screen width', () => {
    for (const [w, h] of VIEWS) {
      const cam = overviewCamera(w, h);
      const xs = WORLD_ROOMS.flatMap((r) => roomPolygon(r)).map((p) => (p.x - cam.cx) * cam.zoom + w / 2);
      const mid = (Math.min(...xs) + Math.max(...xs)) / 2;
      expect(Math.abs(mid - w / 2), `${w}`).toBeLessThan(w * 0.06);
    }
  });
});
