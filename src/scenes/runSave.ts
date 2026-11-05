import type Phaser from 'phaser';
import { commitProfile } from '../core/save';
import { captureSnapshot } from '../logic';
import type { GameSession } from '../logic';
import { getProfile } from '../ui/theme';

/** Writes the autosave into the profile (debounced by commitProfile). */
export function saveResume(scene: Phaser.Scene, session: GameSession, seed: number, elapsedMs: number): void {
  const p = getProfile(scene);
  commitProfile(scene.game, { ...p, resume: captureSnapshot(session, seed, p, elapsedMs) });
}

/** Drops the autosave (case finished, or the player restarted). */
export function clearResume(scene: Phaser.Scene): void {
  const p = getProfile(scene);
  if (p.resume !== null) commitProfile(scene.game, { ...p, resume: null });
}
