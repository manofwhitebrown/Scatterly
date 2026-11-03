import { describe, expect, it } from 'vitest';
import { AMBIENCES, breath, focusState, isAmbience, sleepLabel, wholeMinutes } from '../src/scenes/chillModel';

describe('chill model', () => {
  it('breath goes 4 s in then 4 s out, 0..1, periodic and safe for negatives', () => {
    expect(breath(0)).toEqual({ label: 'Breathe in', k: 0 });
    expect(breath(2000).k).toBeCloseTo(0.5);
    expect(breath(4000)).toEqual({ label: 'Breathe out', k: 1 });
    expect(breath(8000).k).toBe(0);
    for (const t of [-1000, 1234, 99999]) expect(breath(t).k).toBeGreaterThanOrEqual(0);
  });
  it('focus 25 then break 5, repeating, never negative', () => {
    expect(focusState(0)).toEqual({ phase: 'focus', remainingSec: 1500, round: 1 });
    expect(focusState(1500)).toEqual({ phase: 'break', remainingSec: 300, round: 1 });
    expect(focusState(1800).phase).toBe('focus');
    expect(focusState(1800).round).toBe(2);
    expect(focusState(-5).remainingSec).toBe(1500);
  });
  it('ambience ids and labels', () => {
    expect(AMBIENCES.map((a) => a.id)).toEqual(['rain', 'birds', 'fire', 'night']);
    expect(isAmbience('rain')).toBe(true);
    expect(isAmbience('kitchen')).toBe(false);
    expect(sleepLabel(0)).toBe('Off');
    expect(sleepLabel(30)).toBe('30 min');
  });
  it('whole minutes only', () => {
    expect(wholeMinutes(59999)).toBe(0);
    expect(wholeMinutes(125000)).toBe(2);
  });
});
