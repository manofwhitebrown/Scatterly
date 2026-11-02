import Phaser from 'phaser';
import { prefetchRoomShells } from '../art/isoShell';
import { HOUSE_MAP } from '../content/layout';
import { isLowFx } from '../core/perf';
import { SCENE, tex } from '../shared/types';
import type { RoomId } from '../shared/types';
import { Button } from '../ui/Button';
import { COLOR, CSS, DEPTH, ROOM_LABEL, SIZE, enterFade, getProfile, go, isCalm, makeText } from '../ui/theme';
import type { RoomProgress } from './houseProgress';

export interface HouseSceneData {
  /** True when opened over a running morning (the Room scene keeps running underneath). */
  overlay?: boolean;
  current?: RoomId;
  unlocked?: readonly RoomId[];
  progress?: (room: RoomId) => RoomProgress;
  onPick?: (room: RoomId) => void;
  onClose?: () => void;
}

const SCALE = 0.4;
const ZOOM_MS = 300;
const COL_X = 300;
const COL_STEP = 340;
const FLOOR_Y = [440, 215] as const;

/** Dollhouse: the whole home as room tiles on two floors; tap a room to zoom in and go there. */
export class HouseScene extends Phaser.Scene {
  private data0: HouseSceneData = {};
  private picked = false;
  private pending: Array<{ room: RoomId; img: Phaser.GameObjects.Image }> = [];

  constructor() {
    super(SCENE.House);
  }

  init(data: HouseSceneData): void {
    this.data0 = data ?? {};
    this.picked = false;
    this.pending = [];
  }

  create(): void {
    const d = this.data0;
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => d.onClose?.());
    if (d.overlay) {
      this.cameras.main.setBackgroundColor('rgba(28,19,13,0.9)');
      this.add.zone(0, 0, 1280, 720).setOrigin(0, 0).setInteractive().setDepth(-1); // blocks taps to the room below
    } else {
      enterFade(this);
      this.cameras.main.setBackgroundColor(COLOR.bg);
    }
    const unlocked = d.unlocked ?? getProfile(this).unlockedRooms;
    for (const slot of HOUSE_MAP) {
      const x = COL_X + slot.col * COL_STEP;
      const y = FLOOR_Y[slot.floor];
      const open = unlocked.includes(slot.room);
      const img = this.add.image(x, y, tex.isoShell(slot.room)).setScale(SCALE).setOrigin(0.5, 0.5);
      img.setVisible(false);
      this.pending.push({ room: slot.room, img });
      if (!open) img.setTint(0x555555);
      if (d.current === slot.room) this.add.graphics().lineStyle(6, COLOR.amber, 1).strokeRoundedRect(x - 112, y - 78, 224, 156, 14);
      this.label(slot.room, x, y, open, d.progress?.(slot.room));
      const hit = this.add.zone(x, y, 224, 176).setInteractive({ useHandCursor: true });
      hit.on('pointerup', (p: Phaser.Input.Pointer) => {
        if (open && p.getDistance() <= 16) this.choose(slot.room, x, y);
      });
    }
    this.bakeShells();
    new Button(this, 640, 668, 320, d.overlay ? 'Close' : 'Back', () => this.close(), { variant: 'primary' }).setDepth(DEPTH.hud);
    this.input.keyboard?.on('keydown-ESC', this.close, this);
  }

  private label(room: RoomId, x: number, y: number, open: boolean, pr: RoomProgress | undefined): void {
    makeText(this, x, y + 88, ROOM_LABEL[room], { fontSize: `${SIZE.label}px`, fontStyle: 'bold', color: open ? CSS.cream : CSS.muted }).setOrigin(0.5);
    if (!open) {
      const g = this.add.graphics().setPosition(x, y);
      g.fillStyle(COLOR.plateEdge, 0.9).fillCircle(0, 0, 30);
      g.fillStyle(COLOR.amber, 1).fillRect(-12, -6, 24, 18);
      g.lineStyle(4, COLOR.amber, 1).strokeCircle(0, -9, 8);
      return;
    }
    if (pr) {
      const line = `${pr.searched}/${pr.total} · ${pr.locks} lock${pr.locks === 1 ? '' : 's'} · ${pr.clues} clue${pr.clues === 1 ? '' : 's'}`;
      makeText(this, x, y + 120, line, { fontSize: '24px', color: CSS.muted }).setOrigin(0.5);
    }
  }

  /** Shells bake one per frame through AI-4's queue; each image appears as its texture does. */
  private bakeShells(): void {
    this.reveal();
    if (this.pending.every((p) => p.img.visible)) return;
    prefetchRoomShells(this, this.pending.map((p) => p.room));
    this.time.addEvent({ delay: 60, loop: true, callback: this.reveal, callbackScope: this });
  }

  private reveal(): void {
    for (const p of this.pending) if (!p.img.visible && this.textures.exists(tex.isoShell(p.room))) p.img.setVisible(true);
  }

  private choose(room: RoomId, x: number, y: number): void {
    if (this.picked) return;
    this.picked = true;
    const go0 = (): void => {
      if (this.data0.onPick) this.data0.onPick(room);
      else go(this, SCENE.Room, { mode: 'relaxed' });
      if (this.data0.overlay) this.scene.stop();
    };
    if (isLowFx(this.game) || isCalm(this)) {
      go0();
      return;
    }
    const cam = this.cameras.main;
    cam.pan(x, y, ZOOM_MS, 'Sine.easeIn');
    cam.zoomTo(2.4, ZOOM_MS, 'Sine.easeIn');
    this.time.delayedCall(ZOOM_MS, go0);
  }

  private close(): void {
    if (this.data0.overlay) this.scene.stop();
    else go(this, SCENE.Menu);
  }
}
