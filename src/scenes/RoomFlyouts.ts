import Phaser from 'phaser';
import { tex } from '../shared/types';
import type { ItemId } from '../shared/types';
import { DEPTH } from '../ui/theme';
import { flyItem } from './RoomFx';

type Pt = { x: number; y: number };
const PAPER = 'ui_clue_paper';

/** Pooled objects that leave a piece of furniture: items hop to the tray, clues flutter to the notebook. */
export class RoomFlyouts {
  private readonly items: Phaser.GameObjects.Image[] = [];
  private idx = 0;
  private readonly paper: Phaser.GameObjects.Image;
  private readonly state = { t: 0 };

  constructor(private readonly scene: Phaser.Scene) {
    for (let i = 0; i < 3; i++) this.items.push(scene.add.image(0, 0, tex.item('keys')).setDepth(DEPTH.fly).setVisible(false));
    if (!scene.textures.exists(PAPER)) {
      const g = scene.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(0xfbf1d8, 1).fillRoundedRect(0, 0, 40, 52, 5);
      g.fillStyle(0xd8c291, 1).fillRect(7, 12, 26, 4).fillRect(7, 22, 26, 4).fillRect(7, 32, 18, 4);
      g.generateTexture(PAPER, 40, 52);
      g.destroy();
    }
    this.paper = scene.add.image(0, 0, PAPER).setDepth(DEPTH.fly).setVisible(false);
  }

  /** Item hop: curved flight from `from` to the tray slot, or straight to done when there is no slot or motion is calm. */
  item(item: ItemId, from: Pt, to: Pt | null, calm: boolean, land: () => void): void {
    const img = this.items[this.idx++ % this.items.length];
    if (!to || !img || calm) land();
    else flyItem(this.scene, img, item, from, to, land);
  }

  /** Clue flutter: a paper sways from the furniture to the Clues button (<= 420 ms). */
  clue(from: Pt, to: Pt, done: () => void): void {
    const p = this.paper;
    const s = this.scene;
    p.setPosition(from.x, from.y).setScale(0.9).setAlpha(1).setAngle(0).setVisible(true);
    s.tweens.killTweensOf(this.state);
    this.state.t = 0;
    s.tweens.add({
      targets: this.state,
      t: 1,
      duration: 420,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        const t = this.state.t;
        p.x = from.x + (to.x - from.x) * t + Math.sin(t * Math.PI * 3) * 16;
        p.y = from.y + (to.y - from.y) * t - Math.sin(t * Math.PI) * 70;
        p.setAngle(Math.sin(t * Math.PI * 3) * 18).setScale(0.9 - 0.45 * t);
      },
      onComplete: () => {
        p.setVisible(false);
        done();
      },
    });
  }
}
