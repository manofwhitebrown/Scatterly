import { describe, expect, it } from 'vitest';
import { Pool } from '../src/fx/pool';
import { allowedCount, FX_SPECS, MAX_CONFETTI, MAX_PARTICLES } from '../src/fx/specs';
import { FX_NAMES } from '../src/fx/names';

describe('fx specs', () => {
  it('has a spec for every FxName within the caps', () => {
    for (const n of FX_NAMES) {
      const s = FX_SPECS[n];
      expect(s, n).toBeDefined();
      expect(s.count).toBeGreaterThan(0);
      expect(s.count).toBeLessThanOrEqual(s.tex === 'confetti' ? MAX_CONFETTI : MAX_PARTICLES);
      expect(s.tints.length).toBeGreaterThan(0);
    }
    expect(FX_SPECS.tap.count).toBeLessThanOrEqual(6);
  });
  it('never allows more than the caps', () => {
    expect(allowedCount(FX_SPECS.win, 0, 0)).toBe(MAX_CONFETTI);
    expect(allowedCount(FX_SPECS.win, 30, 30)).toBe(10);
    expect(allowedCount(FX_SPECS.found, MAX_PARTICLES, 0)).toBe(0);
    expect(allowedCount(FX_SPECS.found, 55, 0)).toBe(5);
  });
});

describe('Pool', () => {
  it('reuses released slots and recycles the oldest when full', () => {
    let made = 0;
    const p = new Pool<number>(3, () => ++made);
    const a = p.acquire();
    p.acquire();
    p.acquire();
    expect(p.size).toBe(3);
    p.release(a.index);
    const again = p.acquire();
    expect(again.index).toBe(a.index);
    expect(again.recycled).toBe(false);
    const stolen = p.acquire();
    expect(stolen.recycled).toBe(true);
    expect(made).toBe(3);
    expect(p.liveCount).toBe(3);
  });
});
