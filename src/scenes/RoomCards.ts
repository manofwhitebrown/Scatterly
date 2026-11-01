import Phaser from 'phaser';
import { ITEM_LABEL, tex } from '../shared/types';
import type { ItemId } from '../shared/types';
import { Button } from '../ui/Button';
import { COLOR, CSS, DEPTH, Dim, SIZE, drawPlate, makeText } from '../ui/theme';

export interface CardButton {
  label: string;
  onTap: () => void;
  primary?: boolean;
}

export interface CardConfig {
  title: string;
  body: string;
  items?: ItemId[];
  buttons: CardButton[];
}

const PX = 190;
const PY = 100;
const PW = 900;
const PH = 520;
const MAX_ITEMS = 5;
const MAX_BUTTONS = 3;

/** One reusable modal card: intro, coach steps, pause, quit-confirm and time-up all share it. */
export class ModalCard {
  private readonly root: Phaser.GameObjects.Container;
  private readonly title: Phaser.GameObjects.Text;
  private readonly body: Phaser.GameObjects.Text;
  private readonly icons: Phaser.GameObjects.Image[] = [];
  private readonly labels: Phaser.GameObjects.Text[] = [];
  private readonly buttons: Button[] = [];

  constructor(scene: Phaser.Scene, private readonly dim: Dim) {
    this.root = scene.add.container(0, 0).setDepth(DEPTH.card).setVisible(false);
    const plate = scene.add.graphics();
    plate.fillStyle(0x000000, 0.3);
    plate.fillRoundedRect(PX + 4, PY + 8, PW, PH, 28);
    drawPlate(plate, PX, PY, PW, PH, 28, COLOR.plate, COLOR.amber);
    this.root.add(plate);

    this.title = makeText(scene, PX + PW / 2, PY + 52, '', {
      fontSize: `${SIZE.heading}px`,
      fontStyle: 'bold',
      color: CSS.amber,
      align: 'center',
      wordWrap: { width: PW - 60 },
    }).setOrigin(0.5);
    this.body = makeText(scene, PX + PW / 2, PY + 104, '', {
      fontSize: `${SIZE.label}px`,
      align: 'center',
      wordWrap: { width: PW - 80 },
      maxLines: 7,
    }).setOrigin(0.5, 0);
    this.root.add([this.title, this.body]);

    for (let i = 0; i < MAX_ITEMS; i++) {
      const icon = scene.add.image(0, 0, tex.item('keys')).setDisplaySize(64, 64).setVisible(false);
      const label = makeText(scene, 0, 0, '', { align: 'center', wordWrap: { width: 150 }, color: CSS.muted })
        .setOrigin(0.5, 0)
        .setVisible(false);
      this.icons.push(icon);
      this.labels.push(label);
      this.root.add([icon, label]);
    }
    for (let i = 0; i < MAX_BUTTONS; i++) {
      const button = new Button(scene, 0, PY + PH - 52, 260, '', () => undefined, { height: 64 });
      button.setShown(false);
      this.buttons.push(button);
      this.root.add(button);
    }
  }

  get isOpen(): boolean {
    return this.root.visible;
  }

  show(cfg: CardConfig): void {
    this.title.setText(cfg.title);
    this.body.setText(cfg.body);
    const items = (cfg.items ?? []).slice(0, MAX_ITEMS);
    const top = PY + 104 + this.body.height + 18;
    this.icons.forEach((icon, i) => {
      const item = items[i];
      const label = this.labels[i];
      icon.setVisible(item !== undefined);
      label?.setVisible(item !== undefined);
      if (item === undefined || !label) return;
      const x = PX + PW / 2 + (i - (items.length - 1) / 2) * 160;
      icon.setTexture(tex.item(item)).setPosition(x, top + 34);
      label.setText(ITEM_LABEL[item]).setPosition(x, top + 72);
    });
    const n = Math.min(cfg.buttons.length, MAX_BUTTONS);
    this.buttons.forEach((button, i) => {
      const def = cfg.buttons[i];
      button.setShown(i < n && def !== undefined);
      if (!def || i >= n) return;
      button.setLabel(def.label);
      button.setVariant(def.primary === true ? 'primary' : 'plain');
      button.setCallback(def.onTap);
      button.x = PX + PW / 2 + (i - (n - 1) / 2) * 280;
    });
    this.root.setVisible(true);
    this.dim.show(DEPTH.cardDim);
  }

  hide(): void {
    this.root.setVisible(false);
    this.dim.hide();
  }

  destroy(): void {
    this.root.destroy(true);
  }
}
