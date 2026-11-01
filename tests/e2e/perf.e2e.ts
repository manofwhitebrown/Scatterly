import { expect, test } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dismissCards, metrics, openGame, startMorning, tapWhenReady, waitScene, watchConsole } from './helpers';

const THROTTLE = 4;

test('G4 leaks: 50x Room restart returns counts to baseline; G2 perf recorded with 4x CPU throttle', async ({ page, context }) => {
  test.setTimeout(1_500_000);
  const soak = watchConsole(page);
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: THROTTLE });
  const bootMs = await openGame(page);

  await startMorning(page, 'relaxed');
  await tapWhenReady(page, 'II');
  await tapWhenReady(page, 'Restart');
  await waitScene(page, 'Room');
  await dismissCards(page);
  await page.evaluate(() => window.__scatterly!.resetFrameStats());
  const base = await metrics(page);

  for (let i = 0; i < 50; i++) {
    if (i % 10 === 0) console.log(`restart ${i}/50`);
    await tapWhenReady(page, 'II', 0, 20_000);
    await tapWhenReady(page, 'Restart');
    await waitScene(page, 'Room');
    await dismissCards(page);
  }
  await page.waitForTimeout(2500);
  const end = await metrics(page);

  expect(end.textures).toBe(base.textures);
  expect(end.objects).toBe(base.objects);
  expect(end.tweens).toBe(base.tweens);
  if (end.heapMB !== null && base.heapMB !== null) expect(end.heapMB - base.heapMB).toBeLessThan(5);
  expect(soak.errors).toEqual([]);

  const record = { bootMs, p5Fps: end.p5Fps, p95Ms: end.p95Ms, maxMs: end.maxMs, slowFrames: end.slowFrames, throttle: THROTTLE,
    note: 'CI Chromium uses software GL: regression gate only, not an absolute 60 fps claim.' };
  mkdirSync('test-results', { recursive: true });
  writeFileSync('test-results/perf-current.json', JSON.stringify(record, null, 2));
});
