import { describe, expect, it } from 'vitest';
import { STAIRS } from '../src/content/world';
import { HOUSE_WORLD, OVERVIEW_INSETS, FOCUS_INSETS, focusCamera, houseBounds, overviewCamera, roomBounds, roomPolygon } from '../src/scenes/homeWorld';
import type { CameraState, Rect } from '../src/scenes/homeWorld';
import { stairsPolygon, stairsTarget } from '../src/scenes/homeStairs';
import { PARALLAX, SKY_BANDS, hillY } from '../src/scenes/homeSky';

const W = 1280; const H = 720;
const onScreen = (r: Rect, c: CameraState): Rect => ({ x: (r.x - c.cx) * c.zoom + W / 2, y: (r.y - c.cy) * c.zoom + H / 2, w: r.w * c.zoom, h: r.h * c.zoom });

describe('Focus view fits the whole room on screen', () => {
  for (const s of HOUSE_WORLD) {
    it(`${s.room}: fully inside the viewport, inside the insets, centred`, () => {
      const r = onScreen(roomBounds(s.room), focusCamera(s.room, W, H));
      expect(r.x).toBeGreaterThanOrEqual(FOCUS_INSETS.left - 0.5);
      expect(r.y).toBeGreaterThanOrEqual(FOCUS_INSETS.top - 0.5);
      expect(r.x + r.w).toBeLessThanOrEqual(W - FOCUS_INSETS.right + 0.5);
      expect(r.y + r.h).toBeLessThanOrEqual(H - FOCUS_INSETS.bottom + 0.5);
      expect(Math.abs(r.x + r.w / 2 - W / 2)).toBeLessThan(1);
      expect(Math.abs(r.y + r.h / 2 - H / 2)).toBeLessThan(1);
    });
  }
});

describe('Overview fits the whole house and keeps the button band free', () => {
  it('house inside the viewport above the bottom band', () => {
    const r = onScreen(houseBounds(), overviewCamera(W, H));
    expect(r.x).toBeGreaterThanOrEqual(0);
    expect(r.x + r.w).toBeLessThanOrEqual(W);
    expect(r.y).toBeGreaterThanOrEqual(0);
    expect(r.y + r.h).toBeLessThanOrEqual(H - OVERVIEW_INSETS.bottom + 0.5);
  });
});

describe('Overview crispness', () => {
  it('is 1x at 1280x720 (the whole set-back house fits) and still fits the viewport', () => {
    const c = overviewCamera(W, H);
    expect(c.zoom).toBe(1);
    expect(Number.isInteger(c.zoom * 2)).toBe(true);
  });
});

describe('Stairs', () => {
  it('are a tappable shape in both connected rooms and lead to the other floor', () => {
    const low = stairsPolygon(STAIRS.lower)!; const up = stairsPolygon(STAIRS.upper)!;
    const mid = (p: Array<{ x: number; y: number }>): { x: number; y: number } => ({ x: p.reduce((a, q) => a + q.x, 0) / p.length, y: p.reduce((a, q) => a + q.y, 0) / p.length });
    expect(stairsTarget(STAIRS.lower, mid(low))).toBe(STAIRS.upper);
    expect(stairsTarget(STAIRS.upper, mid(up))).toBe(STAIRS.lower);
    expect(stairsTarget('kitchen', mid(low))).toBeUndefined();
  });
});

describe('Set-back layout', () => {
  it('an upper room sits above the ground-floor room, not over its floor', () => {
    const upperBottom = Math.max(...roomPolygon('bedroom').map((q) => q.y));
    const floorBack = roomBounds('living').y + 64; // the ground room's back-corner floor point
    expect(upperBottom).toBeLessThanOrEqual(floorBack + 8);
  });
});

describe('Morning sky', () => {
  it('has 6 bands and deterministic hills', () => {
    expect(SKY_BANDS).toHaveLength(6);
    expect(hillY(300, 0)).toBe(hillY(300, 0));
    expect(hillY(300, 0)).not.toBe(hillY(300, 1));
    expect(PARALLAX).toBe(0.3);
  });
});

import { nextShimmer } from '../src/scenes/homeShimmer';
describe('idle shimmer order', () => {
  it('cycles through unopened pieces and skips nothing', () => {
    const ids = ['a', 'b', 'c'] as never[];
    expect(nextShimmer(ids, null)).toBe('a');
    expect(nextShimmer(ids, 'a' as never)).toBe('b');
    expect(nextShimmer(ids, 'c' as never)).toBe('a');
    expect(nextShimmer([], null)).toBeNull();
    expect(nextShimmer(['x'] as never[], 'gone' as never)).toBe('x');
  });
});

import { clampCamera, panCamera, pinchCamera } from '../src/scenes/homeGesture';
describe('gestures', () => {
  const base = overviewCamera(1280, 720);
  it('drag moves the world with the finger', () => {
    const c = panCamera(base, 30, -20);
    expect(c.cx).toBeCloseTo(base.cx - 30 / base.zoom); expect(c.cy).toBeCloseTo(base.cy + 20 / base.zoom);
  });
  it('pinch is clamped around the fitted zoom and the house cannot be dragged away', () => {
    expect(pinchCamera(base, 10, base).zoom).toBeCloseTo(base.zoom * 2);
    expect(pinchCamera(base, 0.01, base).zoom).toBeCloseTo(base.zoom * 0.85);
    const far = clampCamera({ zoom: 1, cx: 1e6, cy: -1e6 });
    expect(far.cx).toBeLessThan(houseBounds().x + houseBounds().w + 61);
  });
});

import { catDelay, entryCell, facingOf, walkMs } from '../src/scenes/homeWalk';
describe('avatar and cat timing', () => {
  it('walks at most 600 ms and instantly when calm/Rush/off', () => {
    expect(walkMs(20, false)).toBe(600); expect(walkMs(3, false)).toBe(220);
    expect(walkMs(20, true)).toBe(0); expect(walkMs(1, false)).toBe(0);
  });
  it('faces the way it moves and keeps facing when still', () => {
    expect(facingOf(5)).toBe('se'); expect(facingOf(-5)).toBe('sw'); expect(facingOf(0, 'sw')).toBe('sw');
  });
  it('enters at front-centre and the cat wanders every 8-14 s', () => {
    expect(entryCell(12, 9)).toEqual({ x: 6, y: 7 });
    expect(catDelay(0)).toBe(8000); expect(catDelay(1)).toBe(14000); expect(catDelay(5)).toBe(14000);
  });
});

import { urgencyAt } from '../src/scenes/feelMath';
describe('Rush urgency window', () => {
  it('starts at 20 s, ramps music 0.6 to 1, pulses and turns red late', () => {
    expect(urgencyAt(21)).toBeNull(); expect(urgencyAt(0)).toBeNull();
    expect(urgencyAt(20)!.intensity).toBeCloseTo(0.6); expect(urgencyAt(20)!.pulse).toBe(false);
    expect(urgencyAt(1)!.intensity).toBe(1);
    expect(urgencyAt(10)!.pulse).toBe(true); expect(urgencyAt(5)!.red).toBe(true); expect(urgencyAt(6)!.red).toBe(false);
  });
});

import { glowKey } from '../src/scenes/homeGlow';
describe('window glow keys', () => {
  it('day R/L = 0/1, night R/L = 2/3', () => {
    expect([glowKey('R', false), glowKey('L', false), glowKey('R', true), glowKey('L', true)]).toEqual(['fx/windowGlow/0', 'fx/windowGlow/1', 'fx/windowGlow/2', 'fx/windowGlow/3']);
  });
});
