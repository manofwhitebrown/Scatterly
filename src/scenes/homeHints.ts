import Phaser from 'phaser';
import type { SpotId } from '../shared/types';
import { isCalm } from '../ui/theme';
import { COLOR } from '../ui/theme';
import { nextShimmer } from './homeShimmer';
import type { Pt } from './homeWorld';

/** What the hints need from the pieces view (kept narrow so it is testable without Phaser objects). */
export interface HintSource { pieces(): Array<{ id: SpotId; centre: Pt }>; unopened(): SpotId[]; pulse(id: SpotId): void }

export const IDLE_MS = 10000;
export const OUTLINE_MS = 2000;
const RING = 15; // art px

/**
 * "Show tappables" and the idle shimmer. The outline is identical for every piece (open, shut, locked or decoy), so it
 * never reveals lock state; the shimmer only pulses unopened pieces. Both are skipped under reduced motion / low FX.
 */
export class SpotHints {
  private readonly ring: Phaser.GameObjects.Graphics;
  private idleSince: number;
  private last: SpotId | null = null;
  private off: Phaser.Time.TimerEvent | null = null;
  private readonly tick: Phaser.Time.TimerEvent;

  constructor(private readonly scene: Phaser.Scene, world: Phaser.GameObjects.Container, private readonly src: HintSource) {
    this.ring = scene.add.graphics().setVisible(false);
    world.add(this.ring);
    this.idleSince = scene.time.now;
    this.tick = scene.time.addEvent({ delay: 2000, loop: true, callback: () => this.shimmer() });
  }

  /** Any player input restarts the idle clock. */
  touch(): void { this.idleSince = this.scene.time.now; }

  /** Rings every piece of the room for OUTLINE_MS. Shown even when calm (it is an accessibility aid), never animated. */
  outline(): void {
    this.touch();
    this.ring.clear().lineStyle(2, COLOR.cream, 1);
    for (const p of this.src.pieces()) this.ring.strokeCircle(p.centre.x, p.centre.y, RING);
    this.ring.setVisible(true);
    this.off?.remove(false);
    this.off = this.scene.time.delayedCall(OUTLINE_MS, () => this.ring.setVisible(false));
  }

  private shimmer(): void {
    if (isCalm(this.scene) || this.scene.time.now - this.idleSince < IDLE_MS) return;
    const id = nextShimmer(this.src.unopened(), this.last);
    if (id === null) return;
    this.last = id;
    this.src.pulse(id);
  }

  destroy(): void {
    this.tick.remove(false);
    this.off?.remove(false);
    this.ring.destroy();
  }
}
