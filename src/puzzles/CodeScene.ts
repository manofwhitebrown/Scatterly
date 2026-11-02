import Phaser from 'phaser';
import { PUZZLE_SCENE } from '../shared/types';
import type { PlayerProfile } from '../shared/types';
import { PUZZLES } from '../logic/puzzles';
import type { CodeSpec } from '../logic/puzzles/codeLock';
import type { Fact } from '../logic/puzzles/types';
import { sfx } from '../audio/sfx';
import { PAL, makeText, panelBox } from '../art/palette';
import type { G } from '../art/palette';
import { PX, PY, PuzzleShell } from './PuzzleShell';
import { KEYPAD_W, buildKeypad } from './Keypad';

const GAP = 8;
const CELL_W = 84;
const CELL_H = 96;

/** Keypad lock. The rule on top refers to clue facts the player found earlier (see the notes drawer). */
export class CodeScene extends PuzzleShell {
  private spec: CodeSpec | null = null;
  private typed = '';
  private cells: Phaser.GameObjects.Text[] = [];
  private frame!: G;
  private status!: Phaser.GameObjects.Text;
  private wrongCount = 0;

  constructor() {
    super(PUZZLE_SCENE.code);
  }

  protected defaultTitle(): string {
    return 'Crack the code';
  }

  /** Distinct facts from every discovered clue, first one wins per key. */
  private gatherFacts(): Fact[] {
    const seen = new Set<string>();
    const out: Fact[] = [];
    for (const c of this.notes) {
      for (const f of c.facts ?? []) {
        if (seen.has(f.key)) continue;
        seen.add(f.key);
        out.push({ key: f.key, label: f.label, value: f.value });
      }
    }
    return out;
  }

  protected build(): void {
    this.typed = '';
    this.wrongCount = 0;
    this.cells = [];
    const spec = PUZZLES.code.generate(this.req.seed, this.req.difficulty, { facts: this.gatherFacts() });
    this.spec = spec;
    const left = PX + 16; // keypad column, clear of the notes drawer
    const cx = left + KEYPAD_W / 2;
    makeText(this, cx, PY + 112, spec.rule, 30, PAL.ink, { bold: true, ox: 0.5, oy: 0.5, align: 'center', wrap: KEYPAD_W });
    if (spec.own) {
      const given = spec.facts.map((f) => `${f.label} ${f.value}`).join('  |  ');
      makeText(this, cx, PY + 170, given, 28, PAL.ink, { ox: 0.5, oy: 0.5, align: 'center', wrap: KEYPAD_W });
    }
    this.frame = this.add.graphics();
    const x0 = cx - (spec.digits * (CELL_W + GAP) - GAP) / 2;
    for (let i = 0; i < spec.digits; i++) {
      const x = x0 + i * (CELL_W + GAP);
      panelBox(this.frame, x, PY + 205, CELL_W, CELL_H, 14, PAL.white, PAL.panelEdge, 4);
      this.cells.push(makeText(this, x + CELL_W / 2, PY + 205 + CELL_H / 2, '', 52, PAL.ink, { bold: true, ox: 0.5, oy: 0.5 }));
    }
    this.status = makeText(this, cx, PY + 328, '', 28, PAL.ink, { bold: true, ox: 0.5, oy: 0.5, align: 'center' });
    buildKeypad(this, left, PY + 400, { digit: (d) => this.press(d), back: () => this.back(), enter: () => this.enter() });
  }

  protected hintLine(): string {
    return this.spec ? PUZZLES.code.hint(this.spec, Math.max(0, this.hints - 1)) : super.hintLine();
  }

  protected e2eSolve(): void {
    if (!this.spec) return;
    this.typed = '';
    for (const ch of PUZZLES.code.solve(this.spec)) this.press(ch);
    this.enter();
  }

  private render(): void {
    for (let i = 0; i < this.cells.length; i++) {
      const t = this.cells[i];
      if (!t) continue;
      const s = this.typed.charAt(i);
      if (t.text !== s) t.setText(s);
    }
  }

  private press(d: string): void {
    if (this.solved || !this.spec || this.typed.length >= this.spec.digits) return;
    this.typed += d;
    sfx.play('tap');
    if (this.status.text !== '') this.status.setText('');
    this.render();
  }

  private back(): void {
    if (this.solved || this.typed.length === 0) return;
    this.typed = this.typed.slice(0, -1);
    sfx.play('tap');
    this.render();
  }

  private enter(): void {
    if (this.solved || !this.spec) return;
    if (this.typed.length < this.spec.digits) {
      this.status.setText(`Needs ${this.spec.digits} digits`);
      sfx.play('error');
      return;
    }
    if (PUZZLES.code.check(this.spec, this.typed)) {
      this.status.setText('Click! Unlocked');
      this.succeed('win');
      return;
    }
    this.wrongCount++;
    this.status.setText(`X  Not the code (${this.wrongCount})`); // symbol + words, never colour only
    sfx.play('error');
    this.typed = '';
    this.render();
    const prof = this.game.registry.get('profile') as PlayerProfile | undefined;
    if (!prof?.settings.reducedMotion) {
      this.tweens.add({ targets: this.cells, x: '+=10', duration: 60, yoyo: true, repeat: 1 });
    }
  }
}

