import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { interactives, openHome, tapMatch } from './helpers';

interface Rect { id: string; x: number; y: number; w: number; h: number }
type Hooks = { hud(): Rect[]; focus(room: string): void; overview(): void };

const hud = (page: Page): Promise<Rect[]> =>
  page.evaluate(() => (window.__scatterly!.game.scene.getScene('Home') as unknown as { __e2e: Hooks }).__e2e.hud());

/** Fails with the names of the first pair of HUD elements that intersect. */
export function firstOverlap(rects: Rect[]): string | null {
  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      const a = rects[i]; const b = rects[j];
      if (a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h) return `${a.id} overlaps ${b.id}`;
    }
  }
  return null;
}

/** Plays the real flow: Play -> Start, then closes intro and coach cards, so the in-game HUD exists. */
async function startRun(page: Page): Promise<void> {
  expect(await tapMatch(page, 'Play')).toBe(true);
  await page.waitForTimeout(800);
  expect(await tapMatch(page, 'Start')).toBe(true);
  for (let i = 0; i < 10; i++) {
    await page.waitForTimeout(600);
    const labels = (await interactives(page)).map((x) => x.label);
    const btn = ['Start', 'Next', 'Got it'].find((l) => labels.includes(l));
    if (!btn) break;
    await tapMatch(page, btn);
  }
}

const ROOMS = ['entrance', 'living', 'kitchen', 'bedroom', 'bathroom', 'study'];

for (const [w, h] of [[1280, 720], [800, 360]] as const) {
  test(`no HUD elements overlap at ${w}x${h}: Overview, every focused room, Play sheet`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await openHome(page);
    await page.waitForTimeout(1500);
    expect(firstOverlap(await hud(page))).toBeNull();
    await startRun(page);
    expect((await hud(page)).length, 'in-run HUD is empty').toBeGreaterThan(0);
    for (const room of ROOMS) {
      await page.evaluate((r) => (window.__scatterly!.game.scene.getScene('Home') as unknown as { __e2e: Hooks }).__e2e.focus(r), room);
      await page.waitForTimeout(900);
      const rects = await hud(page);
      expect(rects.length, `${room}: hud() returned nothing`).toBeGreaterThan(0);
      expect(firstOverlap(rects), `focus ${room}`).toBeNull();
    }
    await page.evaluate(() => (window.__scatterly!.game.scene.getScene('Home') as unknown as { __e2e: Hooks }).__e2e.overview());
    await page.waitForTimeout(900);
    expect(firstOverlap(await hud(page)), 'overview in run').toBeNull();
  });
}
