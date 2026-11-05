import { hashString } from './rng';
import { generateCase, generateScenario } from './generator';
import { GameSession } from './session';
import type { SessionState } from './session';
import type { GameMode, PlayerProfile, Scenario, SessionLength } from '../shared/types';

/**
 * Mid-case autosave (JSON-safe). The outer shape is fixed by Contract v4 (`PlayerProfile.resume`, validated by
 * `sanitizeResume` in core). `state` holds a `SnapshotState`; the scenario is regenerated from `seed`, `mode` and the
 * saved day/length, then checked against a fingerprint, so a snapshot can never put the player in a different case.
 */
export interface SessionSnapshot {
  v: 1;
  scenarioId: string;
  mode: GameMode;
  seed: number;
  state: Record<string, unknown>;
}

/** Revision of `state`. A snapshot with another revision is discarded, never half-read. */
export const SNAPSHOT_REV = 1;
const MAX_ELAPSED_MS = 6 * 3600 * 1000;
const LENGTHS: readonly SessionLength[] = ['short', 'standard', 'long'];

export interface SnapshotState extends SessionState {
  rev: number;
  /** Profile inputs the case was generated from. */
  day: number;
  length: SessionLength;
  /** Hash of everything that decides what is where; mismatch means the case would differ, so Resume is refused. */
  fp: string;
  /** Time already spent in this case, so a timer or par comparison continues rather than restarts. */
  elapsedMs: number;
}

/** Stable hash of the parts of a scenario the player's progress depends on. */
export function scenarioFingerprint(s: Scenario): string {
  const gates = Object.entries(s.gates).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([id, g]) => [id, g.kind, g.difficulty, g.chain ?? [], g.needs ?? [], g.payload ?? '']);
  const placement = Object.entries(s.placement).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  const body = JSON.stringify([s.id, s.targets, placement, gates, s.clues.map((c) => [c.id, c.spotId])]);
  return `${hashString(body).toString(16)}-${body.length}`;
}

/** Captures the running session. Call after every meaningful action and when the app is backgrounded. */
export function captureSnapshot(session: GameSession, seed: number, profile: PlayerProfile, elapsedMs: number): SessionSnapshot {
  const state: SnapshotState = {
    ...session.exportState(), rev: SNAPSHOT_REV, day: profile.day, length: profile.settings.sessionLength,
    fp: scenarioFingerprint(session.scenario), elapsedMs: Math.max(0, Math.min(MAX_ELAPSED_MS, Math.round(elapsedMs))),
  };
  return { v: 1, scenarioId: session.scenario.id, mode: session.mode, seed, state: JSON.parse(JSON.stringify(state)) as Record<string, unknown> };
}

export interface Restored { session: GameSession; scenario: Scenario; seed: number; elapsedMs: number }

const MODES: readonly GameMode[] = ['relaxed', 'rush', 'daily'];

/**
 * Rebuilds a session from a stored snapshot, or returns null so the caller starts a fresh case. Never throws.
 * Null for: not a v1 snapshot, another `state` revision, any shape problem, a case that no longer regenerates identically
 * (changed app version, changed profile inputs) and any progress that does not fit the case.
 */
export function restoreSnapshot(raw: unknown, profile: PlayerProfile): Restored | null {
  try {
    if (!raw || typeof raw !== 'object') return null;
    const snap = raw as Record<string, unknown>;
    const st = snap.state as Record<string, unknown> | null;
    if (snap.v !== 1 || !st || typeof st !== 'object' || st.rev !== SNAPSHOT_REV) return null;
    const mode = MODES.find((m) => m === snap.mode);
    const seed = snap.seed;
    if (!mode || typeof snap.scenarioId !== 'string' || typeof seed !== 'number' || !Number.isFinite(seed)) return null;
    const day = st.day, length = LENGTHS.find((l) => l === st.length), elapsed = st.elapsedMs;
    if (typeof day !== 'number' || !Number.isInteger(day) || day < 1 || day > 100000 || !length) return null;
    if (typeof st.fp !== 'string' || typeof elapsed !== 'number' || !Number.isFinite(elapsed)) return null;
    const p: PlayerProfile = { ...profile, day, settings: { ...profile.settings, sessionLength: length } };
    // The game may build cases with the case builder or the classic generator; either must reproduce the saved case exactly.
    for (const make of [generateCase, generateScenario]) {
      const scenario = make(seed, mode, p);
      if (scenario.id !== snap.scenarioId || scenarioFingerprint(scenario) !== st.fp) continue;
      const session = new GameSession(scenario, p, mode);
      if (!session.importState(st)) return null;
      return { session, scenario, seed, elapsedMs: Math.max(0, Math.min(MAX_ELAPSED_MS, Math.round(elapsed))) };
    }
    return null;
  } catch {
    return null;
  }
}
