import { test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { openGame, playPerfect, startMorning, tapMatch, waitScene } from '../e2e/helpers';
import { IMPLEMENTED } from '../../src/puzzles/manifest';
import { PUZZLE_SCENE } from '../../src/shared/types';
import type { PuzzleKind } from '../../src/shared/types';

/** Fixed-name screenshots for the manager. Run `npm run shots` (builds first). Output: docs/shots/<name>.png and <name>-800.png. */
const OUT = 'docs/shots';
const SHOT_PUZZLES: PuzzleKind[] = ['untangle', 'lights', 'mastermind'];
const SIZES = [{ w: 1280, h: 720, suffix: '' }, { w: 800, h: 360, suffix: '-800' }] as const;

async function snap(page: Page, name: string): Promise<void> {
  for (const s of SIZES) {
    await page.setViewportSize({ width: s.w, height: s.h });
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${OUT}/${name}${s.suffix}.png`, type: 'png' });
  }
  await page.setViewportSize({ width: 1280, height: 720 });
}

/** Clicks through intro and coach cards (Start / Next / Got it) in whatever scene shows them. */
async function dismissAny(page: Page): Promise<void> {
  for (let i = 0; i < 12; i++) {
    await page.waitForTimeout(500);
    const labels = (await interactives(page)).map((x) => x.label);
    const btn = ['Start', 'Next', 'Got it'].find((l) => labels.includes(l));
    if (!btn) return;
    await tapMatch(page, btn);
  }
}

test.beforeAll(() => mkdirSync(OUT, { recursive: true }));

test('menu', async ({ page }) => {
  await openGame(page);
  await page.waitForTimeout(1500);
  await snap(page, 'menu');
});

test('home overview and focus rooms (?view=home)', async ({ page }) => {
  await page.goto('/?e2e=1&view=home'); // Boot hands over to Home directly
  await waitScene(page, 'Home', 60_000);
  await dismissAny(page);
  await page.waitForTimeout(2500);
  await snap(page, 'home-overview');
  if (await tapMatch(page, 'Play')) { // the small Play sheet over the house
    await page.waitForTimeout(800);
    await snap(page, 'home-play-sheet');
    await page.goto('/?e2e=1&view=home');
    await waitScene(page, 'Home', 60_000);
  await dismissAny(page);
    await page.waitForTimeout(1500);
  }
  const rooms = ['entrance', 'living', 'kitchen', 'bedroom', 'bathroom', 'study'];
  for (const room of rooms) {
    const ok = await page.evaluate((r) => {
      const sc = window.__scatterly?.game.scene.getScene('Home') as unknown as { __e2e?: { focus(room: string): void } } | null;
      if (!sc?.__e2e) return false;
      try { sc.__e2e.focus(r); return true; } catch { return false; }
    }, room);
    if (!ok) continue;
    await page.waitForTimeout(900);
    await snap(page, `focus-${room}`);
  }
});

for (const kind of SHOT_PUZZLES.filter((k) => IMPLEMENTED.includes(k))) {
  test(`puzzle ${kind}`, async ({ page }) => {
    await openGame(page);
    await page.evaluate((k) => window.__scatterly!.openPuzzle(k, 2, 401), kind);
    await waitScene(page, PUZZLE_SCENE[kind]);
    await page.waitForTimeout(1200);
    await snap(page, `puzzle-${kind}`);
  });
}

test('result', async ({ page }) => {
  test.setTimeout(600_000);
  test.setTimeout(600_000);
  await openGame(page);
  await startMorning(page, 'relaxed');
  await playPerfect(page);
  await waitScene(page, 'Result', 60_000);
  await page.waitForTimeout(2500);
  await snap(page, 'result');
});
