import Phaser from 'phaser';
import { PUZZLE_SCENE } from '../shared/types';
import { PUZZLES } from '../logic/puzzles';
import { rotate } from '../logic/puzzles/pipes';
import type { PipesSpec } from '../logic/puzzles/pipes';
import { sfx } from '../audio/sfx';
import { PAL, makeButton, makeText } from '../art/palette';
import { PuzzleShell, PX, PY } from './PuzzleShell';

const CELL = 96;
const GAP = 3;
const N = 1, E = 2, S = 4, W = 8;
const ARM = 40;

interface Cell { box: Phaser.GameObjects.Rectangle; g: Phaser.GameObjects.Graphics; x: number; y: number }

/** Rotate tiles so water flows from the source (diamond) to every ring. Flowing pipes light up and rings fill. */
export class PipesScene extends PuzzleShell {
  private spec: PipesSpec | null = null;
  private rots: number[] = [];
  private cells: Cell[] = [];
  private info!: Phaser.GameObjects.Text;

  constructor() {
    super(PUZZLE_SCENE.pipes);
  }

  protected defaultTitle(): string {
    return 'Connect the pipes';
  }

  protected build(): void {
    const spec = PUZZLES.pipes.generate(this.req.seed, this.req.difficulty);
    this.spec = spec;
    this.cells = [];
    const n = spec.n;
    const left = PX + 30;
    const top = PY + 56;
    for (let i = 0; i < n * n; i++) {
      const x = left + (i % n) * (CELL + GAP) + CELL / 2;
      const y = top + Math.floor(i / n) * (CELL + GAP) + CELL / 2;
      const box = this.add.rectangle(x, y, CELL, CELL, PAL.cloud).setStrokeStyle(4, PAL.panelEdge).setInteractive();
      const g = this.add.graphics({ x, y });
      box.on('pointerdown', () => this.turn(i));
      this.cells.push({ box, g, x, y });
    }
    const px = PX + 740;
    makeText(this, px, PY + 140, 'Diamond = water.\nRing = must be\nreached.', 28, PAL.ink, { ox: 0.5, oy: 0.5, align: 'center' });
    this.info = makeText(this, px, PY + 270, '', 32, PAL.ink, { bold: true, ox: 0.5, oy: 0.5, align: 'center' });
    makeButton(this, px, PY + 380, 220, CELL, 'Reset', () => this.reset(), { fill: PAL.sageDark, size: 32 });
    this.reset();
  }

  protected hintLine(): string {
    return this.spec ? PUZZLES.pipes.hint(this.spec, Math.max(0, this.hints - 1)) : super.hintLine();
  }

  protected e2eSolve(): void {
    const spec = this.spec;
    if (!spec) return;
    this.reset();
    PUZZLES.pipes.solve(spec).forEach((want, i) => {
      const turns = (((want - (this.rots[i] ?? 0)) % 4) + 4) % 4;
      for (let k = 0; k < turns; k++) this.turn(i);
    });
  }

  private reset(): void {
    if (!this.spec || this.solved) return;
    this.rots = this.spec.rots.slice();
    this.paint();
  }

  private mask(i: number): number {
    return this.spec ? rotate(this.spec.base[i] ?? 0, this.rots[i] ?? 0) : 0;
  }

  /** Cells the water reaches from the source (display only; winning is decided by PUZZLES.pipes.check). */
  private flow(): Set<number> {
    const spec = this.spec;
    const reach = new Set<number>();
    if (!spec) return reach;
    const n = spec.n;
    reach.add(spec.source);
    const queue = [spec.source];
    for (let qi = 0; qi < queue.length; qi++) {
      const cur = queue[qi] ?? 0;
      const m = this.mask(cur);
      const r = Math.floor(cur / n);
      const c = cur % n;
      const tries: Array<[boolean, number, number]> = [
        [(m & N) !== 0 && r > 0, cur - n, S], [(m & E) !== 0 && c < n - 1, cur + 1, W],
        [(m & S) !== 0 && r < n - 1, cur + n, N], [(m & W) !== 0 && c > 0, cur - 1, E],
      ];
      for (const [ok, nb, need] of tries) {
        if (ok && !reach.has(nb) && (this.mask(nb) & need) !== 0) {
          reach.add(nb);
          queue.push(nb);
        }
      }
    }
    return reach;
  }

  private paint(): void {
    const spec = this.spec;
    if (!spec) return;
    const reach = this.flow();
    for (let i = 0; i < this.cells.length; i++) {
      const cell = this.cells[i];
      if (!cell) continue;
      const wet = reach.has(i);
      const m = this.mask(i);
      const g = cell.g;
      g.clear();
      const col = wet ? PAL.blue : PAL.steel;
      g.lineStyle(24, col, 1);
      if (m & N) g.lineBetween(0, 0, 0, -ARM);
      if (m & E) g.lineBetween(0, 0, ARM, 0);
      if (m & S) g.lineBetween(0, 0, 0, ARM);
      if (m & W) g.lineBetween(0, 0, -ARM, 0);
      g.fillStyle(col, 1);
      g.fillCircle(0, 0, 13);
      if (i === spec.source) {
        g.fillStyle(PAL.butter, 1);
        g.lineStyle(5, PAL.ink, 1);
        g.fillTriangle(0, -22, 22, 0, -22, 0);
        g.fillTriangle(0, 22, 22, 0, -22, 0);
        g.strokeTriangle(0, -22, 22, 0, -22, 0);
        g.strokeTriangle(0, 22, 22, 0, -22, 0);
      } else if (spec.sinks.includes(i)) {
        g.lineStyle(7, PAL.ink, 1);
        if (wet) {
          g.fillStyle(PAL.butter, 1);
          g.fillCircle(0, 0, 21);
        }
        g.strokeCircle(0, 0, 21);
      }
    }
    const got = spec.sinks.filter((s) => reach.has(s)).length;
    this.info.setText(`Rings reached:\n${got} of ${spec.sinks.length}`);
  }

  private turn(i: number): void {
    if (this.solved || !this.spec) return;
    this.rots[i] = ((this.rots[i] ?? 0) + 1) % 4;
    sfx.play('tap');
    this.paint();
    if (PUZZLES.pipes.check(this.spec, this.rots)) this.succeed('win');
  }
}
