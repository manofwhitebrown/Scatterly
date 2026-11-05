import Phaser from 'phaser';
import { PUZZLE_SCENE } from '../shared/types';
import { PUZZLES } from '../logic/puzzles';
import type { MemorySpec } from '../logic/puzzles/memory';
import { sfx } from '../audio/sfx';
import { PAL, makeButton, makeText } from './ui';
import { PuzzleShell, PX, PY } from './PuzzleShell';

const PAD = 140;
const GAP = 8;
const STEP_MS = 650; // time per flashed pad during playback
const FLASH_MS = 420;
const COLORS: readonly number[] = [PAL.terracotta, PAL.blue, PAL.sage, PAL.butter, PAL.rose, PAL.teal, PAL.sky, PAL.gold, PAL.navy];

interface Pad { box: Phaser.GameObjects.Rectangle; label: Phaser.GameObjects.Text }

/** Watch the pads light up, then repeat the order. Each round adds one more pad; a mistake replays the round. */
export class MemoryScene extends PuzzleShell {
  private spec: MemorySpec | null = null;
  private pads: Pad[] = [];
  private round = 1;
  private typed: number[] = [];
  private locked = true;
  private fast = false; // e2e: skip playback
  private status!: Phaser.GameObjects.Text;
  private roundText!: Phaser.GameObjects.Text;

  constructor() {
    super(PUZZLE_SCENE.memory);
  }

  protected defaultTitle(): string {
    return 'Remember the order';
  }

  protected build(): void {
    const spec = PUZZLES.memory.generate(this.req.seed, this.level);
    this.spec = spec;
    this.pads = [];
    this.round = 1;
    this.typed = [];
    this.locked = true;
    this.fast = false;
    const cols = spec.pads === 4 ? 2 : 3;
    const rows = Math.ceil(spec.pads / cols);
    const cx = PX + 330;
    const x0 = cx - (cols * (PAD + GAP) - GAP) / 2 + PAD / 2;
    const y0 = PY + 310 - (rows * (PAD + GAP) - GAP) / 2 + PAD / 2;
    for (let i = 0; i < spec.pads; i++) {
      const x = x0 + (i % cols) * (PAD + GAP);
      const y = y0 + Math.floor(i / cols) * (PAD + GAP);
      const box = this.add.rectangle(x, y, PAD, PAD, COLORS[i] ?? PAL.steel).setStrokeStyle(4, PAL.panelEdge).setInteractive();
      const label = makeText(this, x, y, String(i + 1), 60, PAL.ink, { bold: true, ox: 0.5, oy: 0.5 });
      box.on('pointerdown', () => this.tap(i));
      this.pads.push({ box, label });
    }
    const px = PX + 740;
    this.roundText = makeText(this, px, PY + 150, '', 32, PAL.ink, { bold: true, ox: 0.5, oy: 0.5, align: 'center' });
    this.status = makeText(this, px, PY + 250, '', 32, PAL.ink, { bold: true, ox: 0.5, oy: 0.5, align: 'center', wrap: 300 });
    makeButton(this, px, PY + 380, 260, 96, 'Watch again', () => this.replay(), { fill: PAL.sageDark, size: 30 });
    this.time.delayedCall(500, () => this.play());
  }

  protected hintLine(): string {
    return this.spec ? PUZZLES.memory.hint(this.spec, ...this.hintArgs()) : super.hintLine();
  }

  protected e2eSolve(): void {
    const spec = this.spec;
    if (!spec) return;
    this.fast = true;
    this.time.removeAllEvents();
    this.locked = false;
    this.round = 1;
    this.typed = [];
    const seq = PUZZLES.memory.solve(spec);
    // Same as a player: each round repeats the growing prefix from the start.
    for (let r = 1; r <= seq.length; r++) for (let k = 0; k < r; k++) this.tap(seq[k] ?? 0);
  }

  private setFlash(i: number, on: boolean): void {
    const p = this.pads[i];
    if (!p) return;
    p.box.setStrokeStyle(on ? 12 : 4, on ? PAL.ink : PAL.panelEdge);
    p.box.setFillStyle(on ? PAL.white : COLORS[i] ?? PAL.steel);
  }

  /** Plays the first `round` pads of the sequence. Input is locked until it ends. */
  private play(): void {
    const spec = this.spec;
    if (!spec || this.solved) return;
    this.locked = true;
    this.typed = [];
    this.roundText.setText(`Round ${this.round}\nof ${spec.sequence.length}`);
    this.status.setText('Watch...');
    for (let k = 0; k < this.round; k++) {
      const pad = spec.sequence[k] ?? 0;
      this.time.delayedCall(k * STEP_MS, () => {
        this.setFlash(pad, true);
        sfx.play('tick');
      });
      this.time.delayedCall(k * STEP_MS + FLASH_MS, () => this.setFlash(pad, false));
    }
    this.time.delayedCall(this.round * STEP_MS + 100, () => {
      this.locked = false;
      this.status.setText('Your turn!');
    });
  }

  private replay(): void {
    if (this.solved || !this.spec) return;
    this.time.removeAllEvents();
    for (let i = 0; i < this.pads.length; i++) this.setFlash(i, false);
    this.play();
  }

  private tap(i: number): void {
    const spec = this.spec;
    if (this.solved || !spec || this.locked) return;
    const want = spec.sequence[this.typed.length];
    this.setFlash(i, true);
    this.time.delayedCall(180, () => this.setFlash(i, false));
    if (i !== want) {
      sfx.play('error');
      this.status.setText(`X  Not that one.\nWatch again.`);
      this.typed = [];
      this.locked = true;
      if (!this.fast) this.time.delayedCall(900, () => this.play());
      return;
    }
    sfx.play('tap');
    this.typed.push(i);
    if (this.typed.length < this.round) return;
    if (this.round >= spec.sequence.length) {
      if (PUZZLES.memory.check(spec, this.typed)) {
        this.status.setText('Perfect memory!');
        this.succeed('win');
      }
      return;
    }
    this.round++;
    this.typed = [];
    if (this.fast) return;
    this.locked = true;
    this.status.setText('Good! One more...');
    this.time.delayedCall(700, () => this.play());
  }
}
