import { describe, expect, it, vi } from 'vitest';

vi.mock('phaser', () => ({ default: {}, Scenes: { Events: {} } }));

import { HOUSE } from '../src/content/house';
import { ISO } from '../src/shared/types';
import type { Spot } from '../src/shared/types';
import { pickSpot } from '../src/ui/hit';
import { ISO_DIMS } from '../src/art/iso';
import { isoBox, nearestUnsearched, placementOf, project, screenSpots } from '../src/ui/isoGrid';

const O = { x: 100, y: 50 };

describe('iso grid', () => {
  it('projects 2:1 (cell step = half tile wide, half tile tall)', () => {
    expect(project(O, 0, 0)).toEqual({ x: 100, y: 50 });
    expect(project(O, 1, 0)).toEqual({ x: 100 + ISO.tileW / 2, y: 50 + ISO.tileH / 2 });
    expect(project(O, 0, 1)).toEqual({ x: 100 - ISO.tileW / 2, y: 50 + ISO.tileH / 2 });
    expect(project(O, 0, 0, 2)).toEqual({ x: 100, y: 50 - 2 * ISO.unitH });
  });

  it('boxes a 1x1x1 footprint', () => {
    const b = isoBox(O, { gx: 0, gy: 0, w: 1, d: 1, h: 1 });
    expect(b).toEqual({ x: 100 - ISO.tileW / 2, y: 50 - ISO.unitH, w: ISO.tileW, h: ISO.tileH + ISO.unitH });
  });

  it('lifts wall mounts by gz', () => {
    const lo = isoBox(O, { gx: 2, gy: 2, w: 1, d: 1, h: 1 });
    const hi = isoBox(O, { gx: 2, gy: 2, w: 1, d: 1, h: 1, gz: 3 });
    expect(hi.y).toBe(lo.y - 3 * ISO.unitH);
    expect(hi.x).toBe(lo.x);
  });

  it('screenSpots keeps spot identity and reuses pickSpot (>= 96x96, nearest centre wins)', () => {
    const base = HOUSE[0] as Spot;
    const a: Spot = { ...base, id: 'a' as Spot['id'], iso: { gx: 3, gy: 3, w: 1, d: 1, h: 1 } };
    const b: Spot = { ...base, id: 'b' as Spot['id'], iso: { gx: 5, gy: 3, w: 1, d: 1, h: 1 } };
    const list = screenSpots(O, [a, b]);
    expect(list.map((s) => s.id)).toEqual(['a', 'b']);
    const ca = { x: (list[0]?.x ?? 0) + (list[0]?.w ?? 0) / 2, y: (list[0]?.y ?? 0) + (list[0]?.h ?? 0) / 2 };
    expect(pickSpot(list, ca.x, ca.y)?.id).toBe('a');
    // 40 px above the centre is still inside the grown 96x96 area, and b is farther away
    expect(pickSpot(list, ca.x, ca.y - 40)?.id).toBe('a');
    // the nearest centre wins where both areas overlap
    expect(pickSpot(list, ca.x + 47, ca.y)?.id).toBe('b');
    const cb = { x: (list[1]?.x ?? 0) + (list[1]?.w ?? 0) / 2, y: (list[1]?.y ?? 0) + (list[1]?.h ?? 0) / 2 };
    expect(pickSpot(list, cb.x, cb.y)?.id).toBe('b');
  });

  it('every house spot gets a non-empty screen box', () => {
    for (const s of screenSpots(O, HOUSE)) {
      expect(s.w).toBeGreaterThan(0);
      expect(s.h).toBeGreaterThan(0);
    }
  });

  it('draws and hit-tests spots with the canonical footprint of their kind', () => {
    const sofa = { ...(HOUSE[0] as Spot), kind: 'sofa' as const, iso: { gx: 1, gy: 2, w: 9, d: 9, h: 9 } };
    expect(placementOf(sofa)).toEqual({ gx: 1, gy: 2, gz: undefined, ...ISO_DIMS.sofa });
  });

  it('shimmers the nearest unsearched container to the last touch', () => {
    const base = HOUSE[0] as Spot;
    const mk = (id: string, gx: number, capacity: number): Spot => ({ ...base, id: id as Spot['id'], capacity, iso: { gx, gy: 3, w: 1, d: 1, h: 1 } });
    const list = screenSpots(O, [mk('near', 2, 2), mk('far', 9, 2), mk('empty', 3, 0)]);
    const at = (id: string): { x: number; y: number } => {
      const s = list.find((l) => l.id === id) as Spot;
      return { x: s.x + s.w / 2, y: s.y + s.h / 2 };
    };
    expect(nearestUnsearched(list, () => false, at('near'))?.id).toBe('near');
    expect(nearestUnsearched(list, (id) => id === 'near', at('near'))?.id).toBe('far');
    expect(nearestUnsearched(list, () => true, at('near'))).toBeNull();
    // a spot that holds nothing (capacity 0) is never picked even when it is closest
    expect(nearestUnsearched(list, (id) => id !== 'empty', at('empty'))).toBeNull();
  });
});
