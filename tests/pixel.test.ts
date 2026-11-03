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
  it('parses view=home and artdebug without changing the default', () => {
    expect(parseFlags('').home).toBe(false);
    expect(parseFlags('?view=home').home).toBe(true);
    expect(parseFlags('?view=home').iso).toBe(false);
    expect(parseFlags('?artdebug=1').artdebug).toBe(true);
  });
});

describe('boot path', () => {
  it('?view=home boots Home, everything else keeps the Menu', () => {
    expect(firstScene(parseFlags('?view=home'))).toBe('Home');
    expect(firstScene(parseFlags('?e2e=1&view=home'))).toBe('Home');
    expect(firstScene(parseFlags(''))).toBe('Menu');
    expect(firstScene(parseFlags('?view=iso'))).toBe('Menu');
  });
});
