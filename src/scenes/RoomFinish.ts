import Phaser from 'phaser';
import { commitProfile } from '../core/save';
import { GameSession, applyRun } from '../logic';
import { SCENE } from '../shared/types';
import type { GameMode, ResultSceneData, RunResult, Scenario } from '../shared/types';
import { getProfile, go, localDateKey } from '../ui/theme';

/**
 * Ends a morning: asks the session for the result, applies it to the profile (a replayed daily earns
 * nothing and is not applied twice), then moves to the Result scene. Falls back to the menu on any error.
 */
export function finishRun(
  scene: Phaser.Scene,
  session: GameSession,
  scenario: Scenario,
  mode: GameMode,
  elapsedMs: number,
  timedOut: boolean,
): void {
  let result: RunResult;
  try {
    result = session.finish(elapsedMs, timedOut);
  } catch {
    go(scene, SCENE.Menu);
    return;
  }
  const profile = getProfile(scene);
  let shown = result;
  if (mode === 'daily' && profile.lastDailyDate === localDateKey()) {
    shown = { ...result, coinsEarned: 0 };
  } else {
    commitProfile(scene.game, applyRun(profile, result));
  }
  const data: ResultSceneData = { result: shown, scenario };
  if (!go(scene, SCENE.Result, data)) go(scene, SCENE.Menu);
}
