import Phaser from 'phaser';
import { GAME_H, GAME_W } from '../shared/types';
import type { PuzzleLaunchData, PuzzleRequest, PuzzleResult } from '../shared/types';
import { isLowFx } from '../core/perf';
import { sfx } from '../audio/sfx';
import type { SfxName } from '../audio/sfx';
import { PAL, makeButton, makeText, panelBox } from '../art/palette';

export const PX = 140;
export const PY = 60;
export const PW = 1000;
export const PH = 600;
const SKIP_AFTER_MS = 20000;

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(arr: T[], rand: () => number): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const t = arr[i];
    arr[i] = arr[j];
    arr[j] = t;
  }
  return arr;
}

/** Modal overlay base: dim backdrop, 1000x600 panel, title, cancel, delayed Skip, single onDone. */
export abstract class PuzzleShell extends Phaser.Scene {
  protected req: PuzzleRequest = { kind: 'untangle', seed: 1, difficulty: 1 };
  protected rand: () => number = mulberry32(1);
  protected solved = false;
  protected lowFx = false;
  private onDone: ((r: PuzzleResult) => void) | null = null;
  private reported = false;
  private t0 = 0;

  protected abstract defaultTitle(): string;
  protected abstract build(): void;
  /** Puzzles whose context is a hint line (not a title) return false. */
  protected contextIsTitle(): boolean {
    return true;
  }

  init(data: PuzzleLaunchData): void {
    if (data && data.req) {
      this.req = data.req;
      this.onDone = typeof data.onDone === 'function' ? data.onDone : null;
    } else {
      this.onDone = null;
    }
    this.rand = mulberry32(Number.isFinite(this.req.seed) ? this.req.seed : 1);
    this.solved = false;
    this.reported = false;
    this.t0 = performance.now();
  }

  create(): void {
    this.lowFx = isLowFx(this.game);
    this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x1d130c, 0.62).setInteractive();
    const g = this.add.graphics();
    g.fillStyle(PAL.shadow, 0.3);
    g.fillRoundedRect(PX + 4, PY + 10, PW, PH, 28);
    panelBox(g, PX, PY, PW, PH, 28, PAL.panel, PAL.panelEdge, 4);
    const title = this.contextIsTitle() && this.req.context && this.req.context.trim() ? this.req.context.trim() : this.defaultTitle();
    makeText(this, PX + PW / 2, PY + 38, title, 34, PAL.ink, { bold: true, ox: 0.5, oy: 0.5, align: 'center', wrap: PW - 220 });
    makeButton(this, PX + PW - 46, PY + 42, 56, 56, '', () => this.cancel(), { fill: PAL.steel, glyph: 'close' });
    this.build();
    const skip = makeButton(this, PX + PW - 96, PY + PH - 36, 132, 56, 'Skip', () => this.skip(), { fill: PAL.sageDark, size: 22 });
    skip.setVisible(false);
    this.time.delayedCall(SKIP_AFTER_MS, () => {
      if (this.solved || this.reported) return;
      skip.setVisible(true);
      skip.g.setAlpha(0);
      skip.label.setAlpha(0);
      this.tweens.add({ targets: [skip.g, skip.label], alpha: 1, duration: 300 });
    });
  }

  /** Call once when the puzzle is solved. Plays a sound, celebrates briefly, then reports. */
  protected succeed(sound: SfxName = 'win'): void {
    if (this.solved) return;
    this.solved = true;
    sfx.play(sound);
    if (!this.lowFx) this.burst();
    this.time.delayedCall(500, () => this.finish({ solved: true, skipped: false }));
  }

  private burst(): void {
    const cols = [PAL.butter, PAL.terracotta, PAL.sage, PAL.blue, PAL.rose];
    for (let i = 0; i < 12; i++) {
      const dot = this.add.circle(PX + PW / 2, PY + PH / 2, 7, cols[i % cols.length]);
      const a = (i / 12) * Math.PI * 2;
      this.tweens.add({
        targets: dot, x: dot.x + Math.cos(a) * 260, y: dot.y + Math.sin(a) * 200, alpha: 0, scale: 0.4, duration: 300,
        onComplete: () => dot.destroy(),
      });
    }
  }

  private cancel(): void {
    if (this.solved) return;
    sfx.play('close');
    this.finish({ solved: false, skipped: false });
  }

  private skip(): void {
    if (this.solved) return;
    sfx.play('tap');
    this.finish({ solved: false, skipped: true });
  }

  private finish(r: Omit<PuzzleResult, 'ms'>): void {
    if (this.reported) return;
    this.reported = true;
    const result: PuzzleResult = { solved: r.solved, skipped: r.skipped, ms: Math.max(0, Math.round(performance.now() - this.t0)) };
    const cb = this.onDone;
    this.onDone = null;
    try {
      if (cb) cb(result);
    } finally {
      this.scene.stop();
    }
  }
}
