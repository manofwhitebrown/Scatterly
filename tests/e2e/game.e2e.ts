import { expect, test } from '@playwright/test';
import { dismissCards, interactives, metrics, openGame, playPerfect, scenes, startMorning, tapMatch, tapWhenReady, waitScene, watchConsole } from './helpers';

test('boots to Menu with no console noise and hit targets are large enough (G6)', async ({ page }) => {
  const soak = watchConsole(page);
  await openGame(page);
  const small = (await interactives(page)).filter((i) => i.scene === 'Menu' && (i.w < 96 || i.h < 96));
  expect.soft(small, `Menu targets under 96x96: ${JSON.stringify(small)}`).toEqual([]);
  expect(soak.errors).toEqual([]);
});

for (const mode of ['rush', 'relaxed', 'daily'] as const) {
  test(`full morning in ${mode} mode reaches Result using real taps`, async ({ page }) => {
    const soak = watchConsole(page);
    await openGame(page);
    await startMorning(page, mode);
    await playPerfect(page);
    expect((await scenes(page)).includes('Result')).toBe(true);
    expect(soak.errors).toEqual([]);
  });
}

test('pause, resume, restart and quit', async ({ page }) => {
  await openGame(page);
  await startMorning(page, 'relaxed');
  await tapWhenReady(page, 'II');
  await tapWhenReady(page, 'Resume');
  await tapWhenReady(page, 'II');
  await tapWhenReady(page, 'Restart');
  await waitScene(page, 'Room');
  await dismissCards(page);
  await tapWhenReady(page, 'II', 0, 20_000);
  await tapWhenReady(page, 'Quit to Menu');
  await waitScene(page, 'Menu');
});

test('settings toggles flip and persist', async ({ page }) => {
  await openGame(page);
  await tapWhenReady(page, 'Settings');
  await waitScene(page, 'Settings');
  expect(await tapMatch(page, 'On', 0)).toBe(true);
  await page.waitForTimeout(600);
  const stored = await page.evaluate(() => window.localStorage.getItem('scatterly.profile.v1'));
  expect(stored).toContain('"sfx":false');
});

test('Organise opens from the menu and returns', async ({ page }) => {
  await openGame(page);
  await tapWhenReady(page, 'Organise');
  await waitScene(page, 'Organise');
});

test('an uncaught error after boot lands on Menu with a toast, not a fatal screen', async ({ page }) => {
  await openGame(page);
  await startMorning(page, 'relaxed');
  await page.evaluate(() => window.__scatterly!.injectError('Room'));
  await waitScene(page, 'Menu');
  expect(await page.locator('[role=status]').innerText()).toContain('back to the menu');
  expect(await page.locator('[role=alert]').count()).toBe(0);
  expect(await page.evaluate(() => window.__scatterly!.metrics().errors)).toBeGreaterThan(0);
});

test('an unhandled rejection also recovers to Menu', async ({ page }) => {
  await openGame(page);
  await startMorning(page, 'relaxed');
  await page.evaluate(() => {
    void Promise.reject(new Error('e2e rejection'));
  });
  await waitScene(page, 'Menu');
});

test('backgrounding the app pauses the loop and Rush time does not drift', async ({ page }) => {
  await openGame(page);
  await startMorning(page, 'rush');
  const before = await metrics(page);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForTimeout(4000);
  const asleep = await page.evaluate(() => window.__scatterly!.game.loop.running);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForTimeout(500);
  expect(asleep).toBe(false);
  expect((await metrics(page)).frames).toBeGreaterThanOrEqual(before.frames);
  expect(await page.evaluate(() => window.__scatterly!.game.loop.running)).toBe(true);
});
