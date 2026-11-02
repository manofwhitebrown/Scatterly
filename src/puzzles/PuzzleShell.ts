import Phaser from 'phaser';
import { GAME_H, GAME_W } from '../shared/types';
import type { Clue, PuzzleLaunchData, PuzzleRequest, PuzzleResult } from '../shared/types';
import { isLowFx } from '../core/perf';
import { flags } from '../core/flags';
import { playFx } from '../fx';
import { PuzzleNotes } from './PuzzleNotes';
import { BAR_TOP, BTN_H, NOTES_LEFT, NOTES_W, PH, PW, PX, PY } from './layout';
import { sfx } from '../audio/sfx';
import type { SfxName } from '../audio/sfx';
import { PAL, makeButton, makeText, panelBox } from '../art/palette';
import type { Btn } from '../art/palette';

export { PX, PY, PW, PH } from './layout';

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

const HINT_SHOW_MS = 6000;
const BAR_Y = BAR_TOP;

/** Hook surface the e2e bot uses (only installed with ?e2e=1). */
export interface PuzzleE2E { autoSolve(): void; hint(): void; skip(confirm: boolean): void }

/** Modal overlay base: title, difficulty marks, Hint, Notes, Skip (with confirm), elapsed ms, single onDone. */
export abstract class PuzzleShell extends Phaser.Scene {
  protected req: PuzzleRequest = { kind: 'untangle', seed: 1, difficulty: 1 };
  protected rand: () => number = mulberry32(1);
  protected solved = false;
  protected lowFx = false;
  protected notes: Clue[] = [];
  private onDone: ((r: PuzzleResult) => void) | null = null;
  private reported = false;
  private elapsed = 0;
  private lastTick = 0;
  protected hints = 0;
  private drawer: PuzzleNotes | null = null;
  private hintBox: Phaser.GameObjects.Container | null = null;
  private hintText: Phaser.GameObjects.Text | null = null;
  private hintTimer: Phaser.Time.TimerEvent | null = null;
  private confirmBox: Phaser.GameObjects.Container | null = null;
  private readonly buttons: Btn[] = [];
  private readonly onVis = (): void => this.tick(document.hidden);

  protected abstract defaultTitle(): string;
  protected abstract build(): void;
  /** Puzzles whose context is a hint line (not a title) return false. */
  protected contextIsTitle(): boolean {
    return true;
  }
  /** Scenes return PUZZLES[kind].hint(spec, progress); the base gives a generic nudge. */
  protected hintLine(): string {
    return 'Look for a pattern, then try one small change.';
  }
  /** Scenes apply PUZZLES[kind].solve() through the same handlers touch input uses. Only called under ?e2e=1. */
  protected e2eSolve(): void {
    /* overridden by scenes that support the bot */
  }

  init(data: PuzzleLaunchData): void {
    if (data && data.req) {
      this.req = data.req;
      this.onDone = typeof data.onDone === 'function' ? data.onDone : null;
      this.notes = Array.isArray(data.notes) ? data.notes : [];
    } else {
      this.onDone = null;
      this.notes = [];
    }
    this.rand = mulberry32(Number.isFinite(this.req.seed) ? this.req.seed : 1);
    this.solved = false;
    this.reported = false;
    this.hints = 0;
    this.elapsed = 0;
    this.lastTick = performance.now();
    this.drawer = null;
    this.hintBox = null;
    this.hintText = null;
    this.hintTimer = null;
    this.confirmBox = null;
    this.buttons.length = 0;
  }

  create(): void {
    this.lowFx = isLowFx(this.game);
    this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x1d130c, 0.62).setInteractive();
    const g = this.add.graphics();
    g.fillStyle(PAL.shadow, 0.3);
    g.fillRoundedRect(PX + 4, PY + 10, PW, PH, 28);
    panelBox(g, PX, PY, PW, PH, 28, PAL.panel, PAL.panelEdge, 4);
    const title = this.contextIsTitle() && this.req.context && this.req.context.trim() ? this.req.context.trim() : this.defaultTitle();
    makeText(this, PX + PW / 2, PY + 38, title, 34, PAL.ink, { bold: true, ox: 0.5, oy: 0.5, align: 'center', wrap: PW - 300 });
    this.drawDifficulty();
    this.buttons.push(makeButton(this, PX + PW - 56, PY + 56, BTN_H, BTN_H, '', () => this.cancel(), { fill: PAL.steel, glyph: 'close' }));
    this.build();

    const hint = makeButton(this, PX + 120, BAR_Y + BTN_H / 2, 200, BTN_H, 'Hint', () => this.hint(), { fill: PAL.blue, size: 30 });
    const notes = makeButton(this, PX + PW / 2, BAR_Y + BTN_H / 2, 200, BTN_H, 'Notes', () => this.drawer?.toggle(), { fill: PAL.sage, size: 30 });
    const skip = makeButton(this, PX + PW - 120, BAR_Y + BTN_H / 2, 200, BTN_H, 'Skip', () => this.askSkip(), { fill: PAL.sageDark, size: 30 });
    this.buttons.push(hint, notes, skip);
    this.drawer = new PuzzleNotes(this, NOTES_LEFT, PY + 110, PH - 150, this.notes);
    this.drawer.set(this.req.kind === 'code');
    this.buildHintBox();
    this.buildConfirm();

    document.addEventListener('visibilitychange', this.onVis);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanup());
    if (flags().e2e) {
      (this as unknown as { __e2e: PuzzleE2E }).__e2e = {
        autoSolve: () => this.e2eSolve(),
        hint: () => this.hint(),
        skip: (confirm) => { this.askSkip(); if (confirm) this.doSkip(); },
      };
    }
  }

  /** Filled marks = difficulty, outlined = remaining: readable without colour. */
  private drawDifficulty(): void {
    const g = this.add.graphics();
    for (let i = 0; i < 3; i++) {
      const cx = PX + 52 + i * 40;
      const cy = PY + 38;
      if (i < this.req.difficulty) {
        g.fillStyle(PAL.terracotta, 1);
        g.fillCircle(cx, cy, 14);
      } else {
        g.lineStyle(4, PAL.panelEdge, 1);
        g.strokeCircle(cx, cy, 12);
      }
    }
  }

  private buildHintBox(): void {
    const w = PW - 160;
    const c = this.add.container(PX + 20, PY + 6).setDepth(50).setVisible(false);
    const bg = this.add.graphics();
    panelBox(bg, 0, 0, w, 76, 16, PAL.butter, PAL.terracotta, 3);
    this.hintText = makeText(this, w / 2, 38, '', 28, PAL.ink, { bold: true, ox: 0.5, oy: 0.5, align: 'center', wrap: w - 40 });
    c.add([bg, this.hintText]);
    this.hintBox = c;
  }

  private buildConfirm(): void {
    const c = this.add.container(0, 0).setDepth(60).setVisible(false);
    const dim = this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x000000, 0.45).setInteractive();
    const bg = this.add.graphics();
    panelBox(bg, GAME_W / 2 - 340, GAME_H / 2 - 150, 680, 300, 24, PAL.panel, PAL.panelEdge, 4);
    const msg = makeText(this, GAME_W / 2, GAME_H / 2 - 80, 'Skip this puzzle?\nIt counts as a hint.', 32, PAL.ink, { bold: true, ox: 0.5, oy: 0.5, align: 'center' });
    const yes = makeButton(this, GAME_W / 2 - 150, GAME_H / 2 + 70, 260, BTN_H, 'Skip it', () => this.doSkip(), { fill: PAL.terracotta, size: 30 });
    const no = makeButton(this, GAME_W / 2 + 150, GAME_H / 2 + 70, 260, BTN_H, 'Keep going', () => this.confirmBox?.setVisible(false), { fill: PAL.sage, size: 30 });
    c.add([dim, bg, msg, yes.g, yes.label, no.g, no.label]);
    this.confirmBox = c;
  }

  private hint(): void {
    if (this.solved || this.reported || !this.hintBox || !this.hintText) return;
    this.hints++;
    sfx.play('clue');
    this.hintText.setText(this.hintLine());
    this.hintBox.setVisible(true);
    this.hintTimer?.remove(false);
    this.hintTimer = this.time.delayedCall(HINT_SHOW_MS, () => this.hintBox?.setVisible(false));
  }

  private askSkip(): void {
    if (this.solved || this.reported) return;
    sfx.play('tap');
    this.confirmBox?.setVisible(true);
  }

  private doSkip(): void {
    if (this.solved) return;
    this.confirmBox?.setVisible(false);
    this.hints++;
    this.finish({ solved: false, skipped: true });
  }

  /** Time only counts while the page is visible, so a backgrounded puzzle is not penalised. */
  private tick(hidden: boolean): void {
    const now = performance.now();
    if (!hidden) this.lastTick = now;
    else this.elapsed += now - this.lastTick;
  }

  /** Call once when the puzzle is solved. Plays a sound, celebrates briefly, then reports. */
  protected succeed(sound: SfxName = 'win'): void {
    if (this.solved) return;
    this.solved = true;
    sfx.play(sound);
    playFx(this, 'puzzleOk', PX + PW / 2, PY + PH / 2);
    this.time.delayedCall(500, () => this.finish({ solved: true, skipped: false }));
  }

  private cancel(): void {
    if (this.solved) return;
    sfx.play('close');
    this.finish({ solved: false, skipped: false });
  }

  private cleanup(): void {
    document.removeEventListener('visibilitychange', this.onVis);
    this.hintTimer?.remove(false);
    this.hintTimer = null;
    this.buttons.length = 0;
    this.drawer = null;
  }

  private finish(r: Omit<PuzzleResult, 'ms' | 'hints'>): void {
    if (this.reported) return;
    this.reported = true;
    if (!document.hidden) this.elapsed += performance.now() - this.lastTick;
    const result: PuzzleResult = { solved: r.solved, skipped: r.skipped, ms: Math.max(0, Math.round(this.elapsed)), hints: this.hints };
    const cb = this.onDone;
    this.onDone = null;
    try {
      if (cb) cb(result);
    } finally {
      this.scene.stop();
    }
  }
}
