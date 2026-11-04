import Phaser from 'phaser';
import { frame } from '../art/manifest';
import { WORLD_DECOR } from '../content/worldProps';
import type { WorldRoom } from '../content/world';
import { FLOOR1_RAISE, HOUSE_WORLD, project } from './homeWorld';
import { UNIT } from './homeProps';

/** Frame key for a window glow: 0 = day right wall, 1 = day left wall; 2 and 3 are the night versions. */
export const glowKey = (wall: 'L' | 'R', night: boolean): string => `fx/windowGlow/${(night ? 2 : 0) + (wall === 'R' ? 0 : 1)}`;

/** Warm light on every window of a room (morning by default). Skipped when the glow frames are not loaded. Returns the count added. */
export function addWindowGlow(scene: Phaser.Scene, c: Phaser.GameObjects.Container, room: WorldRoom, night = false): number {
  const slot = HOUSE_WORLD.find((s) => s.room === room);
  if (!slot) return 0;
  let n = 0;
  for (const w of WORLD_DECOR[room].windows) {
    const art = frame(glowKey(w.wall, night));
    if (!art) continue;
    const mid = w.t + w.w / 2;
    const at = project(slot.wx + (w.wall === 'R' ? mid : 0), slot.wy + (w.wall === 'R' ? 0 : mid), slot.floor * FLOOR1_RAISE + 3 * UNIT);
    c.add(scene.add.image(at.x, at.y, art.atlas, art.frame).setOrigin(art.pivotX / art.w, art.pivotY / art.h).setScale(Math.max(0.5, w.w / 2)).setAlpha(0.85).setBlendMode(Phaser.BlendModes.ADD));
    n++;
  }
  return n;
}
