import { describe, expect, it } from 'vitest';
import { defaultProfile } from '../src/core/save';
import { GameSession, captureSnapshot, generateCase } from '../src/logic';
import { buildCase, hasResume, resumeData } from '../src/scenes/runResume';

const profile = { ...defaultProfile(), day: 6 };

describe('run resume', () => {
  it('builds a fresh case with the case builder', () => {
    const a = buildCase({ mode: 'relaxed', seed: 4242 }, profile, 4242);
    const b = generateCase(4242, 'relaxed', profile);
    expect(a.resumed).toBe(false);
    expect(a.scenario.id).toBe(b.id);
    expect(a.elapsedMs).toBe(0);
  });

  it('has nothing to resume on a fresh profile', () => {
    expect(hasResume(profile)).toBe(false);
    expect(resumeData(profile)).toBeNull();
  });

  it('rebuilds the same case, progress and time from an autosave', () => {
    const first = buildCase({ mode: 'relaxed', seed: 777 }, profile, 777);
    const spot = Object.values(first.scenario.placement).find((id) => id !== undefined && !(id in first.scenario.gates));
    expect(spot).toBeDefined();
    first.session.inspect(spot as string);
    const saved = { ...profile, resume: captureSnapshot(first.session, 777, profile, 95000) };
    expect(hasResume(saved)).toBe(true);
    const data = resumeData(saved);
    expect(data).toEqual({ mode: 'relaxed', seed: 777, resume: true });
    const back = buildCase(data as NonNullable<typeof data>, saved, 777);
    expect(back.resumed).toBe(true);
    expect(back.scenario.id).toBe(first.scenario.id);
    expect(back.elapsedMs).toBe(95000);
    expect(back.session).toBeInstanceOf(GameSession);
    expect(back.session.isOpened(spot as string)).toBe(true);
  });

  it('refuses a damaged autosave and starts fresh', () => {
    const bad = { ...profile, resume: { v: 1 as const, scenarioId: 'x', mode: 'relaxed' as const, seed: 1, state: { rev: 99 } } };
    expect(hasResume(bad)).toBe(false);
    expect(buildCase({ mode: 'relaxed', seed: 5, resume: true }, bad, 5).resumed).toBe(false);
  });
});
