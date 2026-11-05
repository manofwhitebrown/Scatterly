import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { openHome } from './helpers';

type Probe = { state: string; decoded: number; failed: string[]; ambience: string | null; track: string; intensity: number };
const probe = (page: Page): Promise<Probe> => page.evaluate(() => window.__scatterly!.audio());

test('recorded audio loads, decodes and plays: sfx group, music loop, tension layer, room loops; nothing fails to fetch', async ({ page }) => {
  await openHome(page);
  await page.mouse.click(640, 360); // a real gesture unlocks the AudioContext
  await expect.poll(async () => (await probe(page)).state, { timeout: 10_000 }).toBe('running');
  await expect.poll(async () => (await probe(page)).decoded, { timeout: 40_000 }).toBeGreaterThanOrEqual(75); // 25 core sounds x 3 variants
  await page.evaluate(() => {
    const s = window.__scatterly!.sound;
    s.startMusic();
    s.setTrack('morning');
    s.setRoomAmbience('kitchen');
    s.setIntensity(0.9);
    s.preload('house');
    s.play('drawer'); // not loaded yet: must be silent or synthesised, never throw
  });
  // core 75 + house 90 + music morning + tension + amb kitchen = 168
  await expect.poll(async () => (await probe(page)).decoded, { timeout: 60_000 }).toBeGreaterThanOrEqual(168);
  const p = await probe(page);
  expect(p.failed).toEqual([]);
  expect(p.track).toBe('morning');
  expect(p.ambience).toBe('kitchen');
  expect(await page.evaluate(() => window.__scatterly!.errors().length)).toBe(0);
});
