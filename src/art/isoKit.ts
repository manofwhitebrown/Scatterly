import type Phaser from 'phaser';
import { SPOT_SIZE, tex } from '../shared/types';
import type { SpotKind } from '../shared/types';
import { KIND_COLOR } from './isoBox';
import { badgeTasks } from './isoBadges';
import { propTasks } from './isoProps';
import { drawFurniture, furnitureSize } from './isoFurniture';
import type { G } from './palette';

export interface IsoTask { key: string; w: number; h: number; draw: (g: G) => void }

/** Kit v1: every spot kind closed + open, every PROPS variant, the 8 cosmetic decor pieces and the badges. */
export function isoTasks(): IsoTask[] {
  const tasks: IsoTask[] = [];
  for (const kind of Object.keys(SPOT_SIZE) as SpotKind[]) {
    const { w, h } = furnitureSize(kind);
    tasks.push({ key: tex.isoSpot(kind), w, h, draw: (g) => drawFurniture(g, kind, KIND_COLOR[kind], false) });
    tasks.push({ key: tex.isoSpot(kind, true), w, h, draw: (g) => drawFurniture(g, kind, KIND_COLOR[kind], true) });
  }
  for (const t of propTasks()) tasks.push(t);
  for (const b of badgeTasks()) tasks.push(b);
  return tasks;
}

/** Estimated GPU memory (RGBA) of every iso_* texture currently loaded, in bytes. */
export function isoTextureBytes(scene: Phaser.Scene): number {
  let total = 0;
  for (const key of scene.textures.getTextureKeys()) {
    if (!key.startsWith('iso_')) continue;
    const img = scene.textures.get(key).getSourceImage();
    total += img.width * img.height * 4;
  }
  return total;
}
