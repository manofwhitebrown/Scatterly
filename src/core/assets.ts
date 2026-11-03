import type Phaser from 'phaser';
import type { AtlasGroup } from '../art/manifest';
import type { AtlasJson } from '../art/atlasJson';
import { loadGroup } from './assetLoad';
import type { LoadDeps } from './assetLoad';

export { hasFrame, textureBytes, groupStats } from './assetLoad';
export type { GroupStat } from './assetLoad';

const BASE = (import.meta.env.BASE_URL as string | undefined) ?? '/';

function phaserDeps(scene: Phaser.Scene): LoadDeps {
  return {
    fetchJson: async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
      return (await res.json()) as AtlasJson;
    },
    addTexture: (key, url, json) =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          try {
            const tex = scene.textures.exists(key) ? scene.textures.get(key) : scene.textures.addImage(key, img);
            if (!tex) throw new Error(`texture ${key} not created`);
            for (const [name, f] of Object.entries(json.frames)) if (!tex.has(name)) tex.add(name, 0, f.frame.x, f.frame.y, f.frame.w, f.frame.h);
            tex.setFilter(0); // NEAREST: crisp pixels
            resolve({ w: img.naturalWidth, h: img.naturalHeight });
          } catch (e) {
            reject(e instanceof Error ? e : new Error(String(e)));
          }
        };
        img.onerror = () => reject(new Error(`image failed ${url}`));
        img.src = url;
      }),
    delay: (ms) => new Promise((r) => window.setTimeout(r, ms)),
  };
}

/**
 * Loads one atlas group (retries with backoff, idempotent). Never rejects: on failure the group's frames stay
 * undefined and callers draw their procedural art.
 */
export async function ensureGroup(scene: Phaser.Scene, group: AtlasGroup): Promise<void> {
  await loadGroup(group, BASE, phaserDeps(scene));
}

/** Fire-and-forget background loading, one group at a time so the menu stays responsive. */
export function prefetchGroups(scene: Phaser.Scene, groups: readonly AtlasGroup[]): void {
  void (async () => {
    for (const g of groups) await ensureGroup(scene, g);
  })();
}
