import Phaser from 'phaser';
import { frame } from '../art/manifest';
import { project } from './homeWorld';
import { yardPlan } from './homeYardPlan';

/** Bakes the exterior into ONE RenderTexture (art px, origin top-left of `rect`). Frames that are missing are skipped. */
export function bakeYard(scene: Phaser.Scene): Phaser.GameObjects.RenderTexture {
  const items = yardPlan();
  const px = items.map((i) => project(i.gx + 0.5, i.gy + 0.5));
  const x0 = Math.min(...px.map((p) => p.x)) - 64; const y0 = Math.min(...px.map((p) => p.y)) - 64;
  const w = Math.max(...px.map((p) => p.x)) + 64 - x0; const h = Math.max(...px.map((p) => p.y)) + 32 - y0;
  const rt = scene.add.renderTexture(x0, y0, Math.ceil(w), Math.ceil(h)).setOrigin(0, 0);
  items.forEach((it, i) => {
    const f = frame(it.key);
    if (f) rt.drawFrame(f.atlas, f.frame, Math.round(px[i].x - x0 - f.pivotX), Math.round(px[i].y - y0 - f.pivotY));
  });
  rt.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
  return rt;
}
