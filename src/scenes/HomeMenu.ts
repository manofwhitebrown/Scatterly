import Phaser from 'phaser';
import { commitProfile } from '../core/save';
import { LAYOUT } from '../core/layout';
import { Button } from '../ui/Button';
import { titleBox } from '../ui/hudLayout';
import { COLOR, DEPTH, SAFE, drawPlate, getProfile, go, makeText } from '../ui/theme';
import { GAME_H, SCENE } from '../shared/types';
import type { GameMode, SessionLength } from '../shared/types';
import { SHEET_LENGTHS, SHEET_MODES, startData } from './homeSheet';

const BH = 96;

/** Menu-as-house: Play / Journal / Settings over the Overview, and the small Play sheet (mode + length chips + Start). */
export class HomeMenu {
  private readonly items: Phaser.GameObjects.GameObject[] = [];
  private sheet: Phaser.GameObjects.GameObject[] = [];
  private mode: GameMode = 'relaxed';

  constructor(private readonly scene: Phaser.Scene) {
    const y = GAME_H - SAFE - BH / 2;
    const bw = 260;
    const xs = [LAYOUT.w / 2 - bw - 24, LAYOUT.w / 2, LAYOUT.w / 2 + bw + 24];
    this.items.push(
      new Button(scene, xs[0], y, bw, 'Play', () => this.openSheet(), { variant: 'primary', height: BH }),
      new Button(scene, xs[1], y, bw, 'Journal', () => go(scene, SCENE.Journal), { height: BH }),
      new Button(scene, xs[2], y, bw, 'Settings', () => go(scene, SCENE.Settings), { height: BH }),
    );
    const title = makeText(scene, titleBox(LAYOUT.w).x + titleBox(LAYOUT.w).w, titleBox(LAYOUT.w).y, 'Scatterly', { fontSize: '64px', fontStyle: 'bold', stroke: '#16252a', strokeThickness: 8 }).setOrigin(1, 0);
    const sub = makeText(scene, titleBox(LAYOUT.w).x + titleBox(LAYOUT.w).w - 4, titleBox(LAYOUT.w).y + 66, "Where'd I put it?", { fontSize: '28px', stroke: '#16252a', strokeThickness: 5 }).setOrigin(1, 0);
    this.items.push(title, sub);
    for (const it of this.items) (it as Phaser.GameObjects.Container).setDepth(DEPTH.hud);
  }

  private openSheet(): void {
    if (this.sheet.length) return;
    const s = this.scene;
    const w = 760; const h = 456; const x = LAYOUT.w / 2 - w / 2; const y = GAME_H / 2 - h / 2 - 20;
    const dim = s.add.rectangle(LAYOUT.w / 2, GAME_H / 2, LAYOUT.w, GAME_H, 0x000000, 0.35).setDepth(DEPTH.dim).setInteractive();
    dim.on('pointerup', () => this.closeSheet());
    const plate = s.add.graphics().setDepth(DEPTH.panel);
    drawPlate(plate, x, y, w, h, 0, COLOR.plate, COLOR.plateLight);
    const title = makeText(s, LAYOUT.w / 2, y + 44, 'Start a morning').setOrigin(0.5).setDepth(DEPTH.panel);
    this.sheet = [dim, plate, title];
    const row = (cy: number, labels: string[], sel: number, pick: (i: number) => void): void => {
      const btns: Button[] = [];
      labels.forEach((label, i) => {
        const b = new Button(s, LAYOUT.w / 2 + (i - 1) * 232, cy, 216, label, () => {
          pick(i);
          btns.forEach((o, j) => o.setVariant(j === i ? 'primary' : 'plain'));
        }, { variant: i === sel ? 'primary' : 'plain', height: BH });
        b.setDepth(DEPTH.panel);
        btns.push(b);
      });
      this.sheet.push(...btns);
    };
    const p = getProfile(s);
    row(y + 130, SHEET_MODES.map((m) => m.label), 0, (i) => { this.mode = SHEET_MODES[i].mode; });
    row(y + 246, SHEET_LENGTHS.map((l) => l.label), SHEET_LENGTHS.findIndex((l) => l.length === p.settings.sessionLength), (i) => this.setLength(SHEET_LENGTHS[i].length));
    const by = y + h - 24 - BH / 2;
    const start = new Button(s, LAYOUT.w / 2, by, 320, 'Start', () => go(s, SCENE.Home, startData(this.mode)), { variant: 'primary', height: BH });
    start.setDepth(DEPTH.panel);
    this.sheet.push(start);
  }

  private setLength(length: SessionLength): void {
    const p = getProfile(this.scene);
    commitProfile(this.scene.game, { ...p, settings: { ...p.settings, sessionLength: length } });
  }

  sheetOpen(): boolean { return this.sheet.length > 0; }

  closeSheet(): void {
    for (const o of this.sheet) o.destroy();
    this.sheet = [];
  }

  setShown(shown: boolean): void {
    if (!shown) this.closeSheet();
    for (const it of this.items) (it as Phaser.GameObjects.Container).setVisible(shown);
  }

  destroy(): void {
    this.closeSheet();
    for (const it of this.items) it.destroy();
    this.items.length = 0;
  }
}
