import { describe, expect, it } from 'vitest';
import { LAYOUT, applyLayout, computeLayout, isPortrait } from '../src/core/layout';

describe('layout', () => {
  const sizes: Array<[number, number, number]> = [
    [1280, 720, 1280], // 16:9
    [1200, 540, 1600], // 20:9 phone
    [800, 360, 1600],  // small 20:9
    [1024, 768, 1280], // 4:3 clamps to the minimum
    [3440, 1440, 1680], // ultrawide clamps to the maximum
  ];
  for (const [ww, wh, want] of sizes) {
    it(`${ww}x${wh} -> width ${want}, within 1280..1680`, () => {
      const l = computeLayout(ww, wh);
      expect(l.w).toBe(want);
      expect(l.w).toBeGreaterThanOrEqual(1280);
      expect(l.w).toBeLessThanOrEqual(1680);
      expect(l.h).toBe(720);
      expect(l.safeX).toBe((l.w - 1280) / 2);
    });
  }
  it('bad sizes fall back to 1280', () => {
    expect(computeLayout(0, 0).w).toBe(1280);
    expect(computeLayout(NaN, 500).w).toBe(1280);
  });
  it('applyLayout updates LAYOUT in place and reports changes', () => {
    expect(applyLayout(1200, 540)).toBe(true);
    expect(LAYOUT.w).toBe(1600);
    expect(LAYOUT.safeX).toBe(160);
    expect(applyLayout(1200, 540)).toBe(false);
    applyLayout(1280, 720);
    expect(LAYOUT.safeX).toBe(0);
  });
  it('portrait detection', () => {
    expect(isPortrait(360, 800)).toBe(true);
    expect(isPortrait(800, 360)).toBe(false);
  });
});
