import Phaser from 'phaser';
import { PUZZLE_SCENE } from '../shared/types';
import { PUZZLES } from '../logic/puzzles';
import { caesar } from '../logic/puzzles/word';
import type { WordSpec } from '../logic/puzzles/word';
import { sfx } from '../audio/sfx';
import { PAL, makeButton, makeText, panelBox, shade } from './ui';
import type { G } from './ui';
import { PW, PX, PY, PuzzleShell } from './PuzzleShell';

const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

interface Cell { ch: string; cx: number; cy: number; w: number; h: number; used: boolean; t: Phaser.GameObjects.Text }
interface Slot { cx: number; cy: number; w: number; h: number; from: number; t: Phaser.GameObjects.Text }

export class WordScene extends PuzzleShell {
  private spec!: WordSpec;
  private word = '';
  private custom = false;
  private keyboard = false;
  private pool: Cell[] = [];
  private slots: Slot[] = [];
  private gPool!: G;
  private gSlots!: G;
  private status!: Phaser.GameObjects.Text;
  private wrong = false;

  constructor() {
    super(PUZZLE_SCENE.word);
  }

  protected defaultTitle(): string {
    return this.level === 3 ? 'Crack the note' : 'Find the word';
  }

  protected contextIsTitle(): boolean {
    return false;
  }

  protected build(): void {
    this.pool = [];
    this.slots = [];
    this.wrong = false;
    // The shared generator decides mode, word, tiles and note, so every level 1-5 plays as AI-2 tuned it.
    this.spec = PUZZLES.word.generate(this.req.seed, this.level, { payload: this.req.payload, context: this.req.context });
    this.keyboard = this.spec.mode === 'cipher';
    this.custom = this.spec.custom;
    this.word = this.spec.word;
    const cx = PX + PW / 2;
    const hint = this.spec.hint;
    makeText(this, cx, PY + 90, hint, 22, PAL.inkSoft, { ox: 0.5, oy: 0.5, align: 'center', wrap: PW - 160 });
    this.gSlots = this.add.graphics();
    this.gPool = this.add.graphics();
    let slotY = PY + 230;
    let statusY = PY + 300;
    if (this.keyboard) {
      this.buildNote(cx);
      slotY = PY + 310;
      statusY = PY + 356;
    }
    this.buildSlots(cx, slotY);
    this.status = makeText(this, cx, statusY, '', 20, PAL.red, { bold: true, ox: 0.5, oy: 0.5, align: 'center' });
    if (this.keyboard) this.buildKeyboard(cx);
    else this.buildTiles(cx, PY + 385);
    const by = PY + 500;
    if (!this.keyboard) {
      makeButton(this, cx - 90, by, 150, 56, 'Clear', () => this.clearAll(), { fill: PAL.steel, size: 22 });
      makeButton(this, cx + 90, by, 150, 56, 'Back', () => this.backspace(), { fill: PAL.sageDark, size: 22 });
    }
    this.refresh();
  }

  private accepted(guess: string): boolean {
    return PUZZLES.word.check(this.spec, guess);
  }

  private buildNote(cx: number): void {
    const shift = this.spec.shift;
    makeText(this, cx, PY + 150, this.spec.coded, 30, PAL.ink, { mono: true, bold: true, ox: 0.5, oy: 0.5, align: 'center', wrap: PW - 120 });
    const plain = ALPHA.split('').join(' ');
    const coded = caesar(ALPHA, shift).split('').join(' ');
    makeText(this, cx, PY + 205, `Real   ${plain}`, 17, PAL.inkSoft, { mono: true, ox: 0.5, oy: 0.5 });
    makeText(this, cx, PY + 232, `Coded  ${coded}`, 17, PAL.terracotta, { mono: true, bold: true, ox: 0.5, oy: 0.5 });
    makeText(this, cx, PY + 262, `Key: A becomes ${caesar('A', shift)}, B becomes ${caesar('B', shift)}, C becomes ${caesar('C', shift)}`, 18, PAL.inkSoft, { ox: 0.5, oy: 0.5 });
  }

  private buildSlots(cx: number, cy: number): void {
    const n = this.word.length;
    const w = Math.min(72, (PW - 160) / n - 10);
    const pitch = w + 10;
    const x0 = cx - (n * pitch - 10) / 2 + w / 2;
    for (let i = 0; i < n; i++) {
      const t = makeText(this, x0 + i * pitch, cy, '', 40, PAL.ink, { bold: true, ox: 0.5, oy: 0.5, align: 'center' });
      this.slots.push({ cx: x0 + i * pitch, cy, w, h: 72, from: -1, t });
    }
    const zone = this.add.zone(cx, cy, n * pitch, 80).setInteractive();
    zone.on('pointerdown', (p: Phaser.Input.Pointer) => {
      for (let i = 0; i < this.slots.length; i++) {
        const s = this.slots[i];
        if (Math.abs(p.x - s.cx) <= s.w / 2 + 4 && Math.abs(p.y - s.cy) <= s.h / 2) {
          this.removeSlot(i);
          return;
        }
      }
    });
  }

  private buildTiles(cx: number, cy: number): void {
    const tiles = this.spec.tiles.slice();
    const n = tiles.length;
    const w = Math.min(72, (PW - 160) / n - 8);
    const pitch = w + 8;
    const x0 = cx - (n * pitch - 8) / 2 + w / 2;
    tiles.forEach((ch, i) => this.addCell(ch, x0 + i * pitch, cy, w, 68));
    this.poolZone(cx, cy, n * pitch + 8, 90);
  }

  private buildKeyboard(cx: number): void {
    const pitch = 68;
    const x0 = cx - 4.5 * pitch;
    const y0 = PY + 400;
    for (let i = 0; i < 26; i++) this.addCell(ALPHA[i], x0 + (i % 10) * pitch, y0 + Math.floor(i / 10) * 58, 60, 52);
    this.poolZone(cx, y0 + 58, 10 * pitch, 3 * 58);
    const by = y0 + 116;
    makeButton(this, x0 + 7 * pitch, by, 112, 52, 'Clear', () => this.clearAll(), { fill: PAL.steel, size: 20 });
    makeButton(this, x0 + 8.75 * pitch, by, 112, 52, 'Back', () => this.backspace(), { fill: PAL.sageDark, size: 20 });
  }

  private addCell(ch: string, cx: number, cy: number, w: number, h: number): void {
    const t = makeText(this, cx, cy, ch, this.keyboard ? 28 : 36, PAL.ink, { bold: true, ox: 0.5, oy: 0.5, align: 'center' });
    this.pool.push({ ch, cx, cy, w, h, used: false, t });
  }

  private poolZone(cx: number, cy: number, w: number, h: number): void {
    const zone = this.add.zone(cx, cy, w, h).setInteractive();
    zone.on('pointerdown', (p: Phaser.Input.Pointer) => {
      for (let i = 0; i < this.pool.length; i++) {
        const c = this.pool[i];
        if (Math.abs(p.x - c.cx) <= c.w / 2 + 3 && Math.abs(p.y - c.cy) <= c.h / 2 + 3) {
          this.place(i);
          return;
        }
      }
    });
  }

  private place(i: number): void {
    if (this.solved) return;
    const c = this.pool[i];
    if (!this.keyboard && c.used) return;
    const s = this.slots.find((k) => k.from < 0);
    if (!s) return;
    s.from = i;
    if (!this.keyboard) c.used = true;
    this.wrong = false;
    sfx.play('tap');
    this.refresh();
    if (this.slots.every((k) => k.from >= 0)) this.check();
  }

  private removeSlot(i: number): void {
    if (this.solved) return;
    const s = this.slots[i];
    if (s.from < 0) return;
    this.pool[s.from].used = false;
    s.from = -1;
    this.wrong = false;
    sfx.play('pop');
    this.refresh();
  }

  private backspace(): void {
    for (let i = this.slots.length - 1; i >= 0; i--) {
      if (this.slots[i].from >= 0) {
        this.removeSlot(i);
        return;
      }
    }
  }

  private clearAll(): void {
    if (this.solved) return;
    for (const s of this.slots) s.from = -1;
    for (const c of this.pool) c.used = false;
    this.wrong = false;
    sfx.play('swoosh');
    this.refresh();
  }

  private check(): void {
    const guess = this.slots.map((s) => this.pool[s.from].ch).join('');
    if (this.accepted(guess)) {
      this.status.setText('');
      this.succeed('win');
    } else {
      this.wrong = true;
      sfx.play('error');
      this.refresh();
    }
  }

  private refresh(): void {
    const gs = this.gSlots;
    gs.clear();
    for (const s of this.slots) {
      const filled = s.from >= 0;
      const fill = filled ? PAL.butter : shade(PAL.panelEdge, 0.4);
      const edge = this.wrong ? PAL.red : filled ? shade(PAL.butter, -0.4) : PAL.panelEdge;
      panelBox(gs, s.cx - s.w / 2, s.cy - s.h / 2, s.w, s.h, 14, fill, edge, this.wrong ? 4 : 3);
      const ch = filled ? this.pool[s.from].ch : '';
      if (s.t.text !== ch) s.t.setText(ch);
    }
    const gp = this.gPool;
    gp.clear();
    for (const c of this.pool) {
      const off = c.used;
      panelBox(gp, c.cx - c.w / 2, c.cy - c.h / 2, c.w, c.h, 12, off ? shade(PAL.cloud, -0.04) : PAL.woodLight, off ? PAL.panelEdge : PAL.woodDark, 3);
      c.t.setAlpha(off ? 0.15 : 1);
    }
    const msg = this.wrong ? 'Not quite - tap a letter to take it out.' : '';
    if (this.status.text !== msg) this.status.setText(msg);
  }
}
