import type Phaser from 'phaser';
import { GAME_H, GAME_W } from '../shared/types';
import type { FrameStats } from './frameStats';
import { readMetrics } from './metrics';
import type { Metrics } from './metrics';
import { errorLog } from './errors';

/** Surface of window.__scatterly. Exists ONLY when the page was opened with ?e2e=1. */
export interface ScatterlyE2E {
  game: Phaser.Game;
  size: { w: number; h: number };
  metrics(): Metrics;
  resetFrameStats(): void;
  errors(): readonly { at: number; message: string }[];
  activeScenes(): string[];
  /** The running Room scene's session (opaque to this module), or null. */
  session(): unknown;
  /** Makes the named scene throw on its next update, to test the error policy. */
  injectError(sceneKey: string): void;
  /** Converts game coordinates to page (client) coordinates for real pointer events. */
  toClient(x: number, y: number): { x: number; y: number };
}

declare global {
  interface Window { __scatterly?: ScatterlyE2E }
}

export function installE2e(game: Phaser.Game, stats: FrameStats): void {
  const api: ScatterlyE2E = {
    game,
    size: { w: GAME_W, h: GAME_H },
    metrics: () => readMetrics(game, stats),
    resetFrameStats: () => stats.reset(),
    errors: () => errorLog(),
    activeScenes: () => game.scene.getScenes(true).map((s) => s.scene.key),
    session: () => {
      const room = game.scene.getScene('Room') as unknown as { session?: unknown } | null;
      return game.scene.isActive('Room') && room ? room.session ?? null : null;
    },
    injectError: (key) => {
      const sc = game.scene.getScene(key);
      if (!sc) throw new Error(`e2e: no scene ${key}`);
      sc.events.once('update', () => {
        throw new Error('e2e injected error');
      });
    },
    toClient: (x, y) => {
      const r = game.canvas.getBoundingClientRect();
      return { x: r.left + (x / GAME_W) * r.width, y: r.top + (y / GAME_H) * r.height };
    },
  };
  window.__scatterly = api;
}
