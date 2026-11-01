import Phaser from 'phaser';
import { sfx } from '../audio/sfx';
import { GAME_H, GAME_W, tex } from '../shared/types';
import type { Clue, RoomId, SpotId } from '../shared/types';
import { Button } from './Button';
import { ScrollArea } from './ScrollArea';
import { COLOR, CSS, DEPTH, SIZE, drawPlate, makeText } from './theme';

export interface ClueBoardHandlers {
  onClose(): void;
  /** A strong clue was tapped (room/spotId filled), or a weak one (both undefined). */
  onPoint(room: RoomId | undefined, spotId: SpotId | undefined): void;
}

interface CardView {
  icon: Phaser.GameObjects.Image;
  title: Phaser.GameObjects.Text;
  body: Phaser.GameObjects.Text;
}

const HEADER_H = 88;
const CARD_W = 560;
const CARD_H = 196;
const COL_X = [60, 660];
const ROW_STEP = 212;
const TOP = 108;

/** Full-screen corkboard of every discovered clue. Scrolls by drag/wheel; strong clues are tappable hints. */
export class ClueBoard {
  private readonly root: Phaser.GameObjects.Container;
  private readonly layer: Phaser.GameObjects.Container;
  private readonly cardsGfx: Phaser.GameObjects.Graphics;
  private readonly empty: Phaser.GameObjects.Text;
  private readonly scroll: ScrollArea;
  private readonly cards: CardView[] = [];
  private clues: Clue[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly spotRoom: (id: SpotId) => RoomId | undefined,
    private readonly handlers: ClueBoardHandlers,
  ) {
    this.root = scene.add.container(0, 0).setDepth(DEPTH.board).setVisible(false);

    const bg = scene.add.graphics();
    bg.fillStyle(COLOR.cork, 1);
    bg.fillRect(0, 0, GAME_W, GAME_H);
    bg.lineStyle(10, COLOR.corkDark, 1);
    bg.strokeRect(5, 5, GAME_W - 10, GAME_H - 10);
    const zone = scene.add.zone(0, 0, GAME_W, GAME_H).setOrigin(0, 0);
    this.layer = scene.add.container(0, 0);
    this.cardsGfx = scene.add.graphics();
    this.layer.add(this.cardsGfx);

    const header = scene.add.graphics();
    drawPlate(header, 0, 0, GAME_W, HEADER_H, 0, COLOR.plate);
    header.fillStyle(COLOR.plateEdge, 1);
    header.fillRect(0, HEADER_H - 3, GAME_W, 3);
    const title = makeText(scene, 40, HEADER_H / 2, 'Clue Board', {
      fontSize: `${SIZE.heading}px`,
      fontStyle: 'bold',
      color: CSS.amber,
    }).setOrigin(0, 0.5);
    this.empty = makeText(scene, GAME_W / 2, 360, 'No clues yet. Search the furniture to find some!', {
      fontSize: `${SIZE.label}px`,
      align: 'center',
      color: CSS.cream,
    }).setOrigin(0.5);
    const close = new Button(scene, GAME_W - 24 - 70, HEADER_H / 2, 140, 'Close', () => this.close(), {
      variant: 'primary',
      height: 60,
    });
    this.root.add([bg, zone, this.layer, header, title, this.empty, close]);

    this.scroll = new ScrollArea(scene, this.layer, zone, {
      viewHeight: GAME_H,
      onTap: (x, y) => this.tapAt(x, y),
    });
  }

  get isOpen(): boolean {
    return this.root.visible;
  }

  show(clues: Clue[]): void {
    this.clues = clues;
    this.empty.setVisible(clues.length === 0);
    this.cardsGfx.clear();
    const rows = Math.ceil(clues.length / 2);
    while (this.cards.length < clues.length) this.cards.push(this.buildCard());
    this.cards.forEach((card, i) => {
      const clue = clues[i];
      card.icon.setVisible(clue !== undefined);
      card.title.setVisible(clue !== undefined);
      card.body.setVisible(clue !== undefined);
      if (!clue) return;
      const x = COL_X[i % 2] ?? 60;
      const y = TOP + Math.floor(i / 2) * ROW_STEP;
      const strong = clue.links.some((l) => l.strength === 'strong');
      this.cardsGfx.fillStyle(0x000000, 0.28);
      this.cardsGfx.fillRoundedRect(x + 5, y + 7, CARD_W, CARD_H, 12);
      drawPlate(this.cardsGfx, x, y, CARD_W, CARD_H, 12, COLOR.paper, strong ? COLOR.amber : COLOR.paperEdge);
      this.cardsGfx.fillStyle(COLOR.red, 1);
      this.cardsGfx.fillCircle(x + CARD_W / 2, y + 10, 9);
      card.icon.setTexture(tex.icon(clue.icon)).setPosition(x + 56, y + 62);
      card.title.setText(clue.title).setPosition(x + 104, y + 24);
      card.body.setText(clue.text).setPosition(x + 104, y + 62);
    });
    this.scroll.setContentHeight(TOP + rows * ROW_STEP + 16);
    this.root.setVisible(true);
    this.scroll.attach();
    sfx.play('open');
  }

  hide(): void {
    this.scroll.detach();
    this.root.setVisible(false);
  }

  destroy(): void {
    this.scroll.detach();
    this.root.destroy(true);
  }

  private close(): void {
    if (!this.root.visible) return;
    this.hide();
    sfx.play('close');
    this.handlers.onClose();
  }

  private tapAt(x: number, contentY: number): void {
    if (contentY < HEADER_H) return;
    const col = x >= (COL_X[1] ?? 660) ? 1 : 0;
    const cx = x - (COL_X[col] ?? 60);
    const ry = contentY - TOP;
    if (cx < 0 || cx > CARD_W || ry < 0) return;
    const row = Math.floor(ry / ROW_STEP);
    if (ry - row * ROW_STEP > CARD_H) return;
    const clue = this.clues[row * 2 + col];
    if (!clue) return;
    const link = clue.links.find((l) => l.strength === 'strong' && (l.spotId !== undefined || l.room !== undefined));
    if (!link) {
      this.hide();
      this.handlers.onPoint(undefined, undefined);
      return;
    }
    const room = link.room ?? (link.spotId !== undefined ? this.spotRoom(link.spotId) : undefined);
    this.hide();
    this.handlers.onPoint(room, link.spotId);
  }

  private buildCard(): CardView {
    const icon = this.scene.add.image(0, 0, tex.icon('note')).setDisplaySize(64, 64);
    const title = makeText(this.scene, 0, 0, '', {
      fontSize: `${SIZE.label}px`,
      fontStyle: 'bold',
      color: CSS.ink,
      wordWrap: { width: 430 },
      maxLines: 1,
    });
    const body = makeText(this.scene, 0, 0, '', { color: CSS.ink, wordWrap: { width: 430 }, maxLines: 4 });
    this.layer.add([icon, title, body]);
    return { icon, title, body };
  }
}
