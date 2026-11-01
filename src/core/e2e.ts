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
  /** Every visible tappable object in the active scenes (labels, centres, hit sizes). */
  interactives(): Interactive[];
  /** Converts game coordinates to page (client) coordinates for real pointer events. */
  toClient(x: number, y: number): { x: number; y: number };
}

/** One tappable object in game coordinates. `w`/`h` are the real hit size, for the G6 audit. */
export interface Interactive { scene: string; label: string; texture: string; x: number; y: number; w: number; h: number }

function isShown(o: Phaser.GameObjects.GameObject): boolean {
  let cur: Phaser.GameObjects.GameObject | null = o;
  while (cur) {
    const v = cur as unknown as { visible?: boolean; alpha?: number; parentContainer?: Phaser.GameObjects.Container | null };
    if (v.visible === false || v.alpha === 0) return false;
    cur = v.parentContainer ?? null;
  }
  return true;
}

function labelOf(o: Phaser.GameObjects.GameObject): string {
  const t = o as unknown as { text?: unknown; list?: Phaser.GameObjects.GameObject[] };
  if (typeof t.text === 'string') return t.text;
  if (t.list) for (const c of t.list) { const l = labelOf(c); if (l) return l; }
  return '';
}

function collect(list: Phaser.GameObjects.GameObject[], scene: string, out: Interactive[]): void {
  for (const o of list) {
    const c = o as unknown as { list?: Phaser.GameObjects.GameObject[]; texture?: { key: string }; displayWidth?: number; displayHeight?: number; scaleX?: number; scaleY?: number };
    if (o.input?.enabled && isShown(o)) {
      const m = (o as unknown as Phaser.GameObjects.Components.Transform & Phaser.GameObjects.GameObject).getWorldTransformMatrix();
      const hit = o.input.hitArea as { width?: number; height?: number } | null;
      const w = hit?.width !== undefined ? hit.width * Math.abs(c.scaleX ?? 1) : c.displayWidth ?? 0;
      const h = hit?.height !== undefined ? hit.height * Math.abs(c.scaleY ?? 1) : c.displayHeight ?? 0;
      out.push({ scene, label: labelOf(o), texture: c.texture?.key ?? '', x: m.tx, y: m.ty, w, h });
    }
    if (c.list) collect(c.list, scene, out);
  }
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
    interactives: () => {
      const out: Interactive[] = [];
      for (const sc of game.scene.getScenes(true)) collect(sc.children.list, sc.scene.key, out);
      return out;
    },
    toClient: (x, y) => {
      const r = game.canvas.getBoundingClientRect();
      return { x: r.left + (x / GAME_W) * r.width, y: r.top + (y / GAME_H) * r.height };
    },
  };
  window.__scatterly = api;
}
