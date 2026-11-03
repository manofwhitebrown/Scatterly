import { describe, expect, it } from 'vitest';
import { HOUSE_WORLD, focusCamera, overviewCamera, project, roomAt, screenToArt, tapsFromOverview, lerpCamera } from '../src/scenes/homeWorld';

describe('home world', () => {
  it('projects with 32x16 tiles', () => {
    expect(project(1, 0)).toEqual({ x: 16, y: 8 });
    expect(project(0, 1)).toEqual({ x: -16, y: 8 });
    expect(project(2, 2, 10)).toEqual({ x: 0, y: 22 });
  });
  it('every room is within 2 taps of the overview', () => {
    for (const s of HOUSE_WORLD) expect(tapsFromOverview(s.room)).toBeLessThanOrEqual(2);
  });
  it('focus zoom fills more of the screen than overview', () => {
    for (const s of HOUSE_WORLD) expect(focusCamera(s.room, 1280, 720).zoom).toBeGreaterThan(overviewCamera(1280, 720).zoom);
  });
  it('tapping a room floor centre selects that room', () => {
    for (const s of HOUSE_WORLD) {
      const cam = overviewCamera(1280, 720);
      const c = project(s.wx + 3, s.wy + 3, s.floor * 72);
      const a = screenToArt({ x: 640 + (c.x - cam.cx) * cam.zoom, y: 360 + (c.y - cam.cy) * cam.zoom }, cam, 1280, 720);
      expect(roomAt(a)).toBe(s.room);
    }
  });
  it('camera lerp hits both ends', () => {
    const a = overviewCamera(1280, 720); const b = focusCamera('living', 1280, 720);
    expect(lerpCamera(a, b, 0).zoom).toBeCloseTo(a.zoom); expect(lerpCamera(a, b, 1).zoom).toBeCloseTo(b.zoom);
  });
});
