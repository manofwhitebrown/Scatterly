import { describe, expect, it, vi } from 'vitest';

vi.mock('phaser', () => ({ default: {}, Scenes: { Events: {} } }));

import { depthKey, faceShade, ISO_DIMS, isoToScreen, screenToIso, boxTexture } from '../src/art/iso';
import { DEFAULT_ROOM, shellSize, SHELL_MAX } from '../src/art/isoShell';
import { isoTasks } from '../src/art/isoKit';
import { ROOM_ORDER, SPOT_SIZE, tex } from '../src/shared/types';
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
  it('room shells fit the 960x640 limit', () => {
    const s = shellSize(DEFAULT_ROOM.cols, DEFAULT_ROOM.rows);
    expect(s.w).toBeLessThanOrEqual(SHELL_MAX.w);
    expect(s.h).toBeLessThanOrEqual(SHELL_MAX.h);
    expect(ROOM_ORDER.map((r) => tex.isoShell(r))).toHaveLength(5);
  });
});

describe('iso kit v1', () => {
  it('has a theme and a shell spec that fits for every room', async () => {
    const { THEMES, DEFAULT_SPECS } = await import('../src/art/isoTheme');
    for (const r of ROOM_ORDER) {
      expect(THEMES[r]).toBeDefined();
      const sp = DEFAULT_SPECS[r];
      const s = shellSize(sp.cols, sp.rows);
      expect(s.w).toBeLessThanOrEqual(SHELL_MAX.w);
      expect(s.h).toBeLessThanOrEqual(SHELL_MAX.h);
      expect(sp.doors.length).toBeGreaterThan(0);
    }
    expect(new Set(ROOM_ORDER.map((r) => THEMES[r].wall)).size).toBe(5);
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
