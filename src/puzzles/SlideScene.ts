import Phaser from 'phaser';
import { PUZZLE_SCENE } from '../shared/types';
import { PUZZLES } from '../logic/puzzles';
import type { SlideSpec } from '../logic/puzzles/slide';
import { sfx } from '../audio/sfx';
import { PAL, makeButton, makeText } from './ui';
import { PuzzleShell, PX, PY } from './PuzzleShell';

const CELL = 96;
const GAP = 6;
const N = 3;

interface Cell { box: Phaser.GameObjects.Rectangle; label: Phaser.GameObjects.Text }

/** 3x3 sliding tiles. Tap a tile next to the gap to slide it in. Goal: 1 to 8 in order. */
export class SlideScene extends PuzzleShell {
  private spec: SlideSpec | null = null;
  private tiles: number[] = [];
  private taps: number[] = [];
  private cells: Cell[] = [];
  private count!: Phaser.GameObjects.Text;

  constructor() {
    super(PUZZLE_SCENE.slide);
  }

  protected defaultTitle(): string {
    return 'Slide the tiles';
  }

  protected build(): void {
    const spec = PUZZLES.slide.generate(this.req.seed, this.req.difficulty);
    this.spec = spec;
    this.cells = [];
    const size = N * CELL + (N - 1) * GAP;
    const left = PX + 120;
    const top = PY + 120;
    for (let i = 0; i < N * N; i++) {
      const x = left + (i % N) * (CELL + GAP) + CELL / 2;
      const y = top + Math.floor(i / N) * (CELL + GAP) + CELL / 2;
      const box = this.add.rectangle(x, y, CELL, CELL, PAL.blue).setStrokeStyle(4, PAL.panelEdge).setInteractive();
      const label = makeText(this, x, y, '', 48, PAL.white, { bold: true, ox: 0.5, oy: 0.5 });
      box.on('pointerdown', () => this.tap(i));
      this.cells.push({ box, label });
    }
    this.add.rectangle(left + size / 2, top + size / 2, size + 16, size + 16).setStrokeStyle(4, PAL.panelEdge).setDepth(-1);
    const px = PX + 740;
    makeText(this, px, PY + 170, 'Tap a tile next to\nthe gap to slide it.', 28, PAL.ink, { ox: 0.5, oy: 0.5, align: 'center' });
    this.count = makeText(this, px, PY + 270, '', 32, PAL.ink, { bold: true, ox: 0.5, oy: 0.5, align: 'center' });
    makeButton(this, px, PY + 380, 220, CELL, 'Reset', () => this.reset(), { fill: PAL.sageDark, size: 32 });
    this.reset();
  }

  protected hintLine(): string {
    return this.spec ? PUZZLES.slide.hint(this.spec, Math.max(0, this.hints - 1)) : super.hintLine();
  }

  protected e2eSolve(): void {
    if (!this.spec) return;
    this.reset();
    for (const c of PUZZLES.slide.solve(this.spec)) this.tap(c);
  }

  private reset(): void {
    if (!this.spec || this.solved) return;
    this.tiles = this.spec.tiles.slice();
    this.taps = [];
    this.paint();
  }

  private paint(): void {
    for (let i = 0; i < this.cells.length; i++) {
      const c = this.cells[i];
      if (!c) continue;
      const v = this.tiles[i] ?? 0;
      c.box.setVisible(v !== 0);
      c.label.setText(v === 0 ? '' : String(v));
    }
    this.count.setText(`Moves: ${this.taps.length}`);
  }

  private tap(i: number): void {
    if (this.solved || !this.spec) return;
    const blank = this.tiles.indexOf(0);
    const dr = Math.abs(Math.floor(i / N) - Math.floor(blank / N));
    const dc = Math.abs((i % N) - (blank % N));
    if (dr + dc !== 1) {
      sfx.play('error');
      return;
    }
    this.tiles[blank] = this.tiles[i] ?? 0;
    this.tiles[i] = 0;
    this.taps.push(i);
    sfx.play('tap');
    this.paint();
    if (PUZZLES.slide.check(this.spec, this.taps)) this.succeed('win');
  }
}
