import Phaser from 'phaser';
import type { Clue } from '../shared/types';
import { PAL, makeText } from '../art/palette';

const MAX_SHOWN = 5;
const DW = 400;

/** Notes drawer: discovered clues with their numeric facts highlighted. Built once, only toggled afterwards. */
export class PuzzleNotes {
  private readonly box: Phaser.GameObjects.Container;
  private shown = false;

  constructor(scene: Phaser.Scene, x: number, y: number, h: number, notes: readonly Clue[]) {
    this.box = scene.add.container(x, y).setDepth(40).setVisible(false);
    const bg = scene.add.graphics();
    bg.fillStyle(PAL.shadow, 0.25);
    bg.fillRoundedRect(4, 6, DW, h, 20);
    bg.fillStyle(PAL.panel, 1);
    bg.fillRoundedRect(0, 0, DW, h, 20);
    bg.lineStyle(4, PAL.panelEdge, 1);
    bg.strokeRoundedRect(0, 0, DW, h, 20);
    this.box.add(bg);
    this.box.add(makeText(scene, DW / 2, 30, 'Notes', 30, PAL.ink, { bold: true, ox: 0.5, oy: 0.5 }));
    const list = notes.slice(-MAX_SHOWN);
    if (list.length === 0) {
      this.box.add(makeText(scene, DW / 2, h / 2, 'No clues yet.\nSearch the rooms.', 28, PAL.ink, { ox: 0.5, oy: 0.5, align: 'center' }));
    }
    let cy = 70;
    for (const c of list) {
      this.box.add(makeText(scene, 20, cy, c.title, 28, PAL.ink, { bold: true, wrap: DW - 40 }));
      cy += 38;
      const facts = c.facts ?? [];
      if (facts.length === 0) {
        const t = c.text.length > 56 ? `${c.text.slice(0, 55)}...` : c.text;
        this.box.add(makeText(scene, 20, cy, t, 28, PAL.ink, { wrap: DW - 40 }));
        cy += 74;
      }
      for (const f of facts) {
        const chip = scene.add.graphics();
        chip.fillStyle(PAL.butter, 1);
        chip.fillRoundedRect(16, cy - 2, DW - 32, 42, 10);
        chip.lineStyle(3, PAL.terracotta, 1);
        chip.strokeRoundedRect(16, cy - 2, DW - 32, 42, 10); // outline + fill: not colour alone
        this.box.add(chip);
        this.box.add(makeText(scene, 26, cy + 19, `${f.label}: ${f.value}`, 28, PAL.ink, { bold: true, oy: 0.5 }));
        cy += 48;
      }
      cy += 12;
    }
    if (notes.length > MAX_SHOWN) {
      this.box.add(makeText(scene, DW / 2, h - 24, `+${notes.length - MAX_SHOWN} older`, 28, PAL.ink, { ox: 0.5, oy: 0.5 }));
    }
  }

  get open(): boolean { return this.shown; }

  set(open: boolean): void {
    this.shown = open;
    this.box.setVisible(open);
  }

  toggle(): void { this.set(!this.shown); }
}
