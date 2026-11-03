import type { GameMode } from '../shared/types';

/**
 * Mid-case autosave (JSON-safe). Phase 0 stub published by AI-1 so Contract v4 compiles; AI-2 owns the final shape
 * and the capture/restore functions.
 */
export interface SessionSnapshot {
  v: 1;
  scenarioId: string;
  mode: GameMode;
  seed: number;
  state: Record<string, unknown>;
}
