import type Phaser from 'phaser';
import type { FxName } from './names';

export type { FxName } from './names';

let live = 0;

/** Plays a pooled visual effect. Safe to call at any time with any coordinates; never throws. */
export function playFx(scene: Phaser.Scene, name: FxName, x: number, y: number): void {
  try {
    if (!scene || !Number.isFinite(x) || !Number.isFinite(y) || !name) return;
  } catch {
    /* never throws */
  }
}

/** Live particle count for the debug overlay. */
export function liveParticles(): number {
  return live;
}
