import { describe, expect, it } from 'vitest';
import { LIGHT_KEYS, LIGHT_TIMES, lampsOn, shellPart, windowGlowKey } from '../src/art/light';
import { isValidKey } from '../src/art/manifest';

describe('art light keys', () => {
  it('has the four key colours from the Art Bible', () => {
    expect(LIGHT_KEYS).toEqual({ morning: 0xffe9cf, noon: 0xffffff, dusk: 0xffc79a, night: 0x6f7bb8 });
  });
  it('picks shell and window art per time of day with valid manifest keys', () => {
    expect(LIGHT_TIMES.map(shellPart)).toEqual(['full', 'full', 'full_dusk', 'full_night']);
    for (const t of LIGHT_TIMES) for (const left of [false, true]) expect(isValidKey(windowGlowKey(t, left))).toBe(true);
    expect(windowGlowKey('noon', false)).toBe('fx/windowGlow/0');
    expect(windowGlowKey('night', true)).toBe('fx/windowGlow/3');
    expect(lampsOn('noon')).toBe(false);
    expect(lampsOn('dusk')).toBe(true);
  });
});
