import Phaser from 'phaser';
import { isLowFx } from '../core/perf';
import { LAYOUT } from '../core/layout';
import { frame } from '../art/manifest';
import { GAME_W, LEGACY_ROOMS, tex } from '../shared/types';
import type { ItemId, RoomId } from '../shared/types';
import { Button } from './Button';
import { TRAY_STEP, TRAY_H, centre, hudBoxes, trayBox } from './hudLayout';
import type { Box } from './hudLayout';
import { COLOR, CSS, DEPTH, ROOM_LABEL, drawPlate, fmtClock, isCalm, makeText } from './theme';

export interface HudHandlers {
  onPause(): void;
  onClues(): void;
  onHint(): void;
  onRoom(room: RoomId): void;
  /** HUD v3: when set, a 96x96 house button replaces the room tabs. */
  onHouse?(): void;
}

export interface HudConfig {
  targets: ItemId[];
  timed: boolean;
  rooms: RoomId[];
  active: RoomId;
  handlers: HudHandlers;
}

interface Slot {
  img: Phaser.GameObjects.Image;
  /** Real item art to swap in when found (set when the slot shows a baked `_sil` silhouette). */
  real?: { atlas: string; frame: string };
  outline: Phaser.GameObjects.Image[];
  check: Phaser.GameObjects.Text;
  x: number;
  y: number;
  done: boolean;
}

const TAB_W = 124;
const TAB_GAP = 6;
const TAB_X0 = 92;
const SLOT_STEP = 72;
const SLOT_Y = 686;

/** Top bar (pause, room tabs, timer, clues, hint) and bottom target tray. All built once. */
export class Hud {
  private readonly root: Phaser.GameObjects.Container;
  private readonly tabs = new Map<RoomId, Button>();
  private readonly slots = new Map<ItemId, Slot>();
  private readonly timerText: Phaser.GameObjects.Text;
  private readonly badge: Phaser.GameObjects.Container;
  private readonly badgeText: Phaser.GameObjects.Text;
  private readonly hintBtn: Button;
  private readonly clueBtn: Button;
  private houseBtn: Button | null = null;
  private readonly home: boolean;
  private readonly pauseBtn: Button;
  private trayRect: Box = { x: 0, y: 0, w: 0, h: 0 };
  private lastSec = -1;
  private tone = 0;
  private clueCount = -1;
  private hintCount = -1;

  constructor(private readonly scene: Phaser.Scene, cfg: HudConfig) {
    this.root = scene.add.container(0, 0).setDepth(DEPTH.hud);

    const onHouse = cfg.handlers.onHouse;
    this.home = !!onHouse;
    const g = hudBoxes(LAYOUT.w, LAYOUT.h, cfg.targets.length, 0);
    if (!this.home) {
      const bar = scene.add.graphics();
      bar.fillStyle(COLOR.plate, 0.94);
      bar.fillRect(0, 0, GAME_W, 64);
      bar.fillStyle(COLOR.plateEdge, 1);
      bar.fillRect(0, 62, GAME_W, 2);
      this.root.add(bar);
    }

    const pc = centre(g.pause);
    this.pauseBtn = this.home
      ? new Button(scene, pc.x, pc.y, g.pause.w, 'II', cfg.handlers.onPause, { fontSize: 32, height: g.pause.h })
      : new Button(scene, 52, 32, 56, 'II', cfg.handlers.onPause, { fontSize: 28, height: 56 });
    this.root.add(this.pauseBtn);

    if (onHouse) {
      const hc = centre(g.house);
      this.houseBtn = new Button(scene, hc.x, hc.y, g.house.w, 'Home', onHouse, { fontSize: 24, height: g.house.h });
      this.root.add(this.houseBtn);
    } else {
      for (const room of LEGACY_ROOMS) {
        const tab = new Button(scene, 0, 32, TAB_W, ROOM_LABEL[room], () => cfg.handlers.onRoom(room), {
          fontSize: 24,
          height: 56,
        });
        this.tabs.set(room, tab);
        this.root.add(tab);
      }
    }
    this.setRooms(cfg.rooms);
    this.setActive(cfg.active);

    const tc = this.home ? centre(g.timer) : { x: 790, y: 32 };
    this.timerText = makeText(scene, tc.x, tc.y, '', { fontSize: '36px', fontStyle: 'bold' }).setOrigin(0.5);
    this.timerText.setVisible(cfg.timed);
    this.root.add(this.timerText);

    const cc = this.home ? centre(g.clues) : { x: 938, y: 32 };
    const wide = this.home ? g.clues.w : 176;
    const bh = this.home ? g.clues.h : 56;
    const fs = this.home ? 24 : 28;
    const clueBtn = new Button(scene, cc.x, cc.y, wide, 'Clues', cfg.handlers.onClues, { fontSize: fs, height: bh });
    this.clueBtn = clueBtn;
    this.root.add(clueBtn);
    const dot = scene.add.graphics();
    dot.fillStyle(COLOR.red, 1);
    dot.fillCircle(0, 0, 16);
    dot.lineStyle(3, COLOR.cream, 1);
    dot.strokeCircle(0, 0, 16);
    this.badgeText = makeText(scene, 0, 0, '0', { fontSize: '22px', fontStyle: 'bold' }).setOrigin(0.5);
    this.badge = scene.add.container(cc.x + wide / 2 - 4, cc.y - bh / 2 + 10, [dot, this.badgeText]).setVisible(false);
    this.root.add(this.badge);

    const hh = this.home ? centre(g.hint) : { x: 1126, y: 32 };
    this.hintBtn = new Button(scene, hh.x, hh.y, wide, 'Hint', cfg.handlers.onHint, { fontSize: fs, height: bh });
    this.root.add(this.hintBtn);

    this.buildTray(cfg.targets);
    this.setClues(0);
    this.setHints(0);
  }

  /** Shows only the given rooms' tabs, packed from the left. */
  setRooms(rooms: RoomId[]): void {
    let i = 0;
    for (const room of LEGACY_ROOMS) {
      const tab = this.tabs.get(room);
      if (!tab) continue;
      const on = rooms.includes(room);
      tab.setShown(on);
      if (on) {
        tab.x = TAB_X0 + TAB_W / 2 + i * (TAB_W + TAB_GAP);
        i++;
      }
    }
  }

  setActive(room: RoomId): void {
    for (const [id, tab] of this.tabs) tab.setVariant(id === room ? 'primary' : 'plain');
  }

  /** Updates the countdown text; returns true when the displayed second changed. */
  setTimer(sec: number): boolean {
    const s = Math.max(0, Math.ceil(sec));
    if (s === this.lastSec) return false;
    this.lastSec = s;
    this.timerText.setText(fmtClock(s));
    if (s <= 10 && s > 0 && !isCalm(this.scene)) {
      this.scene.tweens.killTweensOf(this.timerText);
      this.timerText.setScale(1);
      this.scene.tweens.add({ targets: this.timerText, scale: 1.25, duration: 150, yoyo: true });
    }
    const tone = s < 10 ? 2 : s < 20 ? 1 : 0;
    if (tone !== this.tone || this.lastSec === s) {
      this.tone = tone;
      this.timerText.setColor(tone === 2 ? CSS.red : tone === 1 ? CSS.amber : CSS.cream);
    }
    return true;
  }

  /** Position of the Clues button, for effects that fly into it. */
  get cluePos(): { x: number; y: number } {
    return { x: this.clueBtn.x, y: this.clueBtn.y };
  }

  /** Small wiggle on the Clues button when a clue arrives. */
  wiggleClues(): void {
    if (isCalm(this.scene)) return;
    this.scene.tweens.killTweensOf(this.clueBtn);
    this.clueBtn.setAngle(0);
    this.scene.tweens.add({ targets: this.clueBtn, angle: 4, duration: 60, yoyo: true, repeat: 3, onComplete: () => this.clueBtn.setAngle(0) });
  }

  setClues(count: number): void {
    if (count === this.clueCount) return;
    const grew = count > this.clueCount && this.clueCount >= 0;
    this.clueCount = count;
    this.badge.setVisible(count > 0);
    this.badgeText.setText(String(count));
    if (grew && !isLowFx(this.scene.game) && !isCalm(this.scene)) {
      this.scene.tweens.killTweensOf(this.badge);
      this.badge.setScale(1);
      this.scene.tweens.add({ targets: this.badge, scale: 1.35, duration: 120, yoyo: true });
    }
  }

  setHints(used: number): void {
    if (used === this.hintCount) return;
    this.hintCount = used;
    this.hintBtn.setLabel(used > 0 ? `Hint (${used})` : 'Hint');
  }

  slotPos(item: ItemId): { x: number; y: number } | null {
    const s = this.slots.get(item);
    return s ? { x: s.x, y: s.y } : null;
  }

  markFound(item: ItemId): void {
    const s = this.slots.get(item);
    if (!s || s.done) return;
    s.done = true;
    s.img.clearTint();
    s.img.setAlpha(1);
    if (s.real) s.img.setTexture(s.real.atlas, s.real.frame);
    for (const o of s.outline) o.setVisible(false);
    s.check.setVisible(true);
    if (!isCalm(this.scene)) {
      const base = s.img.scaleX;
      this.scene.tweens.add({ targets: s.img, scaleX: base * 1.25, scaleY: base * 1.25, duration: 120, yoyo: true });
      s.check.setScale(2.2);
      this.scene.tweens.add({ targets: s.check, scale: 1, duration: 160, ease: 'Back.easeOut' });
    }
  }

  flashTab(room: RoomId): void {
    const tab = this.tabs.get(room) ?? this.houseBtn;
    if (!tab || isCalm(this.scene)) return;
    this.scene.tweens.killTweensOf(tab);
    tab.setAlpha(1);
    this.scene.tweens.add({
      targets: tab,
      alpha: 0.25,
      duration: 140,
      yoyo: true,
      repeat: 3,
      onComplete: () => tab.setAlpha(1),
    });
  }

  destroy(): void {
    for (const tab of this.tabs.values()) this.scene.tweens.killTweensOf(tab);
    if (this.houseBtn) this.scene.tweens.killTweensOf(this.houseBtn);
    this.scene.tweens.killTweensOf(this.badge);
    this.scene.tweens.killTweensOf(this.clueBtn);
    this.scene.tweens.killTweensOf(this.timerText);
    this.root.destroy(true);
  }

  /** One item image: the `icon/<item>` art frame when it is loaded, else the procedural item texture. */
  private itemImage(item: ItemId, x: number, y: number): Phaser.GameObjects.Image {
    const art = frame(`icon/${item}`);
    const img = art ? this.scene.add.image(x, y, art.atlas, art.frame) : this.scene.add.image(x, y, tex.item(item));
    const k = 64 / Math.max(img.width, img.height);
    return img.setScale(k);
  }

  private buildTray(targets: ItemId[]): void {
    const n = targets.length;
    if (n === 0) return;
    const box = trayBox(LAYOUT.w, LAYOUT.h, n);
    this.trayRect = box;
    const tray = this.scene.add.graphics();
    drawPlate(tray, box.x, box.y, box.w, box.h, 18, COLOR.plate, COLOR.plateEdge);
    this.root.add(tray);
    const y = box.y + TRAY_H / 2;
    targets.forEach((item, i) => {
      const x = box.x + 12 + TRAY_STEP / 2 + i * TRAY_STEP;
      // Not found yet: a cream silhouette with a dark outline (readable on the dark plate), never a black blob.
      const sil = frame(`icon/${item}_sil`);
      const realArt = frame(`icon/${item}`);
      // Baked silhouette art when it exists; otherwise the real icon as a cream fill with a dark outline.
      const outline = sil ? [] : [[-3, 0], [3, 0], [0, -3], [0, 3]].map(([dx, dy]) => this.itemImage(item, x + dx, y + dy).setTintFill(COLOR.plateEdge));
      const img = sil ? this.scene.add.image(x, y, sil.atlas, sil.frame).setScale(64 / Math.max(sil.w, sil.h)) : this.itemImage(item, x, y).setTintFill(COLOR.cream).setAlpha(0.75);
      const check = makeText(this.scene, x + 26, y - 28, '✓', { fontSize: '30px', fontStyle: 'bold', color: CSS.green }).setOrigin(0.5);
      check.setVisible(false);
      this.root.add([...outline, img, check]);
      this.slots.set(item, { img, outline, check, x, y, done: false, real: sil && realArt ? { atlas: realArt.atlas, frame: realArt.frame } : undefined });
    });
  }

  /** Real on-screen rects of every HUD element this class owns (for the overlap audit). */
  rects(): Array<{ id: string; x: number; y: number; w: number; h: number }> {
    const out: Array<{ id: string; x: number; y: number; w: number; h: number }> = [];
    const add = (id: string, o: Phaser.GameObjects.GameObject | null, on = true): void => {
      if (!o || !on) return;
      const b = (o as unknown as Phaser.GameObjects.Components.GetBounds).getBounds();
      out.push({ id, x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) });
    };
    add('pause', this.pauseBtn); add('house', this.houseBtn); add('clues', this.clueBtn); add('hint', this.hintBtn);
    add('timer', this.timerText, this.timerText.visible);
    if (this.trayRect.w > 0) out.push({ id: 'tray', x: this.trayRect.x, y: this.trayRect.y, w: this.trayRect.w, h: this.trayRect.h });
    return out;
  }
}
