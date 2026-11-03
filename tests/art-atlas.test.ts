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

describe('ui kit', () => {
  it('nine-slice frames carry borders smaller than the frame; buttons have 3 states per colourway', () => {
    const j = load('core'); const refs = parseAtlas(j, 'atlas_core');
    for (const k of ['ui/panel9', 'ui/panelDark9', 'ui/paper9', 'ui/tray9', 'ui/btn_wood_up']) {
      const r = refs.find((x) => x.key === k); expect(r?.slice, k).toBeDefined();
      const [l, t, rr, b] = r!.slice!; expect(l + rr).toBeLessThan(r!.w); expect(t + b).toBeLessThan(r!.h);
    }
    for (const c of ['wood', 'sage', 'terracotta']) for (const s of ['up', 'hover', 'pressed']) expect(j.frames[`ui/btn_${c}_${s}`], `${c} ${s}`).toBeDefined();
    expect(j.frames['ui/btn_wood_up'].frame.w).toBe(j.frames['ui/btn_wood_pressed'].frame.w);
  });
});

describe('item icons', () => {
  it('every ItemId has an icon frame in the core atlas', async () => {
    const { ITEM_IDS } = await import('../src/shared/types');
    const j = load('core');
    for (const id of ITEM_IDS) expect(j.frames[`icon/${id}`], id).toBeDefined();
  });
});
