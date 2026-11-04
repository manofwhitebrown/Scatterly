import { expect, test } from '@playwright/test';
import { PNG } from 'pngjs';
import { openGame } from './helpers';

/** An 8x8 two-colour checker drawn at x3 must land as exact 3x3 blocks (no smoothing, no sub-pixel blur). Reads the real composited page pixels. */
test('pixel crispness: an 8x8 sprite at x3 renders as exact blocks', async ({ page }) => {
  await openGame(page);
  // Canvas fallback (no WebGL) resamples differently from a phone GPU: never let this test pass or fail on it silently.
  expect(await page.evaluate(() => window.__scatterly!.game.renderer.type), 'renderer must be WebGL (Phaser.WEBGL = 2)').toBe(2);
  const box = await page.evaluate(() => {
    const game = window.__scatterly!.game;
    const scene = game.scene.getScenes(true)[0]!;
    const gfx = scene.make.graphics({ x: 0, y: 0 }, false);
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { gfx.fillStyle((x + y) % 2 ? 0xff0000 : 0x00ff00, 1); gfx.fillRect(x, y, 1, 1); }
    gfx.generateTexture('pixel-test', 8, 8);
    gfx.destroy();
    scene.add.image(300, 300, 'pixel-test').setOrigin(0, 0).setScale(3).setDepth(99999).setName('pixel-test');
    const r = game.canvas.getBoundingClientRect();
    return { x: r.left + 300 * (r.width / 1280), y: r.top + 300 * (r.height / 720), scale: r.width / 1280 };
  });
  expect(box.scale, 'canvas must be shown at 1:1 for this check').toBe(1);
  // The scene fades in from black at boot: wait until it is finished, otherwise the colours are mid-fade.
  await page.waitForFunction(() => window.__scatterly!.game.scene.getScenes(true).every((s) => !s.cameras.main.fadeEffect.isRunning), undefined, { timeout: 10_000 });
  await page.waitForTimeout(200);
  if (process.env.PIXDUMP) {
    const big = PNG.sync.read(await page.screenshot({ clip: { x: box.x - 4, y: box.y - 4, width: 36, height: 36 } }));
    for (let y = 0; y < 36; y++) console.log(Array.from({ length: 36 }, (_, x) => { const i = (y * 36 + x) * 4; return big.data[i] === 255 ? 'R' : big.data[i + 1] === 255 && big.data[i] === 0 ? 'G' : '.'; }).join(''));
  }
  const shot = PNG.sync.read(await page.screenshot({ clip: { x: box.x, y: box.y, width: 24, height: 24 } }));
  const at = (x: number, y: number): string => { const i = (y * 24 + x) * 4; return `${shot.data[i]},${shot.data[i + 1]},${shot.data[i + 2]}`; };
  for (let by = 0; by < 8; by++) for (let bx = 0; bx < 8; bx++) {
    const want = (bx + by) % 2 ? '255,0,0' : '0,255,0';
    for (let dy = 0; dy < 3; dy++) for (let dx = 0; dx < 3; dx++) expect(at(bx * 3 + dx, by * 3 + dy), `block ${bx},${by} px ${dx},${dy}`).toBe(want);
  }
});
