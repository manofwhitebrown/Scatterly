import Phaser from 'phaser';
import type { Spot } from '../shared/types';

const LONG_MS = 400;
const SLOP = 16;

export interface PressHandlers {
  active: () => boolean;
  pick: (x: number, y: number) => Spot | null;
  onTap: (spot: Spot) => void;
  onLong: (spot: Spot) => void;
}

/** One room-wide input zone: tap picks the nearest spot, a 400 ms hold fires onLong and suppresses the tap. */
export class PressZone {
  readonly zone: Phaser.GameObjects.Zone;
  private timer: Phaser.Time.TimerEvent | null = null;
  private longFired = false;

  constructor(private readonly scene: Phaser.Scene, private readonly h: PressHandlers) {
    this.zone = scene.add.zone(0, 0, 1280, 720).setOrigin(0, 0).setInteractive({ useHandCursor: true });
    this.zone.on('pointerdown', this.down, this);
    this.zone.on('pointerup', this.up, this);
  }

  destroy(): void {
    this.timer?.remove(false);
    this.timer = null;
    this.zone.off('pointerdown', this.down, this);
    this.zone.off('pointerup', this.up, this);
    this.zone.destroy();
  }

  private down(pointer: Phaser.Input.Pointer): void {
    this.longFired = false;
    this.timer?.remove(false);
    this.timer = this.scene.time.delayedCall(LONG_MS, () => {
      if (!this.h.active() || pointer.getDistance() > SLOP) return;
      const hit = this.h.pick(pointer.x, pointer.y);
      if (!hit) return;
      this.longFired = true;
      this.h.onLong(hit);
    });
  }

  private up(pointer: Phaser.Input.Pointer): void {
    this.timer?.remove(false);
    this.timer = null;
    if (this.longFired) {
      this.longFired = false;
      return;
    }
    if (!this.h.active() || pointer.getDistance() > SLOP) return;
    const hit = this.h.pick(pointer.x, pointer.y);
    if (hit) this.h.onTap(hit);
  }
}
