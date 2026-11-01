import Phaser from 'phaser';
import { sfx } from '../audio/sfx';
import { Hud } from '../ui/Hud';

/** Morning clock. Ticks every 250 ms and counts time only while `frozen()` is false. */
export class RoomClock {
  elapsed = 0;
  started = false;
  private last = 0;

  constructor(
    scene: Phaser.Scene,
    private readonly limitSec: number | null,
    private readonly hud: Hud,
    private readonly frozen: () => boolean,
    private readonly onTimeUp: () => void,
    private readonly onSecond: (sec: number) => void = () => undefined,
  ) {
    scene.time.addEvent({ delay: 250, loop: true, callback: this.tick, callbackScope: this });
  }

  begin(): void {
    this.started = true;
    this.resync();
    if (this.limitSec !== null) this.hud.setTimer(this.limitSec);
  }

  /** Call after any pause so the paused wall-clock time is not counted. */
  resync(): void {
    this.last = performance.now();
  }

  private tick(): void {
    const now = performance.now();
    const dt = Math.min(now - this.last, 1000);
    this.last = now;
    if (!this.started || this.frozen()) return;
    this.elapsed += dt;
    if (this.limitSec === null) return;
    const remain = Math.max(0, this.limitSec * 1000 - this.elapsed);
    const sec = Math.ceil(remain / 1000);
    if (this.hud.setTimer(sec)) {
      if (sec <= 10 && sec > 0) sfx.play('tick');
      this.onSecond(sec);
    }
    if (remain <= 0) this.onTimeUp();
  }
}
