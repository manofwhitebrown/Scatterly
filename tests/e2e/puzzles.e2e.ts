import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { interactives, openGame, waitScene, watchConsole } from './helpers';
import { IMPLEMENTED } from '../../src/puzzles/manifest';
import { PUZZLE_SCENE } from '../../src/shared/types';
import type { PuzzleKind } from '../../src/shared/types';

const LEGACY: PuzzleKind[] = ['untangle', 'sort', 'word']; // older scenes without the e2e solve hook
const NEW_KINDS = IMPLEMENTED.filter((k) => !LEGACY.includes(k));
const W = 1280;
const H = 720;

interface Box { label: string; x: number; y: number; w: number; h: number }

const overlap = (a: Box, b: Box): boolean =>
  Math.abs(a.x - b.x) * 2 < a.w + b.w - 4 && Math.abs(a.y - b.y) * 2 < a.h + b.h - 4;

async function closed(page: Page, kind: PuzzleKind): Promise<void> {
  await page.waitForFunction((k) => window.__scatterly?.activeScenes().includes(k) === false, PUZZLE_SCENE[kind], { timeout: 10_000 });
}

for (const kind of IMPLEMENTED) {
  test(`${kind}: opens at every difficulty, targets are sized and on screen, hint then skip report correctly`, async ({ page }) => {
    const soak = watchConsole(page);
    await openGame(page);
    for (const d of [1, 2, 3] as const) {
      await page.evaluate(([k, diff]) => window.__scatterly!.openPuzzle(k, diff, 400 + diff), [kind, d] as const);
      await waitScene(page, PUZZLE_SCENE[kind]);
      await page.waitForTimeout(700);
      const mine = (await interactives(page)).filter((i) => i.scene === PUZZLE_SCENE[kind] && i.w < W - 20);
      expect(mine.length, `${kind} d${d} has tappable objects`).toBeGreaterThan(3);
      for (const i of mine) {
        expect(i.x - i.w / 2, `${kind} d${d} "${i.label}" left edge`).toBeGreaterThanOrEqual(-1);
        expect(i.x + i.w / 2, `${kind} d${d} "${i.label}" right edge`).toBeLessThanOrEqual(W + 1);
        expect(i.y - i.h / 2, `${kind} d${d} "${i.label}" top edge`).toBeGreaterThanOrEqual(-1);
        expect(i.y + i.h / 2, `${kind} d${d} "${i.label}" bottom edge`).toBeLessThanOrEqual(H + 1);
      }
      if (NEW_KINDS.includes(kind)) {
        const small = mine.filter((i) => i.w < 96 || i.h < 96);
        expect.soft(small, `${kind} d${d} targets under 96x96: ${JSON.stringify(small)}`).toEqual([]);
        const clash: string[] = [];
        for (let a = 0; a < mine.length; a++) {
          for (let b = a + 1; b < mine.length; b++) {
            const A = mine[a]!;
            const B = mine[b]!;
            if (overlap(A, B)) clash.push(`"${A.label}" x "${B.label}"`);
          }
        }
        expect.soft(clash, `${kind} d${d} overlapping targets`).toEqual([]);
      }
      // hint counts as a hint, skip (confirmed) counts as another and reports skipped
      await page.evaluate(() => { const b = window.__scatterly!.puzzleBot(); b!.hint(); b!.skip(true); });
      await page.waitForFunction(() => window.__scatterly?.lastPuzzleResult != null, undefined, { timeout: 10_000 });
      const r = await page.evaluate(() => window.__scatterly!.lastPuzzleResult);
      expect(r?.skipped).toBe(true);
      expect(r?.solved).toBe(false);
      expect(r?.hints).toBe(2);
      await closed(page, kind);
    }
    expect(soak.errors).toEqual([]);
    expect(await page.evaluate(() => window.__scatterly!.errors().length)).toBe(0);
  });
}

for (const kind of NEW_KINDS) {
  test(`${kind}: the reference solution solves it through the scene's own handlers (all difficulties)`, async ({ page }) => {
    const soak = watchConsole(page);
    await openGame(page);
    for (const d of [1, 2, 3] as const) {
      await page.evaluate(([k, diff]) => window.__scatterly!.openPuzzle(k, diff, 900 + diff), [kind, d] as const);
      await waitScene(page, PUZZLE_SCENE[kind]);
      await page.waitForTimeout(500);
      await page.evaluate(() => window.__scatterly!.puzzleBot()!.autoSolve());
      await page.waitForFunction(() => window.__scatterly?.lastPuzzleResult != null, undefined, { timeout: 15_000 });
      const r = await page.evaluate(() => window.__scatterly!.lastPuzzleResult);
      expect(r?.solved, `${kind} d${d} solved`).toBe(true);
      expect(r?.skipped).toBe(false);
      await closed(page, kind);
    }
    expect(soak.errors).toEqual([]);
  });
}
