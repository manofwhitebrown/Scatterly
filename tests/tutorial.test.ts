import { describe, expect, it } from 'vitest';
import { HOUSE } from '../src/content/house';
import type { Spot } from '../src/shared/types';
import { TUTORIAL_STEPS, nextStep, pickTarget } from '../src/scenes/tutorialSteps';

const mk = (id: string, capacity: number): Spot => ({ ...(HOUSE[0] as Spot), id: id as Spot['id'], capacity });

describe('tutorial steps', () => {
  it('runs tap, lock, notebook, mark, done and then ends', () => {
    expect(TUTORIAL_STEPS.map((s) => s.id)).toEqual(['tap', 'lock', 'notebook', 'mark', 'done']);
    expect(nextStep('tap')?.id).toBe('lock');
    expect(nextStep('mark')?.id).toBe('done');
    expect(nextStep('done')).toBeNull();
  });

  it('every step has plain text and only the last moves on by itself', () => {
    for (const s of TUTORIAL_STEPS) expect(s.text.length).toBeGreaterThan(10);
    expect(TUTORIAL_STEPS.filter((s) => s.autoMs !== undefined).map((s) => s.id)).toEqual(['done']);
  });

  it('picks the same free container every time, by id, ignoring locked, searched and empty ones', () => {
    const spots = [mk('r.b', 2), mk('r.a', 1), mk('r.locked', 2), mk('r.empty', 0), mk('r.done', 2)];
    const gates = { 'r.locked': {} };
    const opened = (id: string): boolean => id === 'r.done';
    expect(pickTarget(spots, gates, opened, 'free')?.id).toBe('r.a');
    expect(pickTarget([...spots].reverse(), gates, opened, 'free')?.id).toBe('r.a');
    expect(pickTarget(spots, gates, opened, 'locked')?.id).toBe('r.locked');
    expect(pickTarget(spots, gates, (id) => id === 'r.locked', 'locked')).toBeNull();
    expect(pickTarget([], gates, opened, 'free')).toBeNull();
  });
});
