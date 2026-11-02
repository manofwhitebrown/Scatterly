import Phaser from 'phaser';
import { sfx } from '../audio/sfx';
import { COLOR, CSS, SIZE, buzz, drawPlate, isCalm, makeText } from './theme';

export type ButtonVariant = 'primary' | 'plain' | 'danger';
export interface ButtonOptions {
  variant?: ButtonVariant;
  fontSize?: number;
  height?: number;
}

/** Rounded plate button. (x, y) is its centre. Fires only when the pointer is released inside it. */
export class Button extends Phaser.GameObjects.Container {
  private readonly plate: Phaser.GameObjects.Graphics;
  private readonly label: Phaser.GameObjects.Text;
  private readonly bw: number;
  private readonly bh: number;
  private variant: ButtonVariant;
  private callback: () => void;
  private pressed = false;
  private enabled = true;
  private lastFire = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    text: string,
    callback: () => void,
    options: ButtonOptions = {},
  ) {
    super(scene, x, y);
    this.bw = Math.max(56, width);
    this.bh = Math.max(56, options.height ?? 64);
    this.variant = options.variant ?? 'plain';
    this.callback = callback;
    this.plate = scene.add.graphics();
    this.label = makeText(scene, 0, 0, text, {
      fontSize: `${options.fontSize ?? SIZE.button}px`,
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: this.bw - 16 },
    }).setOrigin(0.5);
    this.add([this.plate, this.label]);
    this.redraw();
    this.setSize(this.bw, this.bh);
    this.setInteractive({
      // Hit area is at least 96x96 game px (48 dp), centred on the plate.
      hitArea: new Phaser.Geom.Rectangle(
        -(Math.max(96, this.bw) - this.bw) / 2,
        -(Math.max(96, this.bh) - this.bh) / 2,
        Math.max(96, this.bw),
        Math.max(96, this.bh),
      ),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      useHandCursor: true,
    });
    this.on('pointerdown', this.onDown, this);
    this.on('pointerup', this.onUp, this);
    this.on('pointerout', this.onOut, this);
    scene.add.existing(this);
  }

  setLabel(text: string): this {
    if (this.label.text !== text) this.label.setText(text);
    return this;
  }

  setCallback(callback: () => void): this {
    this.callback = callback;
    return this;
  }

  setVariant(variant: ButtonVariant): this {
    if (variant !== this.variant) {
      this.variant = variant;
      this.redraw();
    }
    return this;
  }

  setEnabled(enabled: boolean): this {
    this.enabled = enabled;
    this.setAlpha(enabled ? 1 : 0.5);
    return this;
  }

  /** Show/hide and also switch the hit area on/off. */
  setShown(shown: boolean): this {
    this.setVisible(shown);
    if (this.input) this.input.enabled = shown;
    return this;
  }

  override destroy(fromScene?: boolean): void {
    this.scene?.tweens.killTweensOf(this);
    super.destroy(fromScene);
  }

  private redraw(): void {
    const g = this.plate;
    const w = this.bw;
    const h = this.bh;
    g.clear();
    const fill = this.variant === 'primary' ? COLOR.amber : this.variant === 'danger' ? COLOR.red : COLOR.plateLight;
    const edge =
      this.variant === 'primary' ? COLOR.amberDark : this.variant === 'danger' ? COLOR.redDark : COLOR.plateEdge;
    g.fillStyle(0x000000, 0.28);
    g.fillRoundedRect(-w / 2 + 2, -h / 2 + 4, w, h, 16);
    drawPlate(g, -w / 2, -h / 2, w, h, 16, fill, edge);
    this.label.setColor(this.variant === 'primary' ? CSS.ink : CSS.cream);
  }

  private scaleTo(s: number, ms: number): void {
    this.scene.tweens.killTweensOf(this);
    if (isCalm(this.scene)) {
      this.setScale(s);
      return;
    }
    this.scene.tweens.add({ targets: this, scaleX: s, scaleY: s, duration: ms, ease: 'Quad.easeOut' });
  }

  private onDown(): void {
    this.pressed = true;
    if (this.enabled) this.scaleTo(0.95, 80);
  }

  private onOut(): void {
    if (!this.pressed) return;
    this.pressed = false;
    this.scaleTo(1, 100);
  }

  private onUp(): void {
    if (!this.pressed) return;
    this.pressed = false;
    this.scaleTo(1, 100);
    if (!this.enabled) {
      sfx.play('error');
      return;
    }
    const now = this.scene.time.now;
    if (now - this.lastFire < 220) return;
    this.lastFire = now;
    sfx.play('tap');
    buzz(this.scene);
    this.callback();
  }
}
