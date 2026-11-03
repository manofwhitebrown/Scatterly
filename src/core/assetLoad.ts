import { addFrames, frame } from '../art/manifest';
import type { AtlasGroup } from '../art/manifest';
import { parseAtlas } from '../art/atlasJson';
import type { AtlasJson } from '../art/atlasJson';

/** Pure loading core: every browser or Phaser dependency is injected, so it is unit-testable. */
export interface LoadDeps {
  fetchJson(url: string): Promise<AtlasJson>;
  /** Decodes the PNG and registers it under `textureKey` with its frames; resolves the pixel size. */
  addTexture(textureKey: string, url: string, json: AtlasJson): Promise<{ w: number; h: number }>;
  delay(ms: number): Promise<void>;
}

export interface GroupStat { group: string; ok: boolean; bytes: number; tries: number; ms: number }

const loaded = new Map<string, Promise<GroupStat>>();
const stats = new Map<string, GroupStat>();

/** 'room:living' -> 'room-living' (file base name under public/atlas). */
export function groupFile(group: AtlasGroup): string {
  return group.replace(':', '-');
}

export const textureKeyOf = (group: AtlasGroup): string => `atlas:${group}`;

export const RETRIES = 3;
const BACKOFF_MS = [250, 750, 1500];

export function loadGroup(group: AtlasGroup, base: string, deps: LoadDeps, now: () => number = () => Date.now()): Promise<GroupStat> {
  const known = loaded.get(group);
  if (known) return known;
  const run = (async (): Promise<GroupStat> => {
    const t0 = now();
    const file = groupFile(group);
    let tries = 0;
    for (; tries < RETRIES; tries++) {
      try {
        const json = await deps.fetchJson(`${base}atlas/${file}.json`);
        const key = textureKeyOf(group);
        const size = await deps.addTexture(key, `${base}atlas/${json.meta.image}`, json);
        addFrames(parseAtlas(json, key));
        const s: GroupStat = { group, ok: true, bytes: size.w * size.h * 4, tries: tries + 1, ms: now() - t0 };
        stats.set(group, s);
        return s;
      } catch {
        if (tries < RETRIES - 1) await deps.delay(BACKOFF_MS[tries] ?? 1500);
      }
    }
    const failed: GroupStat = { group, ok: false, bytes: 0, tries, ms: now() - t0 };
    stats.set(group, failed);
    loaded.delete(group); // a later call may try again; callers fall back to procedural art meanwhile
    return failed;
  })();
  loaded.set(group, run);
  return run;
}

/** True when this key resolves to a loaded atlas frame (else the caller draws its procedural fallback). */
export const hasFrame = (key: string): boolean => frame(key) !== undefined;

export function textureBytes(): number {
  let n = 0;
  for (const s of stats.values()) n += s.bytes;
  return n;
}

export const groupStats = (): GroupStat[] => [...stats.values()];

/** Test hook: forget all state. */
export function resetAssets(): void {
  loaded.clear();
  stats.clear();
}
