import Phaser from 'phaser';
import { PUZZLE_SCENE } from '../shared/types';
import { sfx } from '../audio/sfx';
import { PAL, line, makeText, rrect, shade } from './ui';
import type { G } from './ui';
import { PUZZLES } from '../logic/puzzles';
import type { Pt, UntangleSpec } from '../logic/puzzles/untangle';
import { PW, PX, PY, PuzzleShell } from './PuzzleShell';

const AREA = { x: PX + 80, y: PY + 150, w: PW - 160, h: 390 };
const NODE_R = 28;
const THROTTLE_MS = 32;

interface Theme { title: string; rope: number; node: number; hint: string }

function themeFor(ctx: string | undefined): Theme {
  const c = (ctx ?? '').toLowerCase();
  if (/cable|charg|cord|wire/.test(c)) return { title: 'Untangle the cable', rope: 0x3d4651, node: PAL.steel, hint: 'Drag the knots until no cables cross' };
  if (/necklace|chain|pendant|bead/.test(c)) return { title: 'Untangle the necklace', rope: PAL.gold, node: PAL.rose, hint: 'Drag the beads until no chains cross' };
  return { title: 'Untangle the headphones', rope: PAL.blue, node: PAL.terracotta, hint: 'Drag the knots until no cords cross' };
}

export class UntangleScene extends PuzzleShell {
  private theme: Theme = themeFor(undefined);
  private n = 0;
  private ne = 0;
  private px = new Float32Array(0);
  private py = new Float32Array(0);
  private sx = new Float32Array(0);
  private sy = new Float32Array(0);
  private ea = new Int16Array(0);
  private eb = new Int16Array(0);
  private bad = new Uint8Array(0);
  private cxs = new Float32Array(0);
  private cys = new Float32Array(0);
  private nc = 0;
  private lastCalc = 0;
  private edges!: G;
  private nodes: Phaser.GameObjects.Arc[] = [];
  private counter!: Phaser.GameObjects.Text;
  private shown = -1;
  private spec: UntangleSpec | null = null;

  constructor() {
    super(PUZZLE_SCENE.untangle);
  }

  protected defaultTitle(): string {
    return themeFor(this.req.context).title;
  }

  protected build(): void {
    this.theme = themeFor(this.req.context);
    this.nodes = [];
    this.nc = 0;
    this.shown = -1;
    makeText(this, PX + PW / 2, PY + 84, this.theme.hint, 22, PAL.inkSoft, { ox: 0.5, oy: 0.5, align: 'center' });
    this.counter = makeText(this, PX + PW / 2, PY + 120, '', 26, PAL.ink, { bold: true, ox: 0.5, oy: 0.5, align: 'center' });
    const bg = this.add.graphics();
    rrect(bg, AREA.x - 20, AREA.y - 14, AREA.w + 40, AREA.h + 28, 22, PAL.panelEdge, 0.45);
    this.edges = this.add.graphics();
    this.makeGraph();
    this.recalc();
    this.drawEdges(false);
    for (let i = 0; i < this.n; i++) this.makeNode(i);
    this.updateCounter();
    this.input.dragDistanceThreshold = 3;
  }

  /** Graph, solved layout and tangled start come from the shared generator, so levels 1-5 play as AI-2 tuned them. */
  private makeGraph(): void {
    const spec = PUZZLES.untangle.generate(this.req.seed, this.level, { context: this.req.context });
    this.spec = spec;
    const place = (p: Pt, axis: 0 | 1): number => (axis === 0 ? AREA.x + NODE_R + (AREA.w - 2 * NODE_R) * p[0] : AREA.y + NODE_R + (AREA.h - 2 * NODE_R) * p[1]);
    this.n = spec.start.length;
    this.ne = spec.edges.length;
    this.sx = Float32Array.from(spec.solved, (p) => place(p, 0));
    this.sy = Float32Array.from(spec.solved, (p) => place(p, 1));
    this.px = Float32Array.from(spec.start, (p) => place(p, 0));
    this.py = Float32Array.from(spec.start, (p) => place(p, 1));
    this.ea = Int16Array.from(spec.edges, (e) => e[0]);
    this.eb = Int16Array.from(spec.edges, (e) => e[1]);
    this.bad = new Uint8Array(this.ne);
    this.cxs = new Float32Array(this.ne * this.ne + 1);
    this.cys = new Float32Array(this.ne * this.ne + 1);
    this.recalc();
  }

  protected hintLine(): string {
    return this.spec ? PUZZLES.untangle.hint(this.spec, ...this.hintArgs()) : super.hintLine();
  }

  /** Test bot: move every knot to its solved spot, then run the normal crossing check. */
  protected e2eSolve(): void {
    for (let i = 0; i < this.n; i++) {
      this.px[i] = this.sx[i];
      this.py[i] = this.sy[i];
      this.nodes[i]?.setPosition(this.px[i], this.py[i]);
    }
    this.recalc();
    if (this.nc === 0 && !this.solved) this.win();
  }

  private clampNode(i: number): void {
    this.px[i] = Phaser.Math.Clamp(this.px[i], AREA.x + NODE_R, AREA.x + AREA.w - NODE_R);
    this.py[i] = Phaser.Math.Clamp(this.py[i], AREA.y + NODE_R, AREA.y + AREA.h - NODE_R);
  }

  private makeNode(i: number): void {
    const node = this.add.circle(this.px[i], this.py[i], NODE_R, this.theme.node);
    node.setStrokeStyle(4, shade(this.theme.node, -0.45));
    node.setInteractive({ draggable: true, useHandCursor: true });
    node.on('dragstart', () => sfx.play('pop'));
    node.on('drag', (_p: Phaser.Input.Pointer, dx: number, dy: number) => {
      if (this.solved) return;
      this.px[i] = dx;
      this.py[i] = dy;
      this.clampNode(i);
      node.setPosition(this.px[i], this.py[i]);
      if (this.time.now - this.lastCalc >= THROTTLE_MS) {
        this.lastCalc = this.time.now;
        this.recalc();
        this.updateCounter();
      }
      this.drawEdges(false);
    });
    node.on('dragend', () => {
      if (this.solved) return;
      this.recalc();
      this.updateCounter();
      this.drawEdges(false);
      if (this.nc === 0) this.win();
      else sfx.play('tap');
    });
    this.nodes.push(node);
  }

  private recalc(): void {
    this.nc = 0;
    this.bad.fill(0);
    for (let i = 0; i < this.ne; i++) {
      for (let j = i + 1; j < this.ne; j++) {
        const a = this.ea[i];
        const b = this.eb[i];
        const c = this.ea[j];
        const d = this.eb[j];
        if (a === c || a === d || b === c || b === d) continue;
        if (this.cross(a, b, c, d)) {
          this.bad[i] = 1;
          this.bad[j] = 1;
        }
      }
    }
  }

  private cross(a: number, b: number, c: number, d: number): boolean {
    const x1 = this.px[a], y1 = this.py[a], x2 = this.px[b], y2 = this.py[b];
    const x3 = this.px[c], y3 = this.py[c], x4 = this.px[d], y4 = this.py[d];
    const d1 = (x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3);
    const d2 = (x4 - x3) * (y2 - y3) - (y4 - y3) * (x2 - x3);
    const d3 = (x2 - x1) * (y3 - y1) - (y2 - y1) * (x3 - x1);
    const d4 = (x2 - x1) * (y4 - y1) - (y2 - y1) * (x4 - x1);
    if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
      const t = d1 / (d1 - d2);
      this.cxs[this.nc] = x1 + t * (x2 - x1);
      this.cys[this.nc] = y1 + t * (y2 - y1);
      this.nc++;
      return true;
    }
    return false;
  }

  private drawEdges(neutral: boolean): void {
    const g = this.edges;
    g.clear();
    for (let i = 0; i < this.ne; i++) {
      const a = this.ea[i];
      const b = this.eb[i];
      const isBad = !neutral && this.bad[i] === 1;
      line(g, this.px[a], this.py[a], this.px[b], this.py[b], 11, PAL.shadow, 0.35);
      line(g, this.px[a], this.py[a], this.px[b], this.py[b], 7, isBad ? PAL.red : this.theme.rope);
    }
    if (neutral) return;
    for (let k = 0; k < this.nc; k++) {
      const x = this.cxs[k];
      const y = this.cys[k];
      line(g, x - 9, y - 9, x + 9, y + 9, 6, PAL.white);
      line(g, x + 9, y - 9, x - 9, y + 9, 6, PAL.white);
      line(g, x - 8, y - 8, x + 8, y + 8, 3, PAL.red);
      line(g, x + 8, y - 8, x - 8, y + 8, 3, PAL.red);
    }
  }

  private updateCounter(): void {
    if (this.shown === this.nc) return;
    this.shown = this.nc;
    this.counter.setText(this.nc === 0 ? 'No tangles left!' : `Tangles left: ${this.nc}`);
  }

  private win(): void {
    for (const nd of this.nodes) nd.disableInteractive();
    if (this.lowFx) {
      for (let i = 0; i < this.n; i++) {
        this.px[i] = this.sx[i];
        this.py[i] = this.sy[i];
        this.nodes[i].setPosition(this.px[i], this.py[i]);
      }
      this.drawEdges(true);
    } else {
      const fx = Float32Array.from(this.px);
      const fy = Float32Array.from(this.py);
      this.tweens.addCounter({
        from: 0, to: 1, duration: 240,
        onUpdate: (tw) => {
          const v = tw.getValue() ?? 1;
          for (let i = 0; i < this.n; i++) {
            this.px[i] = fx[i] + (this.sx[i] - fx[i]) * v;
            this.py[i] = fy[i] + (this.sy[i] - fy[i]) * v;
            this.nodes[i].setPosition(this.px[i], this.py[i]);
          }
          this.drawEdges(true);
        },
      });
    }
    this.counter.setText('Untangled!');
    this.succeed('snap');
  }
}
