import Phaser from 'phaser';
import { PUZZLE_SCENE } from '../shared/types';
import { PUZZLES } from '../logic/puzzles';
import type { SequenceSpec } from '../logic/puzzles/sequence';
import { sfx } from '../audio/sfx';
import { PAL, makeButton, makeText, panelBox } from '../art/palette';
import type { Btn } from '../art/palette';
import { PX, PY, PW, PuzzleShell } from './PuzzleShell';
import { KEYPAD_W, buildKeypad } from './Keypad';

const BOX_W = 104;
const BOX_H = 96;
const BOX_GAP = 8;
const MAX_DIGITS = 5;

/** Find the missing term. Multiple choice on difficulty 1-2, keypad entry on 3. */
export class SequenceScene extends PuzzleShell {
  private spec: SequenceSpec | null = null;
  private typed = '';
  private blank!: Phaser.GameObjects.Text;
  private status!: Phaser.GameObjects.Text;
  private choices: Btn[] = [];

  constructor() {
    super(PUZZLE_SCENE.sequence);
  }

  protected defaultTitle(): string {
    return 'What comes in the gap?';
  }

  private get keypadMode(): boolean {
    return this.req.difficulty === 3;
  }

  protected build(): void {
    const spec = PUZZLES.sequence.generate(this.req.seed, this.req.difficulty);
    this.spec = spec;
    this.typed = '';
    this.choices = [];
    const cx = PX + PW / 2;
    const n = spec.terms.length;
    const x0 = cx - (n * (BOX_W + BOX_GAP) - BOX_GAP) / 2;
    const g = this.add.graphics();
    for (let i = 0; i < n; i++) {
      const x = x0 + i * (BOX_W + BOX_GAP);
      const t = spec.terms[i];
      const gap = t === null || t === undefined;
      // The gap is a thick dark outline with a "?": distinguishable without colour.
      panelBox(g, x, PY + 100, BOX_W, BOX_H, 14, gap ? PAL.butter : PAL.white, gap ? PAL.terracotta : PAL.panelEdge, gap ? 7 : 4);
      const label = gap ? '?' : String(t);
      const txt = makeText(this, x + BOX_W / 2, PY + 100 + BOX_H / 2, label, label.length > 3 ? 36 : 44, PAL.ink, { bold: true, ox: 0.5, oy: 0.5 });
      if (gap) this.blank = txt;
    }
    this.status = makeText(this, cx, PY + 224, '', 30, PAL.ink, { bold: true, ox: 0.5, oy: 0.5, align: 'center' });
    if (this.keypadMode) {
      buildKeypad(this, cx - KEYPAD_W / 2, PY + 390, { digit: (d) => this.press(d), back: () => this.back(), enter: () => this.enter() });
    } else {
      spec.options.forEach((v, i) => {
        const x = cx + (i % 2 === 0 ? -160 : 160);
        const y = PY + 320 + Math.floor(i / 2) * 116;
        this.choices.push(makeButton(this, x, y, 300, 96, String(v), () => this.choose(v, i), { fill: PAL.blue, size: 44 }));
      });
    }
  }

  protected hintLine(): string {
    return this.spec ? PUZZLES.sequence.hint(this.spec, Math.max(0, this.hints - 1)) : super.hintLine();
  }

  protected e2eSolve(): void {
    const spec = this.spec;
    if (!spec) return;
    if (this.keypadMode) {
      this.typed = '';
      for (const ch of String(PUZZLES.sequence.solve(spec))) this.press(ch);
      this.enter();
    } else {
      const v = PUZZLES.sequence.solve(spec);
      this.choose(v, spec.options.indexOf(v));
    }
  }

  private choose(v: number, i: number): void {
    if (this.solved || !this.spec) return;
    if (PUZZLES.sequence.check(this.spec, v)) {
      this.blank.setText(String(v));
      this.status.setText(`Yes! ${this.spec.rule}`);
      sfx.play('tap');
      this.succeed('win');
      return;
    }
    this.status.setText(`X  ${v} is not it`);
    sfx.play('error');
    this.choices[i]?.setEnabled(false);
  }

  private show(): void {
    const s = this.typed === '' ? '?' : this.typed;
    if (this.blank.text !== s) this.blank.setText(s);
  }

  private press(d: string): void {
    if (this.solved || this.typed.length >= MAX_DIGITS) return;
    this.typed += d;
    sfx.play('tap');
    this.show();
  }

  private back(): void {
    if (this.solved || this.typed === '') return;
    this.typed = this.typed.slice(0, -1);
    sfx.play('tap');
    this.show();
  }

  private enter(): void {
    if (this.solved || !this.spec || this.typed === '') return;
    const v = Number(this.typed);
    if (PUZZLES.sequence.check(this.spec, v)) {
      this.status.setText(`Yes! ${this.spec.rule}`);
      this.succeed('win');
      return;
    }
    this.status.setText(`X  ${this.typed} is not it`);
    sfx.play('error');
    this.typed = '';
    this.show();
  }
}
