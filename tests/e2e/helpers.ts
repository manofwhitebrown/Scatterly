import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { ITEM_LABEL } from '../../src/shared/types';
import type { ItemId } from '../../src/shared/types';
import type { Interactive } from '../../src/core/e2e';
import type { Metrics } from '../../src/core/metrics';

const BROWSER_NOISE = /GroupMarkerNotSet|software WebGL|GPU stall|swiftshader|ReadPixels/i;

export interface Soak { errors: string[] }

/** Collects console errors, warnings, page errors and unhandled rejections (gate G3). */
export function watchConsole(page: Page): Soak {
  const soak: Soak = { errors: [] };
  page.on('console', (m) => {
    if (m.type() !== 'error' && m.type() !== 'warning') return;
    if (BROWSER_NOISE.test(m.text())) return; // headless Chromium software-GL chatter, not game output
    soak.errors.push(`${m.type()}: ${m.text()}`);
  });
  page.on('pageerror', (e) => soak.errors.push(`pageerror: ${e.message}`));
  return soak;
}

export async function openGame(page: Page, query = ''): Promise<number> {
  const t0 = Date.now();
  await page.goto(`/?e2e=1${query}`);
  await page.waitForFunction(() => window.__scatterly?.activeScenes().includes('Menu') === true, undefined, { timeout: 60_000 });
  return Date.now() - t0;
}

export const scenes = (page: Page): Promise<string[]> => page.evaluate(() => window.__scatterly?.activeScenes() ?? []);
export const metrics = (page: Page): Promise<Metrics> => page.evaluate(() => window.__scatterly!.metrics());
export const interactives = (page: Page): Promise<Interactive[]> => page.evaluate(() => window.__scatterly!.interactives());

export async function waitScene(page: Page, key: string, timeout = 20_000): Promise<void> {
  await page.waitForFunction((k) => window.__scatterly?.activeScenes().includes(k) === true, key, { timeout });
}

/** A REAL pointer click at game coordinates, mapped through the canvas rectangle. */
export async function tapAt(page: Page, x: number, y: number): Promise<void> {
  const p = await page.evaluate(([gx, gy]) => window.__scatterly!.toClient(gx as number, gy as number), [x, y]);
  await page.mouse.click(p.x, p.y);
}

/** Taps the nth (left to right) visible tappable whose label or texture matches. Returns false if none. */
export async function tapMatch(page: Page, match: string | RegExp, nth = 0): Promise<boolean> {
  const all = await interactives(page);
  const hits = all
    .filter((i) => (typeof match === 'string' ? i.label === match || i.texture === match : match.test(i.label) || match.test(i.texture)))
    .sort((a, b) => a.x - b.x || a.y - b.y);
  const hit = hits[nth];
  if (!hit) return false;
  await tapAt(page, hit.x, hit.y);
  return true;
}

export async function tapWhenReady(page: Page, match: string | RegExp, nth = 0, timeout = 15_000): Promise<void> {
  try {
    await expect.poll(() => tapMatch(page, match, nth), { timeout, intervals: [150, 250, 400] }).toBe(true);
  } catch (err) {
    const seen = (await interactives(page)).map((i) => `${i.scene}:${i.label || i.texture}@${Math.round(i.x)},${Math.round(i.y)} ${Math.round(i.w)}x${Math.round(i.h)}`);
    throw new Error(`no tappable "${String(match)}" [active ${(await scenes(page)).join('+')}] visible: ${seen.join(' | ')}\n${String(err)}`);
  }
}

/** Goes Menu -> ModeSelect -> chosen mode, then clicks through intro and coach cards until spots are tappable. */
export async function startMorning(page: Page, mode: 'rush' | 'relaxed' | 'daily'): Promise<void> {
  await tapWhenReady(page, 'Play');
  await waitScene(page, 'ModeSelect');
  await tapWhenReady(page, 'Start', ['rush', 'relaxed', 'daily'].indexOf(mode));
  await waitScene(page, 'Room');
  await dismissCards(page);
}

export async function dismissCards(page: Page): Promise<void> {
  for (let i = 0; i < 12; i++) {
    await page.waitForTimeout(350);
    const labels = (await interactives(page)).filter((x) => x.scene === 'Room').map((x) => x.label);
    const btn = ['Start', 'Next', 'Got it'].find((l) => labels.includes(l));
    if (!btn) return;
    await tapMatch(page, btn);
  }
}

interface Plan { target: string; spotId: string; room: string; x: number; y: number; gated: boolean }

/** Ground-truth route from the generated scenario (the logic solver confirms solvability in unit tests). */
export async function readPlan(page: Page): Promise<{ plans: Plan[]; startRoom: string; rooms: string[] }> {
  return page.evaluate(() => {
    const s = window.__scatterly!.session() as {
      scenario: { startRoom: string; targets: string[]; placement: Record<string, string>; gates: Record<string, unknown> };
      spotsIn(room: string): { id: string; x: number; y: number }[];
    };
    const rooms = ['entrance', 'living', 'kitchen', 'bedroom', 'bathroom'];
    const plans = s.scenario.targets.map((t) => {
      const id = s.scenario.placement[t] as string;
      const room = id.split('.')[0] as string;
      const sp = s.spotsIn(room).find((q) => q.id === id);
      return { target: t, spotId: id, room, x: sp?.x ?? 0, y: sp?.y ?? 0, gated: id in s.scenario.gates };
    });
    return { plans, startRoom: s.scenario.startRoom, rooms };
  });
}

export async function currentRoomIndex(page: Page): Promise<number> {
  return page.evaluate(() => {
    const r = window.__scatterly!.game.scene.getScene('Room') as unknown as { view?: { room: string | null } };
    return ['entrance', 'living', 'kitchen', 'bedroom', 'bathroom'].indexOf(r.view?.room ?? '');
  });
}

export async function gotoRoom(page: Page, room: string): Promise<void> {
  const order = ['entrance', 'living', 'kitchen', 'bedroom', 'bathroom'];
  for (let guard = 0; guard < 8; guard++) {
    const cur = await currentRoomIndex(page);
    const want = order.indexOf(room);
    if (cur === want) return;
    await page.keyboard.press(want > cur ? 'ArrowRight' : 'ArrowLeft');
    await page.waitForTimeout(600);
  }
}

/** Plays the morning perfectly using only real pointer taps, solving or skipping gates. Ends on Result. */
export async function playPerfect(page: Page): Promise<void> {
  const { plans } = await readPlan(page);
  for (const p of plans) {
    const label = ITEM_LABEL[p.target as ItemId];
    let taken = false;
    for (let attempt = 0; attempt < 5 && !taken; attempt++) {
      // A puzzle opened late by a slow frame is resolved first; the reopened item panel may already show the item.
      if (await puzzleOpen(page)) {
        await resolveGate(page);
        await waitScene(page, 'Room');
        await waitIdle(page);
        if (await pollTap(page, label, 3_000)) { taken = true; break; }
      }
      await gotoRoom(page, p.room);
      await waitIdle(page);
      await tapAt(page, p.x, p.y);
      await page.waitForTimeout(700);
      if (process.env.BOT_DEBUG) console.log('BOT', p.target, 'attempt', attempt, JSON.stringify(await scenes(page)));
      if (await puzzleOpen(page)) {
        await resolveGate(page);
        await waitScene(page, 'Room');
        await waitIdle(page);
        if (await pollTap(page, label, 3_000)) { taken = true; break; }
        await tapAt(page, p.x, p.y);
        await page.waitForTimeout(700);
      }
      if (await pollTap(page, label, 6_000)) taken = true;
      else await tapMatch(page, '✕');
    }
    if (!taken) {
      const dbg = await page.evaluate(() => {
        const r = window.__scatterly!.game.scene.getScene('Room') as unknown as { view?: { room: string | null } };
        return r.view?.room ?? 'none';
      });
      throw new Error(`could not take ${p.target} at ${p.spotId} (${Math.round(p.x)},${Math.round(p.y)}) gated=${String(p.gated)} planned=${plans.map((q) => q.spotId).join(',')} viewRoom=${dbg}`);
    }
    await page.waitForTimeout(900);
  }
  try {
    await waitScene(page, 'Result', 90_000);
  } catch (err) {
    const seen = (await interactives(page)).filter((i) => i.label).map((i) => `${i.scene}:${i.label}`).slice(0, 20);
    throw new Error(`never reached Result [active ${(await scenes(page)).join('+')}] tappable: ${seen.join(' | ')}\n${String(err)}`);
  }
}

/** Taps the label as soon as it shows up (frames are slow under software GL, so a fixed wait is flaky). */
async function pollTap(page: Page, label: string, ms: number): Promise<boolean> {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (await tapMatch(page, label)) return true;
    if (await puzzleOpen(page)) return false; // let the caller resolve it
    await page.waitForTimeout(250);
  }
  return false;
}

const puzzleOpen = async (page: Page): Promise<boolean> => (await scenes(page)).some((k) => k.startsWith('Puzzle'));

async function waitIdle(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const r = window.__scatterly!.game.scene.getScene('Room') as unknown as { view?: { switching: boolean } };
    return r.view?.switching !== true;
  }, undefined, { timeout: 10_000 });
  await page.waitForTimeout(300);
}

async function resolveGate(page: Page): Promise<void> {
  for (let i = 0; i < 40; i++) {
    if (!(await scenes(page)).some((k) => k.startsWith('Puzzle'))) return;
    if (await tapMatch(page, 'Skip')) {
      await page.waitForTimeout(900);
      await tapWhenReady(page, 'Skip it'); // Skip asks to confirm
      return;
    }
    await page.waitForTimeout(500);
  }
}
