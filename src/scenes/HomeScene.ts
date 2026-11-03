import Phaser from 'phaser';
import { flags } from '../core/flags';
import { GAME_H, GAME_W, SCENE } from '../shared/types';
import type { RoomId } from '../shared/types';
import { COLOR, DEPTH, ROOM_LABEL, SAFE, drawPlate, isCalm, makeText } from '../ui/theme';
import { HomeMenu } from './HomeMenu';
import { drawRoomShell } from './homeDraw';
import {
  HOUSE_WORLD, LINKS, roomAt, roomBounds, focusCamera, lerpCamera, overviewCamera, screenToArt,
} from './homeWorld';
import type { CameraState } from './homeWorld';

const TWEEN_MS = 300;
const BTN = 96;
const TAP_SLOP = 14;

interface HomeHooks { hotspots(): Array<{ room: RoomId; x: number; y: number }>; focus(room: RoomId): void; overview(): void; focused(): RoomId | null }

/**
 * `?view=home` (SCENE.Home): ONE connected house on the global iso grid. Overview shows the whole cutaway; tapping a
 * room zooms in (Focus); the back button or a tap outside returns. Placeholder shells until `shell/<room>` frames land.
 */
export class HomeScene extends Phaser.Scene {
  __e2e?: HomeHooks;
  private world!: Phaser.GameObjects.Container;
  private shells = new Map<RoomId, Phaser.GameObjects.Graphics>();
  private cam!: CameraState;
  private focusRoom: RoomId | null = null;
  private tween: Phaser.Tweens.Tween | null = null;
  private back: Phaser.GameObjects.Container | null = null;
  private doors: Phaser.GameObjects.Container[] = [];
  private menu: HomeMenu | null = null;

  constructor() {
    super(SCENE.Home);
  }

  init(): void {
    this.shells.clear();
    this.doors = [];
    this.focusRoom = null;
    this.tween = null;
    this.back = null;
    this.menu = null;
    this.__e2e = undefined;
  }

  create(): void {
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
    this.cameras.main.setBackgroundColor(COLOR.bg);
    this.world = this.add.container(0, 0);
    for (const s of HOUSE_WORLD) {
      const g = this.add.graphics();
      drawRoomShell(g, s.room);
      this.world.add(g);
      this.shells.set(s.room, g);
    }
    this.apply(overviewCamera(GAME_W, GAME_H));
    this.refreshDim();
    this.menu = new HomeMenu(this);
    this.input.on('pointerup', this.onTap, this);
    if (flags().e2e) this.__e2e = this.makeHooks();
  }

  private makeHooks(): HomeHooks {
    return {
      hotspots: () => HOUSE_WORLD.map((s) => {
        const r = roomBounds(s.room);
        return { room: s.room, x: (r.x + r.w / 2 - this.cam.cx) * this.cam.zoom + GAME_W / 2, y: (r.y + r.h / 2 - this.cam.cy) * this.cam.zoom + GAME_H / 2 };
      }),
      focus: (r) => this.focusOn(r),
      overview: () => this.focusOn(null),
      focused: () => this.focusRoom,
    };
  }

  private apply(c: CameraState): void {
    this.cam = c;
    this.world.setScale(c.zoom).setPosition(GAME_W / 2 - c.cx * c.zoom, GAME_H / 2 - c.cy * c.zoom);
  }

  private onTap(p: Phaser.Input.Pointer): void {
    if (Phaser.Math.Distance.Between(p.downX, p.downY, p.upX, p.upY) > TAP_SLOP) return;
    const room = roomAt(screenToArt({ x: p.upX, y: p.upY }, this.cam, GAME_W, GAME_H));
    if (!this.focusRoom) { if (room) this.focusOn(room); return; }
    if (!room) this.focusOn(null);
  }

  /** Zoom to a room (or back to the Overview when null) within TWEEN_MS; instant when calm/reduced motion. */
  focusOn(room: RoomId | null): void {
    if (room === this.focusRoom) return;
    this.focusRoom = room;
    const to = room ? focusCamera(room, GAME_W, GAME_H) : overviewCamera(GAME_W, GAME_H);
    this.tween?.stop();
    this.tween = null;
    this.refreshDim();
    this.buildChrome();
    this.menu?.setShown(!room);
    if (isCalm(this)) { this.apply(to); return; }
    const from = this.cam;
    const state = { t: 0 };
    this.tween = this.tweens.add({
      targets: state, t: 1, duration: TWEEN_MS, ease: 'Cubic.easeOut',
      onUpdate: () => this.apply(lerpCamera(from, to, state.t)),
      onComplete: () => { this.apply(to); this.tween = null; },
    });
  }

  private refreshDim(): void {
    for (const [room, g] of this.shells) g.setAlpha(!this.focusRoom || room === this.focusRoom ? 1 : 0.3);
  }

  private chip(x: number, y: number, label: string, cb: () => void): Phaser.GameObjects.Container {
    const c = this.add.container(x, y).setDepth(DEPTH.hud);
    const w = Math.max(BTN, label.length * 20 + 40);
    const plate = this.add.graphics();
    drawPlate(plate, -w / 2, -BTN / 2, w, BTN, 0, COLOR.plateLight, COLOR.plateEdge);
    const t = makeText(this, 0, 0, label).setOrigin(0.5);
    c.add([plate, t]).setSize(w, BTN).setInteractive({ useHandCursor: true });
    c.on('pointerup', cb);
    return c;
  }

  private buildChrome(): void {
    this.back?.destroy();
    for (const d of this.doors) d.destroy();
    this.doors = [];
    const room = this.focusRoom;
    this.back = room ? this.chip(SAFE + BTN / 2 + 24, SAFE + BTN / 2, '< House', () => this.focusOn(null)) : null;
    if (!room) return;
    const near = LINKS.flatMap(([a, b]) => (a === room ? [b] : b === room ? [a] : []));
    near.forEach((to, i) => {
      this.doors.push(this.chip(GAME_W - SAFE - 140, SAFE + BTN / 2 + i * (BTN + 12), ROOM_LABEL[to], () => this.focusOn(to)));
    });
  }

  private cleanup(): void {
    this.tween?.stop();
    this.input.off('pointerup', this.onTap, this);
    this.tween = null;
    this.menu?.destroy();
    this.menu = null;
    this.back = null;
    this.doors = [];
    this.shells.clear();
    this.__e2e = undefined;
  }
}
