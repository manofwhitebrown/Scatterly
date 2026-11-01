import { describe, expect, it } from 'vitest';
import { pickSpot } from '../src/ui/hit';
import type { Spot } from '../src/shared/types';

const mk = (id: string, x: number, y: number, w: number, h: number): Spot =>
  ({ id, x, y, w, h }) as unknown as Spot;

describe('pickSpot', () => {
  const small = mk('charger', 100, 100, 90, 60);
  it('gives small spots a hit area of at least 96x96 centred on the art', () => {
    // centre (145,130): 47 px up/down is inside a 96 tall box even though art is 60 tall
    expect(pickSpot([small], 145, 130 - 47)?.id).toBe('charger');
    expect(pickSpot([small], 145, 130 + 47)?.id).toBe('charger');
    expect(pickSpot([small], 145, 130 + 49)).toBeNull();
  });
  it('nearest centre wins when hit areas overlap', () => {
    const a = mk('a', 100, 100, 80, 80);
    const b = mk('b', 170, 100, 80, 80);
    expect(pickSpot([a, b], 150, 140)?.id).toBe('a');
    expect(pickSpot([a, b], 180, 140)?.id).toBe('b');
  });
  it('returns null on empty space', () => {
    expect(pickSpot([small], 900, 600)).toBeNull();
  });
});
