import { describe, expect, it, vi } from 'vitest';

vi.mock('phaser', () => ({ default: {}, Scenes: { Events: {} } }));

import { depthKey, faceShade, ISO_DIMS, isoToScreen, screenToIso, boxTexture } from '../src/art/iso';
import { DEFAULT_ROOM, shellSize, SHELL_MAX } from '../src/art/isoShell';
import { isoTasks } from '../src/art/isoKit';
import { LEGACY_ROOMS, SPOT_SIZE, tex } from '../src/shared/types';
import { DECOR } from '../src/logic';

describe('iso math', () => {
  it('projects 2:1 and round-trips', () => {
    expect(isoToScreen(0, 0)).toEqual({ x: 0, y: 0 });
    expect(isoToScreen(1, 0)).toEqual({ x: 32, y: 16 });
    expect(isoToScreen(0, 1)).toEqual({ x: -32, y: 16 });
    expect(isoToScreen(2, 2, 3).y).toBe(64 - 48);
    for (const [gx, gy, gz] of [[0, 0, 0], [3.5, 1.25, 2], [7, 7, 6]]) {
      const s = isoToScreen(gx, gy, gz);
      const b = screenToIso(s.x, s.y, gz);
      expect(b.gx).toBeCloseTo(gx, 6);
      expect(b.gy).toBeCloseTo(gy, 6);
    }
  });
  it('depthKey puts nearer pieces in front', () => {
    const back = depthKey({ gx: 0, gy: 0, w: 1, d: 1, h: 4 });
    const front = depthKey({ gx: 3, gy: 3, w: 1, d: 1, h: 1 });
    expect(front).toBeGreaterThan(back);
  });
  it('faceShade is light top, mid left, dark right', () => {
    const f = faceShade(0x808080);
    const lum = (c: number): number => ((c >> 16) & 255) + ((c >> 8) & 255) + (c & 255);
    expect(lum(f.top)).toBeGreaterThan(lum(f.left));
    expect(lum(f.left)).toBeGreaterThan(lum(f.right));
  });
});

describe('iso kit coverage', () => {
  it('has dims for every spot kind and bounded texture sizes', () => {
    for (const k of Object.keys(SPOT_SIZE)) {
      const d = ISO_DIMS[k as keyof typeof ISO_DIMS];
      expect(d, k).toBeDefined();
      const t = boxTexture(d);
      expect(t.w).toBeLessThanOrEqual(400);
      expect(t.h).toBeLessThanOrEqual(400);
    }
  });
  it('plans 20 kinds x 2 states plus one prop per decor item, with unique convention keys', () => {
    const keys = isoTasks().map((t) => t.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const k of Object.keys(SPOT_SIZE)) {
      expect(keys).toContain(tex.isoSpot(k as keyof typeof ISO_DIMS));
      expect(keys).toContain(tex.isoSpot(k as keyof typeof ISO_DIMS, true));
    }
    for (const d of DECOR) expect(keys).toContain(tex.isoProp(d.id));
  });
  it('sprite footprints are the layout footprints', async () => {
    const { KIND_FOOT } = await import('../src/content/layout');
    for (const k of Object.keys(SPOT_SIZE)) expect(ISO_DIMS[k as keyof typeof ISO_DIMS]).toBe(KIND_FOOT[k as keyof typeof KIND_FOOT]);
  });
  it('room shells fit the 960x640 limit', () => {
    const s = shellSize(DEFAULT_ROOM.cols, DEFAULT_ROOM.rows);
    expect(s.w).toBeLessThanOrEqual(SHELL_MAX.w);
    expect(s.h).toBeLessThanOrEqual(SHELL_MAX.h);
    expect(LEGACY_ROOMS.map((r) => tex.isoShell(r))).toHaveLength(5);
  });
});

describe('iso kit v1', () => {
  it('has a theme and a shell spec that fits for every room', async () => {
    const { THEMES, specFor } = await import('../src/art/isoTheme');
    for (const r of LEGACY_ROOMS) {
      expect(THEMES[r]).toBeDefined();
      const sp = specFor(r);
      const s = shellSize(sp.cols, sp.rows);
      expect(s.w).toBeLessThanOrEqual(SHELL_MAX.w);
      expect(s.h).toBeLessThanOrEqual(SHELL_MAX.h);
      expect(sp.doors.length).toBeGreaterThan(0);
      for (const w of sp.windows) expect(w.at + w.w).toBeLessThanOrEqual(w.wall === 'left' ? sp.rows : sp.cols);
      for (const d of sp.doors) expect(d.at + 1).toBeLessThanOrEqual(d.wall === 'left' ? sp.rows : sp.cols);
    }
    expect(new Set(LEGACY_ROOMS.map((r) => THEMES[r].wall)).size).toBe(5);
  });
  it('plans badges with distinct keys including both mark textures', async () => {
    const { badgeTasks, ISO_BADGE } = await import('../src/art/isoBadges');
    const keys = badgeTasks().map((b) => b.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toContain(tex.mark('ruledOut'));
    expect(keys).toContain(tex.mark('hunch'));
    expect(keys).toContain(ISO_BADGE.padlock);
  });
  it('furniture textures stay small (total RGBA estimate under 3 MB)', async () => {
    const { furnitureSize } = await import('../src/art/isoFurniture');
    let bytes = 0;
    for (const k of Object.keys(SPOT_SIZE)) {
      const s = furnitureSize(k as keyof typeof ISO_DIMS);
      expect(s.w).toBeLessThanOrEqual(400);
      expect(s.h).toBeLessThanOrEqual(400);
      bytes += s.w * s.h * 4 * 2;
    }
    expect(bytes).toBeLessThan(3 * 1024 * 1024);
  });
});

describe('dollhouse art + props', () => {
  it('frame geometry fits the screen for the HouseScene constants', async () => {
    const { houseFrameGeometry } = await import('../src/art/isoHouse');
    const g = houseFrameGeometry({ colX: 300, colStep: 340, cols: 3, floorY: [440, 215], tileW: 240, tileH: 180 });
    expect(g.left).toBeGreaterThan(0);
    expect(g.right).toBeLessThan(1280);
    expect(g.roof.y).toBeGreaterThanOrEqual(0);
    for (const r of g.rects) {
      expect(r.x).toBeGreaterThanOrEqual(0);
      expect(r.y + r.h).toBeLessThanOrEqual(720);
    }
    expect(g.stairs.x).toBeGreaterThan(g.left);
  });
  it('miniature shells are smaller than full shells and bounded', async () => {
    const { MINI_K } = await import('../src/art/isoShell');
    const { specFor } = await import('../src/art/isoTheme');
    for (const r of LEGACY_ROOMS) {
      const sp = specFor(r);
      const full = shellSize(sp.cols, sp.rows);
      const mini = shellSize(sp.cols, sp.rows, MINI_K);
      expect(mini.w).toBeLessThan(full.w * 0.5);
      expect(mini.h).toBeLessThan(full.h * 0.5);
      expect(mini.w * mini.h * 4).toBeLessThan(150 * 1024);
    }
  });
  it('every PROPS variant has a unique texture key with matching size and flip rule', async () => {
    const { propTasks, propKey, propSpriteInfo } = await import('../src/art/isoProps');
    const { PROPS, DECOR_ISO } = await import('../src/content/layout');
    const tasks = new Map(propTasks().map((t) => [t.key, t]));
    expect(tasks.size).toBe(new Set(propTasks().map((t) => t.key)).size);
    for (const room of LEGACY_ROOMS) {
      for (const p of PROPS[room]) {
        const t = tasks.get(propKey(p));
        expect(t, p.id).toBeDefined();
        const info = propSpriteInfo(p);
        expect(info.key).toBe(propKey(p));
        expect(info.originX).toBeGreaterThan(0);
        expect(info.originX).toBeLessThan(1);
        expect(info.flip).toBe((p.iso.gz ?? 0) > 0 && p.iso.gx === 0 && p.iso.gy > 0);
      }
    }
    for (const id of Object.keys(DECOR_ISO)) expect(tasks.has(tex.isoProp(id)), id).toBe(true);
    const side = PROPS.bedroom.find((p) => p.id === 'frameSide');
    const bath = PROPS.bathroom.find((p) => p.id === 'frameBath');
    expect(propSpriteInfo(side!).flip).toBe(true);
    expect(propSpriteInfo(bath!).flip).toBe(false);
  });
});
