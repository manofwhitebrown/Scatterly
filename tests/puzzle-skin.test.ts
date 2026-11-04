import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { FRAME_KEYS, addFrames, frame, isValidKey, setManifest } from '../src/art/manifest';
import { SKINNED_KINDS, isSkinned } from '../src/puzzles/skinKinds';

const ATLAS = join(__dirname, '..', 'public', 'atlas');

describe('puzzle skin hook', () => {
  it('SKINNED_KINDS matches the puzzle-<kind>.json atlases that ship', () => {
    const shipped = readdirSync(ATLAS).filter((f) => /^puzzle-.+\.json$/.test(f)).map((f) => f.slice('puzzle-'.length, -'.json'.length)).sort();
    expect([...SKINNED_KINDS].sort()).toEqual(shipped);
    for (const k of SKINNED_KINDS) expect(existsSync(join(ATLAS, `puzzle-${k}.png`)), k).toBe(true);
  });
  it('an unskinned kind asks for nothing', () => {
    expect(isSkinned('lights')).toBe(SKINNED_KINDS.includes('lights'));
  });
  it('the panel key follows the naming convention and the manifest answers undefined until loaded', () => {
    setManifest({ version: 1, frames: {} });
    expect(FRAME_KEYS.puzzle('lights', 'panel')).toBe('puzzle/lights/panel');
    expect(isValidKey(FRAME_KEYS.puzzle('lights', 'panel'))).toBe(true);
    expect(frame('puzzle/lights/panel')).toBeUndefined();
    addFrames([{ key: 'puzzle/lights/panel', atlas: 'atlas:puzzle:lights', frame: 'puzzle/lights/panel', w: 48, h: 48, pivotX: 0, pivotY: 0, group: 'puzzle:lights', slice: [8, 8, 8, 8] }]);
    expect(frame('puzzle/lights/panel')?.slice).toEqual([8, 8, 8, 8]);
    setManifest({ version: 1, frames: {} });
  });
});
