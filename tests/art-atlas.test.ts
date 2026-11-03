import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseAtlas } from '../src/art/atlasJson';
import type { AtlasJson } from '../src/art/atlasJson';
import { addFrames, frame, isValidKey, setManifest } from '../src/art/manifest';

const load = (n: string): AtlasJson => JSON.parse(readFileSync(`public/atlas/${n}.json`, 'utf8')) as AtlasJson;

describe('packed atlases', () => {
  for (const name of ['core', 'room-slice']) {
    it(`${name}: every key valid, frame inside the atlas, pivot inside the frame`, () => {
      const json = load(name); const refs = parseAtlas(json, `atlas_${name}`);
      expect(refs.length).toBeGreaterThan(20);
      for (const r of refs) {
        expect(isValidKey(r.key), r.key).toBe(true);
        const f = json.frames[r.key].frame;
        expect(f.x + f.w).toBeLessThanOrEqual(json.meta.size.w);
        expect(f.y + f.h).toBeLessThanOrEqual(json.meta.size.h);
        expect(r.pivotX).toBeLessThanOrEqual(r.w); expect(r.pivotY).toBeLessThanOrEqual(r.h);
      }
    });
  }
  it('manifest resolves avatar walk with its animation tag; missing stays undefined', () => {
    setManifest({ version: 1, frames: {} });
    addFrames(parseAtlas(load('core'), 'atlas_core'));
    const f = frame('avatar/se/walk/3');
    expect(f?.tags?.['avatar/se/walk']).toEqual({ from: 0, to: 5, ms: 100 });
    expect(frame('spot/drawer/closed')).toBeUndefined();
  });
  it('room-slice has both states for the 7 container kinds and identical anchors and sizes', () => {
    const j = load('room-slice');
    for (const k of ['drawer', 'cabinet', 'fridge', 'wardrobe', 'shelf', 'sink', 'sideTable']) {
      expect(j.frames[`spot/${k}/closed`], k).toBeDefined(); expect(j.frames[`spot/${k}/open`], k).toBeDefined();
      const a = j.frames[`spot/${k}/closed`], b = j.frames[`spot/${k}/open`];
      expect(b.pivot).toEqual(a.pivot); expect([b.frame.w, b.frame.h]).toEqual([a.frame.w, a.frame.h]);
    }
  });
});
