import Phaser from 'phaser';
import { PUZZLE_SCENE } from '../shared/types';
import { PUZZLES } from '../logic/puzzles';
import { applyOp } from '../logic/puzzles/target';
import type { Op, TargetSpec, TargetStep } from '../logic/puzzles/target';
import { sfx } from '../audio/sfx';
import { PAL, makeButton, makeText } from './ui';
import type { Btn, G } from './ui';
import { PX, PY, PW, PuzzleShell } from './PuzzleShell';

const SIZE = 96;
const GAP = 12;
const OPS: readonly Op[] = ['+', '-', '*', '/'];
const GLYPH: Record<Op, string> = { '+': '+', '-': '-', '*': 'x', '/': '/' };

/** Reach the target by combining number tiles two at a time. Each tile is used once; results become new tiles. */
export class TargetScene extends PuzzleShell {
  private spec: TargetSpec | null = null;
  private pool: number[] = [];
  private alive: boolean[] = [];
  private history: TargetStep[] = [];
  private order: number[] = []; // pool indices of the tiles currently shown, left to right
  private selA = -1;
  private selOp: Op | null = null;
  private tiles: Btn[] = [];
  private opBtns: Btn[] = [];
  private ring!: G;
  private status!: Phaser.GameObjects.Text;
  private line!: Phaser.GameObjects.Text;

  constructor() {
    super(PUZZLE_SCENE.target);
  }

  protected defaultTitle(): string {
    return 'Make the number';
  }

  protected build(): void {
    const spec = PUZZLES.target.generate(this.req.seed, this.level);
    this.spec = spec;
    this.history = [];
    this.tiles = [];
    this.opBtns = [];
    const cx = PX + PW / 2;
    makeText(this, cx, PY + 108, `Make ${spec.target}`, 48, PAL.ink, { bold: true, ox: 0.5, oy: 0.5 });
    this.line = makeText(this, cx, PY + 160, '', 32, PAL.ink, { bold: true, ox: 0.5, oy: 0.5, align: 'center' });
    this.status = makeText(this, cx, PY + 202, '', 28, PAL.ink, { ox: 0.5, oy: 0.5, align: 'center' });
    this.ring = this.add.graphics().setDepth(5);
    const n = spec.numbers.length;
    const x0 = cx - (n * (SIZE + GAP) - GAP) / 2 + SIZE / 2;
    for (let i = 0; i < n; i++) {
      this.tiles.push(makeButton(this, x0 + i * (SIZE + GAP), PY + 270, SIZE, SIZE, '', () => this.tapSlot(i), { fill: PAL.blue, size: 44 }));
    }
    const ox = cx - (4 * (SIZE + GAP) - GAP) / 2 + SIZE / 2;
    OPS.forEach((op, i) => {
      this.opBtns.push(makeButton(this, ox + i * (SIZE + GAP), PY + 386, SIZE, SIZE, GLYPH[op], () => this.pickOp(op), { fill: PAL.terracotta, size: 52 }));
    });
    makeButton(this, cx - 135, PY + 496, 260, SIZE, 'Undo', () => this.undo(), { fill: PAL.steel, size: 32 });
    makeButton(this, cx + 135, PY + 496, 260, SIZE, 'Reset', () => this.reset(), { fill: PAL.sageDark, size: 32 });
    this.recompute();
  }

  protected hintLine(): string {
    return this.spec ? PUZZLES.target.hint(this.spec, ...this.hintArgs()) : super.hintLine();
  }

  /** Reference solution applied through the same tap handlers a finger uses. */
  protected e2eSolve(): void {
    if (!this.spec) return;
    this.reset();
    for (const s of PUZZLES.target.solve(this.spec)) {
      this.tapPool(s.a);
      this.pickOp(s.op);
      this.tapPool(s.b);
    }
  }

  /** Replays the history from the original numbers (also used by undo/reset). */
  private recompute(): void {
    if (!this.spec) return;
    this.pool = this.spec.numbers.slice();
    this.alive = this.pool.map(() => true);
    for (const s of this.history) {
      const r = applyOp(this.pool[s.a] ?? 0, this.pool[s.b] ?? 0, s.op);
      this.alive[s.a] = false;
      this.alive[s.b] = false;
      this.pool.push(r ?? 0);
      this.alive.push(true);
    }
    this.selA = -1;
    this.selOp = null;
    this.layout();
  }

  private layout(): void {
    this.order = [];
    for (let i = 0; i < this.pool.length; i++) if (this.alive[i]) this.order.push(i);
    for (let s = 0; s < this.tiles.length; s++) {
      const t = this.tiles[s];
      if (!t) continue;
      const idx = this.order[s];
      t.setVisible(idx !== undefined);
      if (idx !== undefined) t.setLabel(String(this.pool[idx] ?? 0));
    }
    this.drawSelection();
  }

  private drawSelection(): void {
    this.ring.clear();
    this.ring.lineStyle(8, PAL.ink, 1);
    const slot = this.selA >= 0 ? this.order.indexOf(this.selA) : -1;
    const sb = this.tiles[slot];
    if (sb) {
      const b = sb.g.input?.hitArea as Phaser.Geom.Rectangle | undefined;
      if (b) this.ring.strokeRoundedRect(b.x - 6, b.y - 6, b.width + 12, b.height + 12, 18);
    }
    const oi = this.selOp ? OPS.indexOf(this.selOp) : -1;
    const ob = this.opBtns[oi];
    const ob2 = ob?.g.input?.hitArea as Phaser.Geom.Rectangle | undefined;
    if (ob2) this.ring.strokeRoundedRect(ob2.x - 6, ob2.y - 6, ob2.width + 12, ob2.height + 12, 18);
    const a = this.selA >= 0 ? String(this.pool[this.selA] ?? '') : '?';
    const o = this.selOp ? GLYPH[this.selOp] : '?';
    const text = this.selA >= 0 || this.selOp ? `${a} ${o} ?` : 'Pick a number, an operator, then a number';
    if (this.line.text !== text) this.line.setText(text);
  }

  private tapSlot(slot: number): void {
    const idx = this.order[slot];
    if (idx !== undefined) this.tapPool(idx);
  }

  private tapPool(idx: number): void {
    if (this.solved || !this.alive[idx]) return;
    sfx.play('tap');
    if (this.status.text !== '') this.status.setText('');
    if (this.selA < 0 || this.selOp === null) {
      this.selA = this.selA === idx ? -1 : idx;
      this.drawSelection();
      return;
    }
    if (idx === this.selA) return;
    this.apply(this.selA, idx, this.selOp);
  }

  private pickOp(op: Op): void {
    if (this.solved) return;
    sfx.play('tap');
    this.selOp = this.selOp === op ? null : op;
    this.drawSelection();
  }

  private apply(a: number, b: number, op: Op): void {
    const av = this.pool[a] ?? 0;
    const bv = this.pool[b] ?? 0;
    const r = applyOp(av, bv, op);
    if (r === null) {
      this.status.setText('X  That does not work (whole numbers only)');
      sfx.play('error');
      this.selOp = null;
      this.drawSelection();
      return;
    }
    this.history.push({ a, b, op });
    this.recompute();
    this.status.setText(`${av} ${GLYPH[op]} ${bv} = ${r}`);
    if (this.spec && PUZZLES.target.check(this.spec, this.history)) {
      this.status.setText(`${av} ${GLYPH[op]} ${bv} = ${r}   Got it!`);
      this.succeed('win');
    }
  }

  private undo(): void {
    if (this.solved || this.history.length === 0) return;
    sfx.play('tap');
    this.history.pop();
    this.recompute();
    this.status.setText('');
  }

  private reset(): void {
    if (this.solved) return;
    this.history = [];
    this.recompute();
    this.status.setText('');
  }
}
