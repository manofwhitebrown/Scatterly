import { beforeEach, describe, expect, it } from 'vitest';
import { groupFile, hasFrame, loadGroup, resetAssets, textureBytes, RETRIES } from '../src/core/assetLoad';
import type { LoadDeps } from '../src/core/assetLoad';
import type { AtlasJson } from '../src/art/atlasJson';
import { setManifest } from '../src/art/manifest';

const json: AtlasJson = {
  meta: { image: 'x.png', group: 'room:test', size: { w: 64, h: 32 }, frameTags: [] },
  frames: { 'prop/test_lamp': { frame: { x: 0, y: 0, w: 8, h: 8 }, pivot: { x: 4, y: 8 } } },
};

function deps(failTimes: number, counter: { n: number }): LoadDeps {
  return {
    fetchJson: async () => { if (counter.n++ < failTimes) throw new Error('net'); return json; },
    addTexture: async () => ({ w: 64, h: 32 }),
    delay: async () => undefined,
  };
}

describe('asset loader core', () => {
  beforeEach(() => { resetAssets(); setManifest({ version: 1, frames: {} }); });

  it('maps group names to file names', () => {
    expect(groupFile('room:living')).toBe('room-living');
    expect(groupFile('core')).toBe('core');
  });
  it('loads a group once, registers frames and counts memory', async () => {
    const c = { n: 0 };
    const s = await loadGroup('room:test', '/', deps(0, c));
    expect(s.ok).toBe(true);
    expect(hasFrame('prop/test_lamp')).toBe(true);
    expect(textureBytes()).toBe(64 * 32 * 4);
    await loadGroup('room:test', '/', deps(0, c));
    expect(c.n).toBe(1); // second call reused the first
  });
  it('retries after transient failures', async () => {
    const s = await loadGroup('room:test', '/', deps(2, { n: 0 }));
    expect(s.ok).toBe(true);
    expect(s.tries).toBe(3);
  });
  it('never throws on permanent failure and leaves frames undefined (fallback)', async () => {
    const s = await loadGroup('room:test', '/', deps(99, { n: 0 }));
    expect(s.ok).toBe(false);
    expect(s.tries).toBe(RETRIES);
    expect(hasFrame('prop/test_lamp')).toBe(false);
    const again = await loadGroup('room:test', '/', deps(0, { n: 0 }));
    expect(again.ok).toBe(true); // a failed group can be retried later
  });
});

describe('pack-atlas', () => {
  it('derives atlas groups from folder names', async () => {
    const { groupOf } = await import('../scripts/pack-atlas.mjs');
    expect(groupOf('room-slice')).toBe('room:slice');
    expect(groupOf('puzzle-lights')).toBe('puzzle:lights');
    expect(groupOf('core')).toBe('core');
  });
});
