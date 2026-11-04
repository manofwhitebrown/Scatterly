import { describe, expect, it } from 'vitest';
import { caseMinutes, caseSpec } from '../src/logic/caseSpec';

describe('case spec: day ramp and session length', () => {
  it('follows the day ramp for standard length', () => {
    expect([1, 2, 3, 4, 5, 9, 40].map((d) => caseMinutes(d, 'standard', 'relaxed'))).toEqual([8, 15, 20, 25, 30, 30, 30]);
    expect(caseMinutes(1, 'long', 'relaxed')).toBeLessThanOrEqual(10);
  });
  it('length scales about 15 / 30 / 45 minutes from day 5 and never touches days 1-2', () => {
    expect(['short', 'standard', 'long'].map((l) => caseMinutes(5, l as 'short', 'relaxed'))).toEqual([15, 30, 45]);
    for (const l of ['short', 'standard', 'long'] as const) {
      expect(caseMinutes(1, l, 'relaxed')).toBe(8);
      expect(caseMinutes(2, l, 'relaxed')).toBe(15);
    }
  });
  it('rush stays 10-15 minutes and is never scaled; so are the daily and gentle days', () => {
    for (const d of [1, 5, 30]) {
      const m = caseMinutes(d, 'long', 'rush');
      expect(m).toBeGreaterThanOrEqual(10);
      expect(m).toBeLessThanOrEqual(15);
      expect(caseSpec(d, 'long', 'rush').scaled).toBe(false);
      expect(caseSpec(d, 'long', 'daily').scaled).toBe(false);
    }
    expect(caseSpec(1, 'standard', 'relaxed').scaled).toBe(false);
    expect(caseSpec(2, 'standard', 'relaxed').scaled).toBe(false);
  });
  it('standard case from day 5: 8-12 padlocks, 2-3 chains, a finale, 4-5 targets', () => {
    const s = caseSpec(5, 'standard', 'relaxed');
    expect(s).toMatchObject({ scaled: true, gatesMin: 8, gatesMax: 12, chainsMin: 2, chainsMax: 3, finale: true });
    expect(s.targets).toBeGreaterThanOrEqual(4);
  });
  it('counts grow with length and stay within hard caps', () => {
    for (const d of [3, 4, 5, 12]) for (const l of ['short', 'standard', 'long'] as const) {
      const s = caseSpec(d, l, 'relaxed');
      expect(s.gatesMax).toBeLessThanOrEqual(12);
      expect(s.gatesMin).toBeLessThanOrEqual(s.gatesMax);
      expect(s.chainsMax).toBeLessThanOrEqual(3);
    }
    expect(caseSpec(5, 'short', 'relaxed').gatesMax).toBeLessThan(caseSpec(5, 'standard', 'relaxed').gatesMax);
    expect(caseSpec(5, 'long', 'relaxed').gatesMax).toBe(12);
  });
});
