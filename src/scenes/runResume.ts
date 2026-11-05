import { GameSession, generateCase, restoreSnapshot } from '../logic';
import type { GameMode, PlayerProfile, RoomSceneData, Scenario } from '../shared/types';

/** One morning, either fresh or rebuilt from the autosave. */
export interface CaseSetup {
  scenario: Scenario;
  session: GameSession;
  seed: number;
  mode: GameMode;
  elapsedMs: number;
  resumed: boolean;
}

/** True when the profile holds an autosave that still rebuilds the exact same case. */
export function hasResume(profile: PlayerProfile): boolean {
  return profile.resume !== null && restoreSnapshot(profile.resume, profile) !== null;
}

/** Scene data that continues the saved morning, or null when there is nothing to continue. */
export function resumeData(profile: PlayerProfile): RoomSceneData | null {
  const snap = profile.resume;
  if (!snap || !hasResume(profile)) return null;
  return { mode: snap.mode, seed: snap.seed, resume: true };
}

/** Builds the morning for a run. A resume that no longer fits falls back to a fresh case with the same seed. */
export function buildCase(data: RoomSceneData, profile: PlayerProfile, seed: number): CaseSetup {
  if (data.resume) {
    const back = restoreSnapshot(profile.resume, profile);
    if (back) return { scenario: back.scenario, session: back.session, seed: back.seed, mode: back.session.mode, elapsedMs: back.elapsedMs, resumed: true };
  }
  const scenario = generateCase(seed, data.mode, profile);
  return { scenario, session: new GameSession(scenario, profile, data.mode), seed, mode: data.mode, elapsedMs: 0, resumed: false };
}
