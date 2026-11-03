import Phaser from 'phaser';
import { ISO_BADGE } from '../art/isoBadges';
import { isLowFx } from '../core/perf';
import { SCENE } from '../shared/types';
import type { RoomId } from '../shared/types';
import { Button } from '../ui/Button';
import { COLOR, CSS, DEPTH, ROOM_LABEL, SIZE, enterFade, getProfile, go, isCalm, makeText, fmtClock } from '../ui/theme';
import { buildHouseTiles } from './houseTiles';
import type { RoomProgress } from './houseProgress';
import { runScene } from './runScene';

export interface HouseSceneData {
  /** True when opened over a running morning (the Room scene keeps running underneath). */
  overlay?: boolean;
  current?: RoomId;
  unlocked?: readonly RoomId[];
  progress?: (room: RoomId) => RoomProgress;
  onPick?: (room: RoomId) => void;
  onClose?: () => void;
  /** Seconds left in a rush morning (null/absent: untimed). Shown top-right because the overlay covers the HUD. */
  timeLeft?: () => number | null;
}

const ZOOM_MS = 300;

/** Dollhouse: the whole home as room tiles on two floors; tap a room to zoom in and go there. */
export class HouseScene extends Phaser.Scene {
  private data0: HouseSceneData = {};
  private picked = false;
  private timer: Phaser.GameObjects.Text | null = null;

  constructor() {
    super(SCENE.House);
  }

  init(data: HouseSceneData): void {
    this.data0 = data ?? {};
    this.picked = false;
    this.timer = null;
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
    for (const t of buildHouseTiles(this, unlocked)) {
      if (d.current === t.room) this.add.graphics().lineStyle(6, COLOR.amber, 1).strokeRoundedRect(t.x - 112, t.y - 78, 224, 156, 14);
      this.label(t.room, t.x, t.y, t.open, d.progress?.(t.room));
      const hit = this.add.zone(t.x, t.y, 224, 176).setInteractive({ useHandCursor: true });
      hit.on('pointerup', (p: Phaser.Input.Pointer) => {
        if (t.open && p.getDistance() <= 16) this.choose(t.room, t.x, t.y);
      });
    }
    if (d.timeLeft) this.showTimer(d.timeLeft);
    new Button(this, 640, 668, 320, d.overlay ? 'Close' : 'Back', () => this.close(), { variant: 'primary' }).setDepth(DEPTH.hud);
    this.input.keyboard?.on('keydown-ESC', this.close, this);
  }

  private label(room: RoomId, x: number, y: number, open: boolean, pr: RoomProgress | undefined): void {
    makeText(this, x, y + 88, ROOM_LABEL[room], { fontSize: `${SIZE.label}px`, fontStyle: 'bold', color: open ? CSS.cream : CSS.muted }).setOrigin(0.5);
    if (!open) {
      this.add.image(x, y, ISO_BADGE.padlock).setDisplaySize(64, 64);
      return;
    }
    if (pr) {
      const line = `${pr.searched}/${pr.total} · ${pr.locks} lock${pr.locks === 1 ? '' : 's'} · ${pr.clues} clue${pr.clues === 1 ? '' : 's'}`;
      makeText(this, x, y + 120, line, { fontSize: '24px', color: CSS.muted }).setOrigin(0.5);
    }
  }

  /** 1 Hz clock for rush mornings; the overlay hides the HUD timer. */
  private showTimer(left: () => number | null): void {
    const draw = (): void => {
      const v = left();
      this.timer?.setText(v === null ? '' : `Time ${fmtClock(Math.ceil(v))}`);
    };
    this.timer = makeText(this, 1240, 40, '', { fontSize: `${SIZE.label}px`, fontStyle: 'bold', color: CSS.amber }).setOrigin(1, 0.5).setDepth(DEPTH.hud);
    draw();
    this.time.addEvent({ delay: 1000, loop: true, callback: draw });
  }

  private choose(room: RoomId, x: number, y: number): void {
    if (this.picked) return;
    this.picked = true;
    const go0 = (): void => {
      if (this.data0.onPick) this.data0.onPick(room);
      else go(this, runScene(), { mode: 'relaxed' });
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
