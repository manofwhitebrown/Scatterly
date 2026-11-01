import type Phaser from 'phaser';
import { sfx } from '../audio/sfx';
import { playFx } from '../fx';
import type { RoomId, Spot } from '../shared/types';
import { DEPTH, isCalm, vibrate } from '../ui/theme';

const WARM = 0xff9a3c;
const RED = 0xe53935;
const GREY = 0x808080;

/** Triggers the Feel Spec (sfx + playFx + haptic) for Room events. AI-4 renders the fx; this only calls them. */
export class RoomFeel {
  private step = 0;
  private readonly tint: Phaser.GameObjects.Rectangle;
  private sweepBar: Phaser.GameObjects.Rectangle | null = null;

  constructor(private readonly scene: Phaser.Scene) {
    this.tint = scene.add.rectangle(640, 360, 1280, 720, WARM, 0).setDepth(DEPTH.hud - 1);
  }

  /** Closed-spot tap: press response in the same frame. */
  tap(spot: Spot): void {
    sfx.play('tap', { step: spot.kind.charCodeAt(0) % 4 });
    playFx(this.scene, 'tap', spot.x + spot.w / 2, spot.y + spot.h / 2);
    vibrate(this.scene, 10);
  }

  opened(spot: Spot, hasItems: boolean): void {
    const x = spot.x + spot.w / 2;
    const y = spot.y + spot.h / 2;
    sfx.play('swoosh');
    playFx(this.scene, 'open', x, y);
    if (!hasItems) return;
    sfx.play('found');
    playFx(this.scene, 'found', x, y);
    vibrate(this.scene, 20);
  }

  empty(spot: Spot): void {
    sfx.play('close');
    playFx(this.scene, 'empty', spot.x + spot.w / 2, spot.y + spot.h / 2);
  }

  /** A needed item was taken: pitch rises with each find. */
  taken(): void {
    sfx.play('pop', { step: this.step++ });
    vibrate(this.scene, 15);
  }

  landed(x: number, y: number): void {
    playFx(this.scene, 'take', x, y);
  }

  clue(x: number, y: number): void {
    sfx.play('clue');
    playFx(this.scene, 'clue', x, y);
  }

  hint(x: number, y: number): void {
    sfx.play('coin');
    playFx(this.scene, 'hint', x, y);
  }

  roomSwitch(room: RoomId): void {
    sfx.play('swoosh');
    sfx.setRoomAmbience(room);
    playFx(this.scene, 'room', 640, 360);
    if (isCalm(this.scene)) return;
    const bar = (this.sweepBar ??= this.scene.add.rectangle(-120, 360, 140, 760, 0xffffff, 0.16).setDepth(DEPTH.hud - 2));
    this.scene.tweens.killTweensOf(bar);
    bar.setX(-120);
    this.scene.tweens.add({ targets: bar, x: 1400, duration: 200 });
  }

  /** Rush last 10 s, called once per displayed second. */
  urgency(sec: number): void {
    if (sec > 10 || sec <= 0) return;
    const k = 10 - sec;
    sfx.setIntensity(Math.min(1, 0.6 + k * 0.04));
    this.tint.setFillStyle(sec > 5 ? WARM : RED, 0.06 + k * 0.02);
    playFx(this.scene, 'urgent', 640, 360);
  }

  win(): void {
    sfx.play('win');
    playFx(this.scene, 'win', 640, 360);
    vibrate(this.scene, 40);
  }

  lose(): void {
    sfx.play('lose');
    playFx(this.scene, 'lose', 640, 360);
    this.tint.setFillStyle(GREY, 1).setAlpha(0);
    if (isCalm(this.scene)) {
      this.tint.setAlpha(0.45);
      return;
    }
    this.scene.tweens.add({ targets: this.tint, alpha: 0.45, duration: 300 });
  }

  destroy(): void {
    sfx.setIntensity(0);
    sfx.setRoomAmbience(null);
    this.scene.tweens.killTweensOf(this.tint);
    if (this.sweepBar) {
      this.scene.tweens.killTweensOf(this.sweepBar);
      this.sweepBar.destroy();
    }
    this.tint.destroy();
  }
}
