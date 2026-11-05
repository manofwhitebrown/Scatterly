import { describe, expect, it } from 'vitest';
import { loopsFor, pickVariant, playbackRate, tensionGain, trackForDay } from '../src/audio/logic';

describe('audio logic', () => {
  it('never repeats the previous variant back to back', () => {
    for (let last = 1; last <= 3; last++) for (const r of [0, 0.34, 0.67, 0.999]) expect(pickVariant(3, last, () => r)).not.toBe(last);
    expect(pickVariant(1, 1)).toBe(1);
    expect(pickVariant(3, undefined, () => 0)).toBe(1);
  });
  it('playback rate follows semitones, clamps and stays within 3% jitter', () => {
    expect(playbackRate(0, () => 0.5)).toBeCloseTo(1, 5);
    expect(playbackRate(12, () => 0.5)).toBeCloseTo(2, 5);
    expect(playbackRate(99, () => 0.5)).toBeCloseTo(2, 5);
    expect(playbackRate(NaN, () => 0.5)).toBeCloseTo(1, 5);
    expect(playbackRate(0, () => 1)).toBeLessThanOrEqual(1.03);
  });
  it('tension layer is silent at calm, rises smoothly, tops out at 0.8', () => {
    expect(tensionGain(0)).toBe(0);
    expect(tensionGain(0.15)).toBe(0);
    expect(tensionGain(NaN)).toBe(0);
    expect(tensionGain(1)).toBeCloseTo(0.8, 5);
    expect(tensionGain(0.5)).toBeGreaterThan(tensionGain(0.3));
  });
  it('rooms map to loops, unknown rooms to none, null to the outside loop', () => {
    expect(loopsFor('Kitchen')).toEqual(['kitchen']);
    expect(loopsFor(null)).toEqual(['birds']);
    expect(loopsFor('garage')).toEqual([]);
  });
  it('lo-fi tracks alternate by day', () => {
    expect(trackForDay(1)).not.toBe(trackForDay(2));
    expect(trackForDay(-3)).toBe(trackForDay(3));
    expect(trackForDay(NaN)).toBe('lofi_a');
  });
});
