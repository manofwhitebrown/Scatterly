import Phaser from 'phaser';

export interface ScrollConfig {
  viewHeight: number;
  /** Called for a tap (not a drag). `contentY` is the pointer y in scrolled content space. */
  onTap?: (x: number, contentY: number) => void;
}

/**
 * Drag/wheel scrolling by moving a layer container. No masks: callers cover the overflow with
 * opaque header/footer plates drawn above the layer.
 */
export class ScrollArea {
  private scroll = 0;
  private max = 0;
  private dragging = false;
  private moved = false;
  private startY = 0;
  private startScroll = 0;
  private attached = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly layer: Phaser.GameObjects.Container,
    private readonly zone: Phaser.GameObjects.Zone,
    private readonly cfg: ScrollConfig,
  ) {}

  setContentHeight(height: number): void {
    this.max = Math.max(0, height - this.cfg.viewHeight);
    this.scrollTo(0);
  }

  attach(): void {
    if (this.attached) return;
    this.attached = true;
    if (this.zone.input) this.zone.input.enabled = true;
    else this.zone.setInteractive();
    this.zone.on('pointerdown', this.onDown);
    this.scene.input.on('pointermove', this.onMove);
    this.scene.input.on('pointerup', this.onUp);
    this.scene.input.on('wheel', this.onWheel);
  }

  detach(): void {
    if (!this.attached) return;
    this.attached = false;
    this.dragging = false;
    this.zone.off('pointerdown', this.onDown);
    if (this.zone.input) this.zone.input.enabled = false;
    this.scene.input.off('pointermove', this.onMove);
    this.scene.input.off('pointerup', this.onUp);
    this.scene.input.off('wheel', this.onWheel);
  }

  private scrollTo(value: number): void {
    this.scroll = Phaser.Math.Clamp(value, 0, this.max);
    this.layer.y = -this.scroll;
  }

  private readonly onDown = (pointer: Phaser.Input.Pointer): void => {
    this.dragging = true;
    this.moved = false;
    this.startY = pointer.y;
    this.startScroll = this.scroll;
  };

  private readonly onMove = (pointer: Phaser.Input.Pointer): void => {
    if (!this.dragging) return;
    const dy = this.startY - pointer.y;
    if (Math.abs(dy) > 10) this.moved = true;
    if (this.moved) this.scrollTo(this.startScroll + dy);
  };

  private readonly onUp = (pointer: Phaser.Input.Pointer): void => {
    if (!this.dragging) return;
    this.dragging = false;
    if (!this.moved && this.cfg.onTap) this.cfg.onTap(pointer.x, pointer.y + this.scroll);
  };

  private readonly onWheel = (
    _pointer: Phaser.Input.Pointer,
    _over: Phaser.GameObjects.GameObject[],
    _dx: number,
    dy: number,
  ): void => {
    this.scrollTo(this.scroll + dy);
  };
}
