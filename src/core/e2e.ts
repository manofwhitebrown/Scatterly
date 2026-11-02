import type Phaser from 'phaser';
import { GAME_H, GAME_W, PUZZLE_SCENE } from '../shared/types';
import type { Difficulty, PuzzleKind, PuzzleResult } from '../shared/types';
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
  /** Opens a puzzle scene directly (no Room needed). The result lands in `lastPuzzleResult`. */
  openPuzzle(kind: PuzzleKind, difficulty: Difficulty, seed: number): void;
  lastPuzzleResult: PuzzleResult | null;
  /** The open puzzle's bot hooks (autoSolve / hint / skip), or null. */
  puzzleBot(): { autoSolve(): void; hint(): void; skip(confirm: boolean): void } | null;
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
  const linked = o.getData('labelText') as { text?: unknown } | undefined;
  if (linked && typeof linked.text === 'string') return linked.text;
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
      // Graphics objects sit at (0,0) with an absolute hit rectangle; every other object's hit box is centred on its position.
      const hr = hit as { x?: number; y?: number } | null;
      const gfx = (o as unknown as { type?: string }).type === 'Graphics' && hr !== null && hr.x !== undefined && hr.y !== undefined;
      const x = gfx ? m.tx + (hr.x ?? 0) + w / 2 : m.tx;
      const y = gfx ? m.ty + (hr.y ?? 0) + h / 2 : m.ty;
      out.push({ scene, label: labelOf(o), texture: c.texture?.key ?? '', x, y, w, h });
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
      // Room (flat) and IsoRoom keep the session inside their RoomRun (`run`); older builds kept it on the scene.
      for (const key of ['Room', 'IsoRoom']) {
        if (!game.scene.isActive(key)) continue;
        const sc = game.scene.getScene(key) as unknown as { run?: { session?: unknown } | null; session?: unknown } | null;
        const found = sc?.run?.session ?? sc?.session;
        if (found) return found;
      }
      return null;
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
    lastPuzzleResult: null,
    openPuzzle: (kind, difficulty, seed) => {
      api.lastPuzzleResult = null;
      if (game.scene.getScene(PUZZLE_SCENE[kind])) game.scene.stop(PUZZLE_SCENE[kind]); // queued ops run in order, so run() below starts a fresh scene
      game.scene.run(PUZZLE_SCENE[kind], { req: { kind, seed, difficulty }, notes: [], onDone: (r: PuzzleResult) => { api.lastPuzzleResult = r; } });
    },
    puzzleBot: () => {
      for (const sc of game.scene.getScenes(true)) {
        const bot = (sc as unknown as { __e2e?: { autoSolve(): void; hint(): void; skip(confirm: boolean): void } }).__e2e;
        if (bot) return bot;
      }
      return null;
    },
    toClient: (x, y) => {
      const r = game.canvas.getBoundingClientRect();
      return { x: r.left + (x / GAME_W) * r.width, y: r.top + (y / GAME_H) * r.height };
    },
  };
  window.__scatterly = api;
}
