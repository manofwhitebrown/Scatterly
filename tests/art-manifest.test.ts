import { describe, expect, it } from 'vitest';
import { ART_PX, FRAME_KEYS, addFrames, frame, frameCount, isValidKey, setManifest, snap } from '../src/art/manifest';

describe('art manifest', () => {
  it('missing frame returns undefined, never throws', () => {
    setManifest({ version: 1, frames: {} });
    expect(frame('spot/drawer/closed')).toBeUndefined();
    expect(frameCount()).toBe(0);
  });
  it('key builders follow the naming convention', () => {
    const keys = [FRAME_KEYS.spot('drawer', 'open'), FRAME_KEYS.prop('teapot'), FRAME_KEYS.shell('living', 'window1/day'),
      FRAME_KEYS.ui('panel9'), FRAME_KEYS.icon('keys'), FRAME_KEYS.fx('tap', 2), FRAME_KEYS.avatar('se', 'walk', 5),
      FRAME_KEYS.pet('sleep', 0), FRAME_KEYS.puzzle('code', 'dial'), FRAME_KEYS.mat('plankWarm')];
    for (const k of keys) expect(isValidKey(k), k).toBe(true);
    expect(isValidKey('spot/drawer/ajar')).toBe(false);
    expect(isValidKey('random')).toBe(false);
  });
  it('addFrames merges and frame() resolves', () => {
    setManifest({ version: 1, frames: {} });
    addFrames([{ key: 'prop/teapot', atlas: 'room_living', frame: 'prop/teapot', w: 12, h: 10, pivotX: 6, pivotY: 8, group: 'room:living' }]);
    expect(frame('prop/teapot')?.w).toBe(12);
    expect(frameCount()).toBe(1);
  });
  it('snap lands on multiples of the art pixel', () => {
    expect(ART_PX).toBe(3);
    for (const v of [0, 1, 2, 4, 5, 100.4, -7]) expect(Math.abs(snap(v) % ART_PX)).toBe(0);
  });
});
