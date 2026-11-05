import { expect, test } from '@playwright/test';
import { openHome } from './helpers';

// [window w, window h, expected logical width]
const SIZES: Array<[number, number, number]> = [
  [1280, 720, 1280],
  [1200, 540, 1600],
  [800, 360, 1600],
  [1024, 768, 1280],
];

for (const [w, h, want] of SIZES) {
  test(`full-width layout at ${w}x${h}: logical width ${want}, canvas fills the window`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await openHome(page);
    const info = await page.evaluate(() => {
      const c = document.querySelector('canvas');
      const r = c?.getBoundingClientRect();
      return { size: window.__scatterly?.size, cw: r?.width ?? 0, ch: r?.height ?? 0, bg: getComputedStyle(document.body).backgroundColor };
    });
    expect(info.size).toEqual({ w: want, h: 720 });
    expect(info.bg).toBe('rgb(31, 58, 64)');
    // 16:9..21:9 windows are filled edge to edge (within 2 px); the 4:3 window keeps small bars top and bottom.
    if (w / h >= 16 / 9) {
      expect(Math.abs(info.cw - w)).toBeLessThanOrEqual(2);
      expect(Math.abs(info.ch - h)).toBeLessThanOrEqual(2);
    } else {
      expect(Math.abs(info.cw - w)).toBeLessThanOrEqual(2);
      expect(info.ch).toBeLessThan(h);
    }
  });
}

test('rotating the window resizes the game and shows the turn-your-phone overlay in portrait', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 540 });
  await openHome(page);
  await page.setViewportSize({ width: 540, height: 1200 });
  await expect(page.locator('#turn')).toBeVisible();
  await page.setViewportSize({ width: 1280, height: 720 });
  await expect(page.locator('#turn')).toBeHidden();
  await page.waitForFunction(() => window.__scatterly?.size.w === 1280, undefined, { timeout: 5_000 });
});
