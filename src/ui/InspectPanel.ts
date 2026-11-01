import Phaser from 'phaser';
import { sfx } from '../audio/sfx';
import { isLowFx } from '../core/perf';
import { ITEM_LABEL, tex } from '../shared/types';
import type { Clue, ItemId } from '../shared/types';
import { Button } from './Button';
import { COLOR, CSS, DEPTH, Dim, SIZE, drawPlate, makeText } from './theme';

export interface InspectHandlers {
  /** Player tapped an item. (x, y) is the tile centre in game coordinates (for the fly-to-HUD tween). */
  onTake(item: ItemId, x: number, y: number): void;
  onClose(): void;
}

interface Tile {
  box: Phaser.GameObjects.Container;
  img: Phaser.GameObjects.Image;
  label: Phaser.GameObjects.Text;
  item: ItemId | null;
  pressed: boolean;
}

interface NoteCard {
  icon: Phaser.GameObjects.Image;
  title: Phaser.GameObjects.Text;
  body: Phaser.GameObjects.Text;
}

const PX = 140;
const PY = 76;
const PW = 1000;
const PH = 628;
const TILE_W = 140;
const TILE_H = 164;
const TILE_STEP = 156;
const MAX_TILES = 5;
const MAX_NOTES = 3;
const NOTE_H = 132;
const NOTE_STEP = 140;

/** Search-result panel: items to tap and take, plus paper clue cards. Built once, shown/hidden. */
export class InspectPanel {
  private readonly root: Phaser.GameObjects.Container;
  private readonly title: Phaser.GameObjects.Text;
  private readonly message: Phaser.GameObjects.Text;
  private readonly notesGfx: Phaser.GameObjects.Graphics;
  private readonly tiles: Tile[] = [];
  private readonly notes: NoteCard[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly dim: Dim,
    private readonly handlers: InspectHandlers,
  ) {
    this.root = scene.add.container(0, 0).setDepth(DEPTH.panel).setVisible(false);

    const plate = scene.add.graphics();
    plate.fillStyle(0x000000, 0.3);
    plate.fillRoundedRect(PX + 4, PY + 8, PW, PH, 28);
    drawPlate(plate, PX, PY, PW, PH, 28, COLOR.plate, COLOR.amber);
    this.root.add(plate);

    this.title = makeText(scene, PX + PW / 2, PY + 46, '', {
      fontSize: `${SIZE.heading}px`,
      fontStyle: 'bold',
      color: CSS.amber,
    }).setOrigin(0.5);
    this.message = makeText(scene, PX + PW / 2, PY + 90, '', {
      align: 'center',
      wordWrap: { width: PW - 160 },
      maxLines: 2,
      color: CSS.muted,
    }).setOrigin(0.5, 0);
    this.notesGfx = scene.add.graphics();
    this.root.add([this.title, this.message, this.notesGfx]);

    for (let i = 0; i < MAX_TILES; i++) this.tiles.push(this.buildTile());
    for (let i = 0; i < MAX_NOTES; i++) this.notes.push(this.buildNote());

    this.root.add(new Button(scene, PX + PW - 48, PY + 46, 56, '✕', () => this.close(), { fontSize: 26, height: 56 }));
  }

  get isOpen(): boolean {
    return this.root.visible;
  }

  show(title: string, items: ItemId[], clues: Clue[], message: string): void {
    this.title.setText(title);
    this.message.setText(message);
    this.message.setVisible(message.length > 0);
    const top = PY + 90 + (message.length > 0 ? this.message.height + 14 : 6);

    const shown = Math.min(items.length, MAX_TILES);
    this.tiles.forEach((tile, i) => {
      const item = i < shown ? items[i] : undefined;
      tile.item = item ?? null;
      tile.pressed = false;
      tile.box.setScale(1);
      tile.box.setVisible(item !== undefined);
      if (tile.box.input) tile.box.input.enabled = item !== undefined;
      if (item === undefined) return;
      tile.img.setTexture(tex.item(item));
      tile.label.setText(ITEM_LABEL[item]);
      tile.box.setPosition(PX + PW / 2 + (i - (shown - 1) / 2) * TILE_STEP, top + TILE_H / 2);
    });

    const noteTop = top + (shown > 0 ? TILE_H + 12 : 0);
    const count = Math.min(clues.length, shown > 0 ? 2 : MAX_NOTES);
    this.notesGfx.clear();
    this.notes.forEach((note, i) => {
      const clue = i < count ? clues[i] : undefined;
      note.icon.setVisible(clue !== undefined);
      note.title.setVisible(clue !== undefined);
      note.body.setVisible(clue !== undefined);
      if (!clue) return;
      const y = noteTop + i * NOTE_STEP;
      this.notesGfx.fillStyle(0x000000, 0.25);
      this.notesGfx.fillRoundedRect(PX + 24, y + 5, PW - 48, NOTE_H, 12);
      drawPlate(this.notesGfx, PX + 20, y, PW - 40, NOTE_H, 12, COLOR.paper, COLOR.paperEdge);
      note.icon.setTexture(tex.icon(clue.icon)).setPosition(PX + 20 + 56, y + NOTE_H / 2);
      note.title.setText(clue.title).setPosition(PX + 20 + 104, y + 12);
      note.body.setText(clue.text).setPosition(PX + 20 + 104, y + 46);
    });

    this.root.setVisible(true);
    this.dim.show(DEPTH.dim, () => this.close());
    sfx.play('open');
    if (!isLowFx(this.scene.game)) {
      this.scene.tweens.killTweensOf(this.root);
      this.root.setAlpha(0);
      this.scene.tweens.add({ targets: this.root, alpha: 1, duration: 120 });
    } else {
      this.root.setAlpha(1);
    }
  }

  /** Hides the take tile for an item the player has just picked up. */
  removeItem(item: ItemId): void {
    for (const tile of this.tiles) {
      if (tile.item !== item) continue;
      tile.item = null;
      tile.box.setVisible(false);
      if (tile.box.input) tile.box.input.enabled = false;
    }
  }

  hide(silent = false): void {
    if (!this.root.visible) return;
    this.scene.tweens.killTweensOf(this.root);
    this.root.setVisible(false);
    this.dim.hide();
    if (!silent) sfx.play('close');
  }

  destroy(): void {
    this.scene.tweens.killTweensOf(this.root);
    for (const tile of this.tiles) this.scene.tweens.killTweensOf(tile.box);
    this.root.destroy(true);
  }

  private close(): void {
    if (!this.root.visible) return;
    this.hide();
    this.handlers.onClose();
  }

  private buildTile(): Tile {
    const bg = this.scene.add.graphics();
    drawPlate(bg, -TILE_W / 2, -TILE_H / 2, TILE_W, TILE_H, 18, COLOR.plateLight, COLOR.amber);
    const img = this.scene.add.image(0, -22, tex.item('keys')).setDisplaySize(84, 84);
    const label = makeText(this.scene, 0, 30, '', {
      align: 'center',
      fontStyle: 'bold',
      wordWrap: { width: TILE_W - 8 },
    }).setOrigin(0.5, 0);
    const box = this.scene.add.container(0, 0, [bg, img, label]);
    box.setSize(TILE_W, TILE_H);
    box.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(0, 0, TILE_W, TILE_H),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      useHandCursor: true,
    });
    box.setVisible(false);
    const tile: Tile = { box, img, label, item: null, pressed: false };
    box.on('pointerdown', () => {
      tile.pressed = true;
      box.setScale(0.95);
    });
    box.on('pointerout', () => {
      tile.pressed = false;
      box.setScale(1);
    });
    box.on('pointerup', () => {
      const item = tile.item;
      const wasPressed = tile.pressed;
      tile.pressed = false;
      box.setScale(1);
      if (!wasPressed || item === null) return;
      this.handlers.onTake(item, box.x, box.y);
    });
    this.root.add(box);
    return tile;
  }

  private buildNote(): NoteCard {
    const icon = this.scene.add.image(0, 0, tex.icon('note')).setDisplaySize(64, 64).setVisible(false);
    const title = makeText(this.scene, 0, 0, '', {
      fontSize: `${SIZE.label}px`,
      fontStyle: 'bold',
      color: CSS.ink,
    }).setVisible(false);
    const body = makeText(this.scene, 0, 0, '', {
      color: CSS.ink,
      wordWrap: { width: PW - 40 - 104 - 24 },
      maxLines: 3,
    }).setVisible(false);
    this.root.add([icon, title, body]);
    return { icon, title, body };
  }
}
