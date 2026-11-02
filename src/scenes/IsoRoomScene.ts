import Phaser from 'phaser';
import { flags } from '../core/flags';
import { SCENE } from '../shared/types';
import type { RoomSceneData } from '../shared/types';
import { enterFade } from '../ui/theme';
import { IsoRoomView } from './IsoRoomView';
import { RoomMarks } from './RoomMarks';
import { RoomNav } from './RoomNav';
import { RoomRun } from './RoomRun';

interface E2eHooks { hotspots(): Array<{ spotId: string; x: number; y: number }> }

/** Isometric room, selected by `?view=iso`. Shares every rule with the flat room through RoomRun. */
export class IsoRoomScene extends Phaser.Scene {
  /** Present only under `?e2e=1`; tests only, never branch gameplay on it. */
  __e2e?: E2eHooks;
  private data0: RoomSceneData = { mode: 'relaxed' };
  private run: RoomRun | null = null;
  private view: IsoRoomView | null = null;
  private nav: RoomNav | null = null;
  private marks: RoomMarks | null = null;

  constructor() {
    super(SCENE.Room);
  }

  init(data: RoomSceneData): void {
    this.data0 = data;
    this.run = null;
    this.view = null;
    this.nav = null;
    this.marks = null;
    this.__e2e = undefined;
  }

  create(): void {
    enterFade(this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
    const run = new RoomRun(this, this.data0);
    if (!run.prepare()) return;
    this.run = run;
    const view = new IsoRoomView(
      this,
      run.session,
      (id) => run.scenario.gates[id] !== undefined && !run.session.isOpened(id),
      (spot) => run.onSpot(spot),
      (spot) => run.onLong(spot),
    );
    this.view = view;
    view.show(run.start, 0);
    this.marks = new RoomMarks(this, view, run.session);
    run.mount(
      {
        playAction: (spot) => view.playAction(spot),
        refresh: (id) => view.refresh(id),
        pulse: (id) => view.queuePulse(id),
        center: (id) => {
          const sp = view.spotOf(id);
          return sp ? { x: sp.x + sp.w / 2, y: sp.y + sp.h / 2 } : null;
        },
      },
      { goRoom: (room) => this.nav?.goTo(room) },
    );
    this.nav = new RoomNav(this, view, run.hud, run.rooms, () => run.modalOpen(), (r) => run.feel.roomSwitch(r));
    if (flags().e2e) this.__e2e = { hotspots: () => view.hotspots() };
    run.begin();
  }

  private cleanup(): void {
    this.nav?.destroy();
    this.marks?.destroy();
    this.run?.destroy();
    this.view?.destroy();
    this.nav = null;
    this.marks = null;
    this.view = null;
    this.run = null;
    this.__e2e = undefined;
  }
}
