import { describe, expect, it } from 'vitest';
import {
  ART, ISO, ISO_LEGACY, LEGACY_ROOMS, PUZZLE_KINDS, PUZZLE_SCENE, ROOM_ORDER, ROOM_UNLOCK_DAY, SAVE_VERSION, SCENE, tex,
} from '../src/shared/types';
import { IMPLEMENTED } from '../src/puzzles/manifest';
import { parseFlags } from '../src/core/flags';
import { HOUSE } from '../src/content/house';
import { DECOR } from '../src/content/decor';

describe('contract v4', () => {
  it('has the agreed constants', () => {
    expect(SAVE_VERSION).toBe(4);
    expect(ART).toEqual({ px: 3, tileArtW: 32, tileArtH: 16 });
    expect(ISO).toEqual({ tileW: 96, tileH: 48, unitH: 12 });
    expect(ISO_LEGACY).toEqual({ tileW: 64, tileH: 32, unitH: 16 });
    expect(SCENE).toMatchObject({ House: 'House', Home: 'Home', Chill: 'Chill', Builder: 'Builder' });
    expect(PUZZLE_KINDS).toHaveLength(23);
  });
  it('ISO is derived from ART (Art Bible v1)', () => {
    expect(ISO.tileW).toBe(ART.tileArtW * ART.px);
    expect(ISO.tileH).toBe(ART.tileArtH * ART.px);
    expect(ISO.unitH).toBe(4 * ART.px); // one height unit = 4 art px
  });
  it('rooms: nine ids, every room has an unlock day, legacy rooms are a subset', () => {
    expect(ROOM_ORDER).toHaveLength(9);
    expect(new Set(ROOM_ORDER).size).toBe(9);
    for (const r of ROOM_ORDER) expect(ROOM_UNLOCK_DAY[r]).toBeGreaterThanOrEqual(1);
    for (const r of LEGACY_ROOMS) expect(ROOM_ORDER).toContain(r);
    expect(ROOM_UNLOCK_DAY.bathroom).toBe(6); // matches progression.ts
  });
  it('the four new puzzle kinds have scenes', () => {
    for (const k of ['mirror', 'jigsaw', 'flow', 'gears'] as const) expect(PUZZLE_SCENE[k]).toMatch(/^Puzzle/);
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
    expect(parseFlags('?view=iso&debug=1&e2e=1')).toMatchObject({ iso: true, home: false, debug: true, e2e: true });
  });
});
