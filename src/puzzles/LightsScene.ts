import Phaser from 'phaser';
import { PUZZLE_SCENE } from '../shared/types';
import { PUZZLES } from '../logic/puzzles';
import type { LightsSpec } from '../logic/puzzles/lights';
import { sfx } from '../audio/sfx';
import { PAL, makeButton, makeText } from '../art/palette';
import { PuzzleShell, PX, PY } from './PuzzleShell';

const CELL = 96;
const GAP = 3;

interface Cell { box: Phaser.GameObjects.Rectangle; dot: Phaser.GameObjects.Arc }

/** Lights Out: tapping a cell flips it and its four neighbours. Goal: every light off. */
export class LightsScene extends PuzzleShell {
  private spec: LightsSpec | null = null;
  private lit: boolean[] = [];
  private presses: number[] = [];
  private cells: Cell[] = [];
  private count!: Phaser.GameObjects.Text;

  constructor() {
    super(PUZZLE_SCENE.lights);
  }

  protected defaultTitle(): string {
    return 'Lights out';
  }

  protected build(): void {
    const spec = PUZZLES.lights.generate(this.req.seed, this.req.difficulty);
    this.spec = spec;
    this.cells = [];
    this.presses = [];
    const n = spec.n;
    const left = PX + 30;
    const top = PY + 56;
    for (let i = 0; i < n * n; i++) {
      const x = left + (i % n) * (CELL + GAP) + CELL / 2;
      const y = top + Math.floor(i / n) * (CELL + GAP) + CELL / 2;
      const box = this.add.rectangle(x, y, CELL, CELL, PAL.steel).setStrokeStyle(4, PAL.panelEdge).setInteractive();
      const dot = this.add.circle(x, y, 28, PAL.butter).setStrokeStyle(6, PAL.terracotta);
      box.on('pointerdown', () => this.press(i));
      this.cells.push({ box, dot });
    }
    const px = PX + 740;
    makeText(this, px, PY + 140, 'Lit tiles glow\nwith a round lamp.\nSwitch them all off.', 28, PAL.ink, { ox: 0.5, oy: 0.5, align: 'center' });
    this.count = makeText(this, px, PY + 270, '', 32, PAL.ink, { bold: true, ox: 0.5, oy: 0.5, align: 'center' });
    makeButton(this, px, PY + 380, 220, CELL, 'Reset', () => this.reset(), { fill: PAL.sageDark, size: 32 });
    this.reset();
  }

  protected hintLine(): string {
    return this.spec ? PUZZLES.lights.hint(this.spec, Math.max(0, this.hints - 1)) : super.hintLine();
  }

  protected e2eSolve(): void {
    if (!this.spec) return;
    this.reset();
    for (const c of PUZZLES.lights.solve(this.spec)) this.press(c);
  }

  private reset(): void {
    if (!this.spec || this.solved) return;
    this.lit = this.spec.cells.slice();
    this.presses = [];
    this.paint();
  }

  private paint(): void {
    for (let i = 0; i < this.cells.length; i++) {
      const c = this.cells[i];
      if (!c) continue;
      const on = this.lit[i] === true;
      c.box.setFillStyle(on ? PAL.ink : PAL.steel);
      c.dot.setVisible(on);
    }
    this.count.setText(`Presses: ${this.presses.length}`);
  }

  private press(i: number): void {
    if (this.solved || !this.spec) return;
    const n = this.spec.n;
    const r = Math.floor(i / n);
    const c = i % n;
    const flip = (k: number): void => { this.lit[k] = !this.lit[k]; };
    flip(i);
    if (r > 0) flip(i - n);
    if (r < n - 1) flip(i + n);
    if (c > 0) flip(i - 1);
    if (c < n - 1) flip(i + 1);
    this.presses.push(i);
    sfx.play('tap');
    this.paint();
    if (PUZZLES.lights.check(this.spec, this.presses)) this.succeed('win');
  }
}
