import Phaser from 'phaser';
import { GAME_W } from '../shared/types';
import { COLOR, CSS, DEPTH, drawPlate, makeText } from './theme';

export type ToastKind = 'info' | 'clue' | 'warn';

/** One reusable toast bubble: built once, text swapped per message. */
export class Toast {
  private readonly box: Phaser.GameObjects.Container;
  private readonly plate: Phaser.GameObjects.Graphics;
  private readonly label: Phaser.GameObjects.Text;
  private hideEvent: Phaser.Time.TimerEvent | null = null;
  private drawnKey = '';

  constructor(private readonly scene: Phaser.Scene, y = 112) {
    this.plate = scene.add.graphics();
    this.label = makeText(scene, 0, 0, '', {
      fontSize: '26px',
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: 860 },
    }).setOrigin(0.5);
    this.box = scene.add.container(GAME_W / 2, y, [this.plate, this.label]);
    this.box.setDepth(DEPTH.toast).setAlpha(0).setVisible(false);
  }

  show(message: string, kind: ToastKind = 'info', ms = 2000): void {
    if (this.label.text !== message) this.label.setText(message);
    this.label.setColor(kind === 'clue' ? CSS.ink : CSS.cream);
    const w = Math.ceil(this.label.width) + 56;
    const h = Math.ceil(this.label.height) + 24;
    const key = `${kind}|${w}|${h}`;
    if (key !== this.drawnKey) {
      this.drawnKey = key;
      const fill = kind === 'clue' ? COLOR.amber : kind === 'warn' ? COLOR.redDark : COLOR.plate;
      const edge = kind === 'clue' ? COLOR.amberDark : kind === 'warn' ? COLOR.red : COLOR.amber;
      this.plate.clear();
      drawPlate(this.plate, -w / 2, -h / 2, w, h, 18, fill, edge);
    }
    this.scene.tweens.killTweensOf(this.box);
    this.box.setVisible(true);
    this.scene.tweens.add({ targets: this.box, alpha: 1, duration: 120 });
    this.hideEvent?.remove(false);
    this.hideEvent = this.scene.time.delayedCall(ms, () => this.hide());
  }

  hide(): void {
    this.hideEvent?.remove(false);
    this.hideEvent = null;
    this.scene.tweens.killTweensOf(this.box);
    this.scene.tweens.add({
      targets: this.box,
      alpha: 0,
      duration: 160,
      onComplete: () => this.box.setVisible(false),
    });
  }

  destroy(): void {
    this.hideEvent?.remove(false);
    this.scene.tweens.killTweensOf(this.box);
    this.box.destroy(true);
  }
}
