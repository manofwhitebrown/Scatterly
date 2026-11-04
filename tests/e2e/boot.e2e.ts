import { expect, test } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { openGame } from './helpers';

/** Menu interactive time. Software GL (CI, sandboxes) is far slower than a phone GPU, so the hard gate is a regression
 *  ceiling; the phone target (3 s at 4x CPU throttle) is recorded, not claimed. */
for (const rate of [1, 4]) {
  test(`boot: Menu active at ${rate}x CPU throttle`, async ({ page, context }) => {
    const cdp = await context.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate });
    const ms = await openGame(page);
    const jsKB = await page.evaluate(() => Math.round(performance.getEntriesByType('resource').filter((r) => r.name.endsWith('.js')).reduce((n, r) => n + (r as PerformanceResourceTiming).transferSize, 0) / 1024));
    mkdirSync('test-results', { recursive: true });
    writeFileSync(`test-results/boot-${rate}x.json`, JSON.stringify({ rate, menuActiveMs: ms, jsTransferKB: jsKB, renderer: 'software GL' }, null, 2));
    console.log(`BOOT ${rate}x: ${ms} ms, js ${jsKB} KB`);
    expect(ms).toBeLessThan(rate === 1 ? 8000 : 30_000);
  });
}
