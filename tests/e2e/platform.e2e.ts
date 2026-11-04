import { expect, test } from '@playwright/test';
import { dismissHowTo, interactives, openGame, waitScene, watchConsole } from './helpers';
import { PUZZLE_SCENE } from '../../src/shared/types';

const open = (page: import('@playwright/test').Page, seed: number): Promise<void> =>
  page.evaluate((s) => window.__scatterly!.openPuzzle('lights', 1, s), seed);
const press = (page: import('@playwright/test').Page): Promise<string> => page.evaluate(() => window.__scatterly!.pressBack());
const active = (page: import('@playwright/test').Page): Promise<string[]> => page.evaluate(() => window.__scatterly!.activeScenes());

test('Android Back: rules card, then skip prompt, then the puzzle; nothing left means unhandled', async ({ page }) => {
  const soak = watchConsole(page);
  await openGame(page);
  await open(page, 31);
  await waitScene(page, PUZZLE_SCENE.lights);
  await page.waitForTimeout(400);
  expect((await interactives(page)).some((i) => i.label === 'Got it'), 'first play shows the rules card').toBe(true);
  expect(await press(page)).toBe('handled');
  await page.waitForTimeout(100);
  expect((await interactives(page)).some((i) => i.label === 'Got it'), 'Back closed the card').toBe(false);
  expect(await active(page)).toContain(PUZZLE_SCENE.lights);
  const seen = await page.evaluate(() => (window.__scatterly!.game.registry.get('profile') as { puzzles: Record<string, { seen: boolean } | undefined> }).puzzles.lights?.seen);
  expect(seen, 'closing the card with Back still marks the kind as seen').toBe(true);

  await page.evaluate(() => window.__scatterly!.puzzleBot()!.skip(false)); // opens the "skip?" prompt
  expect(await press(page)).toBe('handled');
  expect(await active(page), 'Back only closed the prompt').toContain(PUZZLE_SCENE.lights);

  expect(await press(page)).toBe('handled');
  await page.waitForFunction((k) => !window.__scatterly!.activeScenes().includes(k), PUZZLE_SCENE.lights, { timeout: 10_000 });
  expect(await page.evaluate(() => window.__scatterly!.lastPuzzleResult)).toMatchObject({ solved: false, skipped: false });
  expect(soak.errors).toEqual([]);
});

test('Back on a puzzle without a card leaves it; app background stops the loop and foreground restarts it', async ({ page }) => {
  await openGame(page);
  await open(page, 32);
  await waitScene(page, PUZZLE_SCENE.lights);
  await dismissHowTo(page);

  const frames = (): Promise<number> => page.evaluate(() => window.__scatterly!.game.loop.frame);
  await page.evaluate(() => window.__scatterly!.setBackground(true));
  expect(await page.evaluate(() => window.__scatterly!.backgrounded())).toBe(true);
  await page.waitForTimeout(300);
  const a = await frames();
  await page.waitForTimeout(600);
  expect(await frames(), 'no frames while backgrounded').toBe(a);
  await page.evaluate(() => window.__scatterly!.setBackground(true)); // idempotent
  await page.evaluate(() => window.__scatterly!.setBackground(false));
  await page.waitForFunction((n) => window.__scatterly!.game.loop.frame > n, a, { timeout: 10_000 }); // software GL renders only a few fps

  expect(await press(page)).toBe('handled');
  await page.waitForFunction((k) => !window.__scatterly!.activeScenes().includes(k), PUZZLE_SCENE.lights, { timeout: 10_000 });
});
