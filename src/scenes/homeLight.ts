import Phaser from 'phaser';
import { LIGHT_KEYS } from '../art/light';
import type { LightTime } from '../art/light';

/**
 * Time-of-day light for the Home world: ONE multiply rectangle over everything in the world (rooms, yard, pieces). The game
 * plays in the morning; other times exist so the art (dusk/night shells, window glow) can be checked and used later.
 * Noon is white, i.e. no visible tint.
 */
export class HomeLight {
  private readonly rect: Phaser.GameObjects.Rectangle;
  time: LightTime;

  constructor(scene: Phaser.Scene, world: Phaser.GameObjects.Container, time: LightTime = 'morning') {
    this.time = time;
    this.rect = scene.add.rectangle(0, 0, 10000, 8000, LIGHT_KEYS[time], 1).setBlendMode(Phaser.BlendModes.MULTIPLY);
    world.add(this.rect);
  }

  /** Keeps the rectangle on top of the world's later children (pieces, actors) after they are added. */
  raise(world: Phaser.GameObjects.Container): void { world.bringToTop(this.rect); }

  set(time: LightTime): void {
    this.time = time;
    this.rect.setFillStyle(LIGHT_KEYS[time], 1);
  }
}
