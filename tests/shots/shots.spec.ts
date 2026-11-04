import { test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { interactives, openGame, startMorning, tapMatch, waitScene } from '../e2e/helpers';
import { IMPLEMENTED } from '../../src/puzzles/manifest';
import { PUZZLE_SCENE } from '../../src/shared/types';
import type { PuzzleKind } from '../../src/shared/types';

/** Fixed-name screenshots for the manager. Run `npm run shots` (builds first). Output: docs/shots/<name>.png and <name>-800.png. */
const OUT = 'docs/shots';
const SHOT_PUZZLES: PuzzleKind[] = ['untangle', 'lights', 'mastermind'];
const SIZES = [{ w: 1280, h: 720, suffix: '' }, { w: 800, h: 360, suffix: '-800' }] as const;

/** Fails the run when the named scene is not active (and, for Home, when the old Menu is) so a shot can never show the wrong view. */
async function expectScene(page: Page, key: string): Promise<void> {
  const active = await page.evaluate(() => window.__scatterly?.activeScenes() ?? []);
  if (!active.includes(key)) throw new Error(`shot "${key}": active scenes are [${active.join(', ')}]`);
  if (key === 'Home' && active.includes('Menu')) throw new Error('shot "Home": old Menu is also active');
}

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

test('menu (old Menu, ?view=legacy)', async ({ page }) => {
  await openGame(page);
  await page.waitForTimeout(1500);
  await expectScene(page, 'Menu');
  await snap(page, 'menu');
});

test('home overview and focus rooms (the default URL boots Home)', async ({ page }) => {
  await page.goto('/?e2e=1');
  await waitScene(page, 'Home', 60_000);
  await page.waitForTimeout(2000);
  await expectScene(page, 'Home');
  await snap(page, 'home-overview');
  const rooms = ['entrance', 'living', 'kitchen', 'bedroom', 'bathroom', 'study'];
  for (const room of rooms) {
    const got = await page.evaluate((r) => {
      const sc = window.__scatterly?.game.scene.getScene('Home') as unknown as { __e2e?: { focus(room: string): void; focused(): string | null } } | null;
      if (!sc?.__e2e) return 'no-hooks';
      sc.__e2e.focus(r);
      return 'ok';
    }, room);
    if (got !== 'ok') throw new Error(`focus-${room}: Home __e2e hooks missing`);
    await page.waitForTimeout(1000);
    const focused = await page.evaluate(() => (window.__scatterly?.game.scene.getScene('Home') as unknown as { __e2e: { focused(): string | null } }).__e2e.focused());
    if (focused !== room) throw new Error(`focus-${room}: Home reports focused=${String(focused)}`);
    await snap(page, `focus-${room}`);
  }
});

for (const kind of SHOT_PUZZLES.filter((k) => IMPLEMENTED.includes(k))) {
  test(`puzzle ${kind}`, async ({ page }) => {
    await openGame(page);
    await page.evaluate((k) => window.__scatterly!.openPuzzle(k, 2, 401), kind);
    await waitScene(page, PUZZLE_SCENE[kind]);
    await page.waitForTimeout(1200);
    await expectScene(page, PUZZLE_SCENE[kind]);
    await snap(page, `puzzle-${kind}`);
  });
}

test('result', async ({ page }) => {
  await openGame(page);
  await startMorning(page, 'relaxed');
  // A real scenario from the running session, a synthetic 3-star result: no bot, so it cannot flake on slow GL.
  await page.evaluate(() => {
    const api = window.__scatterly!;
    const sc = (api.session() as { scenario: { id: string; targets: string[] } }).scenario;
    const result = {
      scenarioId: sc.id, mode: 'relaxed', targets: sc.targets, found: sc.targets, timeMs: 412000, searches: 14,
      hintsUsed: 0, timedOut: false, stars: 3, coinsEarned: 42, habitHits: [], newAchievements: [], puzzleLog: [],
    };
    api.game.scene.stop('Room');
    api.game.scene.start('Result', { result, scenario: sc });
  });
  await waitScene(page, 'Result', 30_000);
  await page.waitForTimeout(3000);
  await expectScene(page, 'Result');
  await snap(page, 'result');
});
