import Phaser from 'phaser';
import type { RoomId } from '../shared/types';
import { Button } from '../ui/Button';
import { Hud } from '../ui/Hud';
import { DEPTH } from '../ui/theme';
import { RoomView } from './RoomView';

/** Edge arrows, room tabs and arrow keys: all room switching goes through here. */
export class RoomNav {
  private readonly left: Button;
  private readonly right: Button;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly view: RoomView,
    private readonly hud: Hud,
    private readonly rooms: RoomId[],
    private readonly blocked: () => boolean,
    private readonly onSwitch: (room: RoomId) => void = () => undefined,
  ) {
    this.left = new Button(scene, 24, 400, 48, '‹', () => this.step(-1), { fontSize: 44, height: 120 });
    this.right = new Button(scene, 1256, 400, 48, '›', () => this.step(1), { fontSize: 44, height: 120 });
    this.left.setDepth(DEPTH.hud);
    this.right.setDepth(DEPTH.hud);
    this.update();
    scene.input.keyboard?.on('keydown-LEFT', this.onLeft, this);
    scene.input.keyboard?.on('keydown-RIGHT', this.onRight, this);
  }

  step(delta: number): void {
    const cur = this.view.room;
    if (cur === null) return;
    const next = this.rooms[this.rooms.indexOf(cur) + delta];
    if (next) this.goTo(next);
  }

  goTo(room: RoomId): void {
    const cur = this.view.room;
    if (this.blocked() || this.view.switching || cur === null || cur === room) return;
    const dir = this.rooms.indexOf(room) > this.rooms.indexOf(cur) ? 1 : -1;
    this.onSwitch(room);
    this.view.show(room, dir);
    this.hud.setActive(room);
    this.update();
  }

  destroy(): void {
    this.scene.input.keyboard?.off('keydown-LEFT', this.onLeft, this);
    this.scene.input.keyboard?.off('keydown-RIGHT', this.onRight, this);
  }

  private update(): void {
    const i = this.view.room !== null ? this.rooms.indexOf(this.view.room) : 0;
    this.left.setShown(i > 0);
    this.right.setShown(i < this.rooms.length - 1);
  }

  private readonly onLeft = (): void => this.step(-1);
  private readonly onRight = (): void => this.step(1);
}
