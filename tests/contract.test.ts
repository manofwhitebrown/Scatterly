import { describe, expect, it } from 'vitest';
import { ISO, PUZZLE_KINDS, PUZZLE_SCENE, SAVE_VERSION, SCENE, tex } from '../src/shared/types';
import { IMPLEMENTED } from '../src/puzzles/manifest';
import { parseFlags } from '../src/core/flags';
import { HOUSE } from '../src/content/house';
import { DECOR } from '../src/content/decor';

describe('contract v3', () => {
  it('has the agreed constants', () => {
    expect(SAVE_VERSION).toBe(3);
    expect(ISO).toEqual({ tileW: 64, tileH: 32, unitH: 16 });
    expect(SCENE.House).toBe('House');
    expect(PUZZLE_KINDS).toHaveLength(19);
  });
  it('every puzzle kind has a unique scene key', () => {
    const keys = PUZZLE_KINDS.map((k) => PUZZLE_SCENE[k]);
    expect(keys.every((k) => typeof k === 'string' && k.length > 0)).toBe(true);
    expect(new Set(keys).size).toBe(PUZZLE_KINDS.length);
  });
  it('manifest lists only known kinds, without duplicates', () => {
    expect(new Set(IMPLEMENTED).size).toBe(IMPLEMENTED.length);
    for (const k of IMPLEMENTED) expect(PUZZLE_KINDS).toContain(k);
    expect(IMPLEMENTED).toEqual(expect.arrayContaining(['untangle', 'sort', 'word']));
  });
  it('every spot and decor carries iso data and a lockable flag', () => {
    for (const s of HOUSE) {
      expect(s.iso.w).toBeGreaterThan(0);
      expect(s.iso.h).toBeGreaterThan(0);
      expect(typeof s.lockable).toBe('boolean');
    }
    for (const d of DECOR) expect(d.iso.w).toBeGreaterThan(0);
    expect(HOUSE.some((s) => s.lockable)).toBe(true);
    expect(HOUSE.find((s) => s.kind === 'sofa')?.lockable).toBe(false);
  });
  it('iso texture keys are stable', () => {
    expect(tex.isoSpot('drawer')).toBe('iso_spot_drawer');
    expect(tex.isoSpot('drawer', true)).toBe('iso_spot_drawer_open');
    expect(tex.isoShell('kitchen')).toBe('iso_shell_kitchen');
    expect(tex.isoProp('lamp')).toBe('iso_prop_lamp');
  });
  it('?view=iso selects the new view, default is the old one', () => {
    expect(parseFlags('').iso).toBe(false);
    expect(parseFlags('?view=iso').iso).toBe(true);
    expect(parseFlags('?view=flat').iso).toBe(false);
    expect(parseFlags('?view=iso&debug=1&e2e=1')).toEqual({ iso: true, debug: true, e2e: true });
  });
});
