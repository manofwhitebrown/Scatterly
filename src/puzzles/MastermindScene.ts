import Phaser from 'phaser';
import { PUZZLE_SCENE } from '../shared/types';
import { PUZZLES, feedback } from '../logic/puzzles';
import type { MastermindSpec } from '../logic/puzzles/mastermind';
import { sfx } from '../audio/sfx';
import { PAL, makeButton, makeText, panelBox } from './ui';
import type { Btn } from './ui';
import { PuzzleShell, PX, PY } from './PuzzleShell';
import { SYMBOL_COUNT, SYMBOL_NAMES, drawSymbol } from './Symbols';

const KEY = 96;
const ROW_H = 46;
const HX = PX + 30;
const HY = PY + 90;
const RX = PX + 720; // right column centre

/** Crack a 3-4 symbol code. Feedback counts symbols in the right place and symbols that are in the code elsewhere. */
export class MastermindScene extends PuzzleShell {
  private spec: MastermindSpec | null = null;
  private guess: number[] = [];
  private guesses: number[][] = [];
  private histG!: Phaser.GameObjects.Graphics;
  private slotG!: Phaser.GameObjects.Graphics;
  private rowText: Phaser.GameObjects.Text[] = [];
  private slotHit: Phaser.GameObjects.Rectangle[] = [];
  private counter!: Phaser.GameObjects.Text;
  private status!: Phaser.GameObjects.Text;
  private submitBtn!: Btn;

  constructor() {
    super(PUZZLE_SCENE.mastermind);
  }

  protected defaultTitle(): string {
    return 'Crack the code';
  }

  protected build(): void {
    const spec = PUZZLES.mastermind.generate(this.req.seed, this.level);
    this.spec = spec;
    this.guess = [];
    this.guesses = [];
    this.rowText = [];
    this.slotHit = [];
    this.histG = this.add.graphics();
    this.slotG = this.add.graphics();
    for (let i = 0; i < spec.maxAttempts; i++) {
      this.rowText.push(makeText(this, HX + 36 + spec.slots * 46, HY + i * ROW_H + ROW_H / 2, '', 28, PAL.ink, { bold: true, oy: 0.5 }));
    }
    this.counter = makeText(this, HX, PY + 66, '', 28, PAL.ink, { bold: true, oy: 0.5 });
    this.status = makeText(this, RX, PY + 108, '', 28, PAL.ink, { bold: true, ox: 0.5, oy: 0.5, align: 'center' });
    const sw = spec.slots * (KEY + 6) - 6;
    for (let s = 0; s < spec.slots; s++) {
      const x = RX - sw / 2 + s * (KEY + 6) + KEY / 2;
      this.slotHit.push(this.add.rectangle(x, PY + 190, KEY, KEY, 0xffffff, 0.001).setInteractive().on('pointerdown', () => this.clearSlot(s)));
    }
    for (let k = 0; k < SYMBOL_COUNT; k++) {
      const x = RX - 108 + (k % 3) * 108;
      const y = PY + 300 + Math.floor(k / 3) * 104;
      makeButton(this, x, y, KEY, KEY, '', () => this.pick(k), { fill: PAL.cloud });
      const g = this.add.graphics().setDepth(2);
      drawSymbol(g, k, x, y, 30);
    }
    this.submitBtn = makeButton(this, RX, PY + 508, 300, KEY, 'Check', () => this.submit(), { fill: PAL.sage, size: 34 });
    this.refresh();
  }

  protected hintLine(): string {
    return this.spec ? PUZZLES.mastermind.hint(this.spec, ...this.hintArgs()) : super.hintLine();
  }

  protected e2eSolve(): void {
    if (!this.spec) return;
    this.guesses = [];
    this.guess = [];
    for (const g of PUZZLES.mastermind.solve(this.spec)) {
      this.guess = [];
      for (const sym of g) this.pick(sym);
      this.submit();
    }
  }

  private refresh(): void {
    const spec = this.spec;
    if (!spec) return;
    const h = this.histG;
    h.clear();
    panelBox(h, HX - 10, HY - 4, 440, spec.maxAttempts * ROW_H + 8, 14, PAL.white, PAL.panelEdge, 3);
    for (let r = 0; r < spec.maxAttempts; r++) {
      const row = this.guesses[r];
      const t = this.rowText[r];
      if (!t) continue;
      if (!row) {
        t.setText('');
        continue;
      }
      row.forEach((sym, c) => drawSymbol(h, sym, HX + 24 + c * 46, HY + r * ROW_H + ROW_H / 2, 15));
      const fb = feedback(spec.secret, row);
      t.setText(`${fb.exact} fit, ${fb.misplaced} near`);
    }
    const g = this.slotG;
    g.clear();
    const sw = spec.slots * (KEY + 6) - 6;
    for (let s = 0; s < spec.slots; s++) {
      const x = RX - sw / 2 + s * (KEY + 6);
      panelBox(g, x, PY + 190 - KEY / 2, KEY, KEY, 14, PAL.white, PAL.panelEdge, 4);
      const sym = this.guess[s];
      if (sym !== undefined) drawSymbol(g, sym, x + KEY / 2, PY + 190, 32);
    }
    this.counter.setText(`Try ${Math.min(this.guesses.length + 1, spec.maxAttempts)} of ${spec.maxAttempts}`);
    this.submitBtn.setEnabled(this.guess.filter((v) => v !== undefined).length === spec.slots);
  }

  private pick(k: number): void {
    const spec = this.spec;
    if (this.solved || !spec) return;
    const slot = Array.from({ length: spec.slots }, (_, i) => i).find((i) => this.guess[i] === undefined);
    if (slot === undefined) return;
    this.guess[slot] = k;
    sfx.play('tap');
    this.status.setText(SYMBOL_NAMES[k] ?? '');
    this.refresh();
  }

  private clearSlot(s: number): void {
    if (this.solved || this.guess[s] === undefined) return;
    delete this.guess[s];
    sfx.play('tap');
    this.refresh();
  }

  private submit(): void {
    const spec = this.spec;
    if (this.solved || !spec) return;
    const full = Array.from({ length: spec.slots }, (_, i) => this.guess[i]);
    if (full.some((v) => v === undefined)) return;
    const row = full as number[];
    this.guesses.push(row);
    this.guess = [];
    if (PUZZLES.mastermind.check(spec, this.guesses)) {
      this.refresh();
      this.status.setText('Cracked it!');
      this.succeed('win');
      return;
    }
    sfx.play('error');
    if (this.guesses.length >= spec.maxAttempts) {
      this.guesses = [];
      this.status.setText('X  Out of tries.\nFresh start!');
    } else {
      this.status.setText('');
    }
    this.refresh();
  }
}
