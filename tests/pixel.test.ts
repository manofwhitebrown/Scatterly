import { describe, expect, it } from 'vitest';
import { firstScene, parseFlags } from '../src/core/flags';
import { PX, snap, toGame } from '../src/core/pixel';

describe('pixel helpers', () => {
  it('snaps to multiples of PX', () => {
    for (const v of [-7, -1, 0, 1, 2, 4, 10.4, 99.9]) expect(Math.abs(snap(v) % PX)).toBe(0);
    expect(snap(4)).toBe(3);
    expect(snap(5)).toBe(6);
  });
  it('converts art pixels to game pixels', () => {
    expect(toGame(32)).toBe(32 * PX);
  });
});

describe('flags', () => {
  it('Home is the default view; ?view=legacy and ?view=iso opt out', () => {
    expect(parseFlags('').home).toBe(true);
    expect(parseFlags('?view=home').home).toBe(true);
    expect(parseFlags('?view=home').iso).toBe(false);
    expect(parseFlags('?view=legacy')).toMatchObject({ home: false, legacy: true, iso: false });
    expect(parseFlags('?view=iso')).toMatchObject({ home: false, legacy: false, iso: true });
    expect(parseFlags('?artdebug=1').artdebug).toBe(true);
  });
});

describe('boot path', () => {
  it('boots Home by default; only ?view=legacy and ?view=iso keep the old Menu', () => {
    expect(firstScene(parseFlags(''))).toBe('Home');
    expect(firstScene(parseFlags('?view=home'))).toBe('Home');
    expect(firstScene(parseFlags('?e2e=1&debug=1'))).toBe('Home');
    expect(firstScene(parseFlags('?view=legacy'))).toBe('Menu');
    expect(firstScene(parseFlags('?view=iso'))).toBe('Menu');
  });
});
