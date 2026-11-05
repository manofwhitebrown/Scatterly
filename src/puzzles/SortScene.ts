import Phaser from 'phaser';
import { PUZZLE_SCENE } from '../shared/types';
import { sfx } from '../audio/sfx';
import { PAL, circle, line, makeText, panelBox, poly, rotPts, shade } from './ui';
import type { G } from './ui';
import { PUZZLES } from '../logic/puzzles';
import type { SortSpec } from '../logic/puzzles/sort';
import { PW, PX, PY, PuzzleShell } from './PuzzleShell';

type Mode = 'colour' | 'shape' | 'type' | 'combo';

const COLOURS = [
  { n: 'Red', c: PAL.red }, { n: 'Blue', c: PAL.blue }, { n: 'Yellow', c: PAL.yellow },
];

interface Piece {
  colour: number; shape: number; cat: number; label: string; bin: number;
  box: Phaser.GameObjects.Container; g: G; text: Phaser.GameObjects.Text;
  hx: number; hy: number; done: boolean;
}
interface BinDef { label: string; x: number; y: number; w: number; h: number; count: number; g: G }

function catIcon(g: G, cat: number, cx: number, cy: number): void {
  if (cat === 0) {
    g.fillStyle(0x7c8791, 1);
    g.fillEllipse(cx, cy - 10, 18, 24);
    line(g, cx, cy, cx, cy + 20, 6, 0x7c8791);
  } else if (cat === 1) {
    poly(g, rotPts([cx - 6, cy - 20, cx + 6, cy - 20, cx + 6, cy + 10, cx, cy + 22, cx - 6, cy + 10], cx, cy, 0.6), PAL.butter);
    poly(g, rotPts([cx - 6, cy - 20, cx + 6, cy - 20, cx + 6, cy - 12, cx - 6, cy - 12], cx, cy, 0.6), PAL.rose);
  } else {
    poly(g, rotPts([cx - 3, cy - 6, cx + 3, cy - 6, cx + 3, cy + 22, cx - 3, cy + 22], cx, cy, 0.5), PAL.woodDark);
    poly(g, rotPts([cx - 14, cy - 18, cx + 14, cy - 18, cx + 14, cy - 6, cx - 14, cy - 6], cx, cy, 0.5), 0x7c8791);
  }
}

function shapeGlyph(g: G, shape: number, cx: number, cy: number, col: number, s = 1): void {
  if (shape === 0) circle(g, cx, cy, 22 * s, col);
  else if (shape === 1) panelBox(g, cx - 21 * s, cy - 21 * s, 42 * s, 42 * s, 8, col);
  else poly(g, [cx, cy - 24 * s, cx + 25 * s, cy + 20 * s, cx - 25 * s, cy + 20 * s], col);
}

export class SortScene extends PuzzleShell {
  private mode: Mode = 'colour';
  private pieces: Piece[] = [];
  private bins: BinDef[] = [];
  private sel = -1;
  private placed = 0;
  private dragMoved = false;
  private rule = '';
  private spec: SortSpec | null = null;

  constructor() {
    super(PUZZLE_SCENE.sort);
  }

  protected defaultTitle(): string {
    return 'Tidy the drawer';
  }

  protected build(): void {
    this.pieces = [];
    this.bins = [];
    this.sel = -1;
    this.placed = 0;
    this.dragMoved = false;
    const specs = this.generate();
    makeText(this, PX + PW / 2, PY + 90, this.rule, 24, PAL.inkSoft, { ox: 0.5, oy: 0.5, align: 'center' });
    this.makeBins();
    this.makePieces(specs);
    this.input.dragDistanceThreshold = 10;
    this.input.on('pointerdown', () => { this.dragMoved = false; });
  }

  /** Pieces and bins come from the shared generator (AI-2), so the scene plays exactly what the logic tests cover. */
  private generate(): { colour: number; shape: number; cat: number; label: string; bin: number }[] {
    const spec = PUZZLES.sort.generate(this.req.seed, this.level);
    this.spec = spec;
    this.mode = spec.mode;
    this.rule = spec.rule;
    this.addBins(spec.bins, spec.bins.length);
    return spec.pieces.map((p) => ({ colour: p.colour, shape: p.shape, cat: p.cat, label: p.label, bin: p.bin }));
  }

  protected hintLine(): string {
    return this.spec ? PUZZLES.sort.hint(this.spec, ...this.hintArgs()) : super.hintLine();
  }

  /** Test bot: drop every piece into its bin through the same handler a tap uses. */
  protected e2eSolve(): void {
    this.pieces.forEach((p, i) => this.tryPlace(i, p.bin, false));
  }

  private pendingLabels: string[] = [];

  private addBins(labels: string[], n: number): void {
    this.pendingLabels = labels.slice(0, n);
  }

  private makeBins(): void {
    const labels = this.pendingLabels;
    const nb = labels.length;
    const w = nb === 2 ? 380 : 290;
    const gap = 20;
    const total = nb * w + (nb - 1) * gap;
    const x0 = PX + PW / 2 - total / 2;
    const y = PY + 380;
    const h = 140;
    labels.forEach((label, i) => {
      const x = x0 + i * (w + gap);
      const g = this.add.graphics();
      panelBox(g, x, y, w, h, 18, shade(PAL.wood, 0.45), PAL.woodDark, 3);
      this.binIcon(g, i, x + 36, y + 34);
      makeText(this, x + 70, y + 34, label, 20, PAL.ink, { bold: true, oy: 0.5, wrap: w - 84 });
      g.setInteractive(new Phaser.Geom.Rectangle(x, y, w, h), Phaser.Geom.Rectangle.Contains);
      g.on('pointerup', () => {
        if (this.sel >= 0 && !this.solved) this.tryPlace(this.sel, i, false);
      });
      this.bins.push({ label, x, y, w, h, count: 0, g });
    });
  }

  private binIcon(g: G, i: number, cx: number, cy: number): void {
    if (this.mode === 'colour') {
      const name = this.pendingLabels[i];
      const c = COLOURS.find((k) => k.n === name);
      circle(g, cx, cy, 18, c ? c.c : PAL.steel);
    } else if (this.mode === 'shape') {
      shapeGlyph(g, i, cx, cy, PAL.steel, 0.8);
    } else if (this.mode === 'type') {
      catIcon(g, i, cx, cy);
    } else if (i === 0) {
      circle(g, cx, cy, 18, PAL.red);
    } else if (i === 1) {
      g.lineStyle(4, PAL.ink, 1);
      g.strokeCircle(cx, cy, 16);
    } else {
      for (let k = -1; k <= 1; k++) circle(g, cx + k * 14, cy, 6, PAL.steel);
    }
  }

  private makePieces(specs: { colour: number; shape: number; cat: number; label: string; bin: number }[]): void {
    const n = specs.length;
    const cols = Math.min(n, 6);
    const rows = Math.ceil(n / cols);
    const sx = (PW - 160) / cols;
    const baseY = rows === 1 ? PY + 250 : PY + 190;
    specs.forEach((s, i) => {
      const c = i % cols;
      const r = Math.floor(i / cols);
      const hx = PX + 80 + sx * (c + 0.5) + (this.rand() - 0.5) * 16;
      const hy = baseY + r * 112 + (this.rand() - 0.5) * 12;
      const g = this.add.graphics();
      const text = makeText(this, 0, 36, s.label, 15, PAL.ink, { bold: true, ox: 0.5, oy: 0.5, align: 'center', wrap: 92 });
      const box = this.add.container(hx, hy, [g, text]);
      box.setSize(92, 100);
      box.setAngle((this.rand() - 0.5) * 16);
      box.setInteractive({ draggable: true });
      const p: Piece = { colour: s.colour, shape: s.shape, cat: s.cat, label: s.label, bin: s.bin, box, g, text, hx, hy, done: false };
      this.pieces.push(p);
      this.drawPiece(i);
      this.wire(i);
    });
  }

  private drawPiece(i: number): void {
    const p = this.pieces[i];
    const g = p.g;
    g.clear();
    if (this.sel === i) {
      g.fillStyle(PAL.butter, 0.55);
      g.fillRoundedRect(-44, -48, 88, 100, 16);
      g.lineStyle(4, PAL.ink, 1);
      g.strokeRoundedRect(-44, -48, 88, 100, 16);
    }
    if (this.mode === 'type') {
      panelBox(g, -28, -36, 56, 56, 12, PAL.cloud);
      catIcon(g, p.cat, 0, -10);
    } else {
      shapeGlyph(g, p.shape, 0, -12, COLOURS[p.colour].c);
    }
  }

  private select(i: number): void {
    const prev = this.sel;
    this.sel = i;
    if (prev >= 0 && prev !== i) this.drawPiece(prev);
    if (i >= 0) this.drawPiece(i);
  }

  private wire(i: number): void {
    const p = this.pieces[i];
    p.box.on('pointerdown', () => { this.dragMoved = false; });
    p.box.on('dragstart', () => {
      if (p.done || this.solved) return;
      this.dragMoved = true;
      const was = this.sel;
      this.select(-1);
      if (was !== i) sfx.play('pop');
      p.box.setDepth(10);
    });
    p.box.on('drag', (_ptr: Phaser.Input.Pointer, dx: number, dy: number) => {
      if (p.done || this.solved) return;
      p.box.setPosition(dx, dy);
    });
    p.box.on('dragend', (ptr: Phaser.Input.Pointer) => {
      if (p.done || this.solved) return;
      p.box.setDepth(0);
      const b = this.binAt(ptr.x, ptr.y);
      if (b >= 0) this.tryPlace(i, b, true);
      else this.tweens.add({ targets: p.box, x: p.hx, y: p.hy, duration: 150 });
    });
    p.box.on('pointerup', () => {
      if (this.dragMoved || p.done || this.solved) return;
      sfx.play('tap');
      this.select(this.sel === i ? -1 : i);
    });
  }

  private binAt(x: number, y: number): number {
    for (let i = 0; i < this.bins.length; i++) {
      const b = this.bins[i];
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return i;
    }
    return -1;
  }

  private tryPlace(i: number, bin: number, dragged: boolean): void {
    const p = this.pieces[i];
    if (p.done) return;
    if (p.bin !== bin) {
      sfx.play('error');
      const finish = (): void => {
        this.tweens.add({
          targets: p.box, x: p.hx + 9, duration: 45, yoyo: true, repeat: 2,
          onComplete: () => { p.box.setX(p.hx); },
        });
      };
      if (dragged) this.tweens.add({ targets: p.box, x: p.hx, y: p.hy, duration: 120, onComplete: finish });
      else finish();
      return;
    }
    p.done = true;
    p.box.disableInteractive();
    this.select(-1);
    const b = this.bins[bin];
    const slot = b.count++;
    const tx = b.x + 40 + slot * 62;
    const ty = b.y + b.h - 40;
    p.text.setVisible(false);
    sfx.play('snap');
    this.tweens.add({ targets: p.box, x: tx, y: ty, scale: 0.68, angle: 0, duration: 180 });
    this.placed++;
    if (this.placed === this.pieces.length) this.succeed('win');
  }
}
