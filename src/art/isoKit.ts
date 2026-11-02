import type Phaser from 'phaser';
import { SPOT_SIZE, tex } from '../shared/types';
import type { DecorDef, SpotKind } from '../shared/types';
import { DECOR } from '../logic';
import { ISO_DIMS } from './iso';
import { boxTextureFor, KIND_COLOR } from './isoBox';
import type { G } from './palette';

export interface IsoTask { key: string; w: number; h: number; draw: (g: G) => void }

const COSMETIC = [0xc9b8d9, 0xd9c0a0, 0xa9c9c0, 0xd9a9a9, 0xb9c9a0, 0xe0d4a0];

function propColor(def: DecorDef): number {
  if (def.kind === 'storage' && def.spotKind) return KIND_COLOR[def.spotKind];
  let h = 0;
  for (let i = 0; i < def.id.length; i++) h = (h * 31 + def.id.charCodeAt(i)) >>> 0;
  return COSMETIC[h % COSMETIC.length];
}

/** Kit v0: every spot kind closed + open, and every DECOR item, as plain extruded boxes. */
export function isoTasks(): IsoTask[] {
  const tasks: IsoTask[] = [];
  for (const kind of Object.keys(SPOT_SIZE) as SpotKind[]) {
    const t = boxTextureFor(ISO_DIMS[kind]);
    tasks.push({ key: tex.isoSpot(kind), w: t.w, h: t.h, draw: (g) => t.draw(g, KIND_COLOR[kind], false) });
    tasks.push({ key: tex.isoSpot(kind, true), w: t.w, h: t.h, draw: (g) => t.draw(g, KIND_COLOR[kind], true) });
  }
  for (const def of DECOR) {
    const dims = { w: Math.max(1, def.iso.w), d: Math.max(1, def.iso.d), h: Math.max(0, def.iso.h) };
    const t = boxTextureFor(dims);
    tasks.push({ key: tex.isoProp(def.id), w: t.w, h: t.h, draw: (g) => t.draw(g, propColor(def), false) });
  }
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
