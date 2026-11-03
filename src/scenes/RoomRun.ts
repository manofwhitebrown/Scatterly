import Phaser from 'phaser';
import { sfx } from '../audio/sfx';
import { isLowFx } from '../core/perf';
import { GameSession, allSpots, generateScenario } from '../logic';
import { ITEM_LABEL, LEGACY_ROOMS, SCENE } from '../shared/types';
import type { GameMode, Gate, InspectOutcome, ItemId, PlayerProfile, RoomId, RoomSceneData, Scenario, Spot, SpotId } from '../shared/types';
import { Button } from '../ui/Button';
import { ClueBoard } from '../ui/ClueBoard';
import { Hud } from '../ui/Hud';
import { orderNotes } from '../ui/clueFacts';
import { InspectPanel } from '../ui/InspectPanel';
import { Toast } from '../ui/Toast';
import { Dim, SIZE, getProfile, go, isCalm, makeText, vibrate } from '../ui/theme';
import { timeUpCard } from './RoomCardConfigs';
import { CaseUi } from './CaseUi';
import { ModalCard } from './RoomCards';
import { burst } from './RoomFx';
import { RoomFlyouts } from './RoomFlyouts';
import { finishRun } from './RoomFinish';
import { RoomBack } from './RoomBack';
import { RoomClock } from './RoomClock';
import { RoomFeel } from './RoomFeel';
import { RoomFlow } from './RoomFlow';
import { RoomGate } from './RoomGate';
import { RoomHouse } from './RoomHouse';

/** What the run controller needs from whichever room view (flat or isometric) is on screen. */
export interface RunView {
  playAction(spot: Spot): void;
  refresh(spotId: SpotId): void;
  pulse(spotId: SpotId): void;
  /** Screen centre of a spot, or null when unknown. */
  center(spotId: SpotId): { x: number; y: number } | null;
  /** Optional (iso view): zoom the room onto a lock before its puzzle opens, then call done. */
  zoomTo?(spot: Spot, done: () => void): void;
  resetZoom?(): void;
}

export interface RunHost {
  goRoom(room: RoomId): void;
  useHouse?: boolean; // views with the Dollhouse (HUD v3: house button instead of room tabs)
  onHouse?(): void; // overrides the Dollhouse overlay (the Home world zooms out instead)
  tutorial?(): boolean; // starts the guided tutorial (relaxed mornings); true when it started
}

/**
 * View-agnostic orchestration of one morning: session, clock, intro/coach/pause, gates,
 * marks, feel, finish. Used by every room view so there is one copy of the rules.
 */
export class RoomRun {
  readonly mode: GameMode;
  readonly seed: number;
  scenario!: Scenario;
  session!: GameSession;
  profile!: PlayerProfile;
  rooms: RoomId[] = [];
  start: RoomId = 'entrance';
  hud!: Hud;
  feel!: RoomFeel;
  private view!: RunView;
  private host!: RunHost;
  private back!: RoomBack;
  private clock!: RoomClock;
  private toast!: Toast;
  private dim!: Dim;
  private inspect!: InspectPanel;
  private board!: ClueBoard;
  private card!: ModalCard;
  private flow!: RoomFlow;
  private gate!: RoomGate;
  private spotRoom = new Map<SpotId, RoomId>();
  private fly!: RoomFlyouts;
  private inspectSpot: Spot | null = null;
  private unsubs: Array<() => void> = [];
  private puzzleOpen = false;
  private resolving = false;
  private finished = false;
  private hintsUsed = 0;
  private mounted = false;
  private house!: RoomHouse;

  constructor(private readonly scene: Phaser.Scene, data: RoomSceneData) {
    this.mode = data.mode;
    this.seed = data.seed ?? Math.floor(Math.random() * 2147483647);
  }

  /** Generate the morning and the shared overlays. Returns false (error UI shown) on failure. */
  prepare(): boolean {
    const s = this.scene;
    this.profile = getProfile(s);
    try {
      this.scenario = generateScenario(this.seed, this.mode, this.profile);
      this.session = new GameSession(this.scenario, this.profile, this.mode);
    } catch {
      makeText(s, 640, 280, "Couldn't set up this morning.", { fontSize: `${SIZE.heading}px`, fontStyle: 'bold' }).setOrigin(0.5);
      new Button(s, 640, 400, 320, 'Back to menu', () => go(s, SCENE.Menu), { variant: 'primary' });
      return false;
    }
    this.rooms = LEGACY_ROOMS.filter((r) => this.profile.unlockedRooms.includes(r));
    if (this.rooms.length === 0) this.rooms = ['entrance'];
    for (const sp of allSpots(this.profile)) this.spotRoom.set(sp.id, sp.room);
    const first = this.rooms[0] ?? 'entrance';
    this.start = this.rooms.includes(this.scenario.startRoom) ? this.scenario.startRoom : first;
    this.dim = new Dim(s);
    this.toast = new Toast(s);
    this.feel = new RoomFeel(s);
    return true;
  }

  /** Build HUD, overlays, clock, flow and gates around the view. Call after the view exists. */
  mount(view: RunView, host: RunHost): void {
    const s = this.scene;
    this.view = view;
    this.host = host;
    this.house = new RoomHouse(s, this.session, this.scenario, this.spotRoom, this.rooms, this.start, (room) => this.host.goRoom(room), () => this.clock?.remainingSec() ?? null);
    this.hud = new Hud(s, {
      targets: this.scenario.targets,
      timed: this.mode === 'rush',
      rooms: this.rooms,
      active: this.start,
      handlers: {
        onPause: () => this.flow.openPause(),
        onClues: () => this.openBoard(),
        onHint: () => this.useHint(),
        onRoom: (room) => this.host.goRoom(room),
        onHouse: this.host.useHouse ? () => (this.host.onHouse ? this.host.onHouse() : this.openHouse()) : undefined,
      },
    });
    sfx.setRoomAmbience(this.start);
    this.inspect = new InspectPanel(s, this.dim, {
      onTake: (item, x, y) => this.takeItem(item, x, y),
      onClose: () => undefined,
    });
    this.board = new ClueBoard(s, (id) => this.spotRoom.get(id), {
      onClose: () => undefined,
      onPoint: (room, spotId) => this.pointTo(room, spotId),
    });
    this.card = new ModalCard(s, this.dim);
    this.fly = new RoomFlyouts(s);
    this.unsubs.push(this.session.on('clue', () => this.onClue()), this.session.on('complete', () => this.onComplete()), new CaseUi(s, this.session, this.scenario, this.rooms, this.spotRoom, this.mode, () => this.flow.openPause()).off);
    this.clock = new RoomClock(
      s,
      this.mode === 'rush' ? this.scenario.timeLimitSec : null,
      this.hud,
      () => this.finished || this.flow.paused || this.puzzleOpen,
      () => this.onTimeUp(),
      (sec) => this.feel.urgency(sec),
    );
    s.events.on(Phaser.Scenes.Events.RESUME, this.clock.resync, this.clock);
    this.flow = new RoomFlow(s, this.card, this.scenario, this.mode, {
      beginClock: () => {
        this.clock.begin();
        sfx.play('swoosh');
      },
      resyncClock: () => this.clock.resync(),
      restart: () => s.scene.restart({ mode: this.mode, seed: this.seed } as RoomSceneData),
      quit: () => go(s, SCENE.Menu),
      canPause: () => this.clock.started && !this.finished && !this.puzzleOpen,
      hideOverlays: () => {
        this.inspect.hide(true);
        this.board.hide();
        this.house.close();
      },
      tutorial: this.host.tutorial,
    });
    this.gate = new RoomGate(s, this.scenario, {
      setPuzzleOpen: (open) => {
        this.puzzleOpen = open;
        if (!open) this.view.resetZoom?.();
      },
      solve: (spot, skipped) => this.session.solveGate(spot.id, skipped ? true : undefined),
      countHint: () => this.countHint(),
      reinspect: (spot) => this.reinspect(spot),
      warn: (m) => this.toast.show(m, 'warn'),
      notes: () => orderNotes(this.session.discoveredClues(), this.board.pinned),
    });
    this.back = new RoomBack(s, () => this.onBack());
    this.mounted = true;
  }

  /** Start the intro/coach flow. Call last, after every view object exists. */
  begin(): void {
    this.flow.intro();
  }

  get boardOpen(): boolean { return this.board.isOpen; }

  modalOpen(): boolean {
    const f = this.finished || this.flow.paused || this.puzzleOpen || this.resolving;
    return !this.clock.started || f || this.inspect.isOpen || this.board.isOpen || this.card.isOpen || this.house.isOpen;
  }

  onSpot(spot: Spot): void {
    if (this.modalOpen()) return;
    let out: InspectOutcome;
    try {
      out = this.session.inspect(spot.id);
    } catch {
      this.toast.show("Couldn't search there.", 'warn');
      return;
    }
    this.view.playAction(spot);
    this.feel.tap(spot);
    if (isLowFx(this.scene.game)) {
      this.applyOutcome(spot, out);
      return;
    }
    this.resolving = true;
    this.scene.time.delayedCall(140, () => this.applyOutcome(spot, out));
  }

  /** Long-press: cycle the deduction mark. The tap that follows is suppressed by the view. */
  onLong(spot: Spot): void {
    if (this.modalOpen() || this.session.isOpened(spot.id)) return;
    this.session.cycleMark(spot.id);
    vibrate(this.scene, 10);
    sfx.play('tap', { step: 3 });
  }

  /** Dollhouse overlay: the clock keeps running, spot taps are ignored while it is open. */
  openHouse(): void {
    if (this.modalOpen()) return;
    this.inspect.hide(true);
    this.house.open();
  }

  /** Views report room changes so the Dollhouse can highlight the current room. */
  setCurrent(room: RoomId): void {
    this.house.setCurrent(room);
  }

  destroy(): void {
    if (!this.mounted) return;
    this.house.close();
    const s = this.scene;
    s.events.off(Phaser.Scenes.Events.RESUME, this.clock.resync, this.clock);
    this.back.destroy();
    for (const off of this.unsubs) off();
    this.unsubs = [];
    s.tweens.killAll();
    s.time.removeAllEvents();
    this.board.destroy();
    this.inspect.destroy();
    this.card.destroy();
    this.hud.destroy();
    this.toast.destroy();
    this.dim.destroy();
    this.feel.destroy();
    this.mounted = false;
  }

  private applyOutcome(spot: Spot, out: InspectOutcome): void {
    this.resolving = false;
    if (this.finished) return;
    if (out.kind === 'found') {
      this.inspectSpot = spot;
      this.feel.opened(spot, out.items.length > 0);
      this.inspect.show(spot.label, out.items, out.clues, out.message);
    } else if (out.kind === 'locked') {
      const gate = out.gate ?? this.scenario.gates[spot.id];
      if (gate) this.gate.launch(spot, gate, this.zoomBefore(spot));
      else this.toast.show("It won't budge.", 'warn');
    } else {
      this.feel.empty(spot);
      this.toast.show(out.message.length > 0 ? out.message : 'Nothing here.');
    }
  }

  private takeItem(item: ItemId, x: number, y: number): void {
    this.inspect.removeItem(item);
    let isTarget = false;
    try {
      isTarget = this.session.take(item);
    } catch {
      this.toast.show("Couldn't pick that up.", 'warn');
      return;
    }
    if (!isTarget) {
      sfx.play('pop');
      this.toast.show(`${ITEM_LABEL[item]}: not needed this morning.`);
      return;
    }
    this.feel.taken();
    const to = this.hud.slotPos(item);
    const land = (): void => {
      this.hud.markFound(item);
      if (to) this.feel.landed(to.x, to.y);
    };
    this.fly.item(item, this.flyOrigin() ?? { x, y }, to, isCalm(this.scene), land);
  }

  /** Iso view only: zoom onto the lock (<= 250 ms) before the puzzle opens; cut when motion is calm. */
  private zoomBefore(spot: Spot): ((go: () => void) => void) | undefined {
    if (!this.view.zoomTo || isCalm(this.scene) || isLowFx(this.scene.game)) return undefined;
    return (go) => {
      this.resolving = true;
      this.view.zoomTo?.(spot, () => {
        this.resolving = false;
        go();
      });
    };
  }

  /** Iso view: things leave the furniture that was opened. Flat view: they leave the panel. */
  private flyOrigin(): { x: number; y: number } | null {
    return this.host.useHouse && this.inspectSpot ? this.view.center(this.inspectSpot.id) : null;
  }

  private onClue(): void {
    this.hud.setClues(this.session.discoveredClues().length);
    this.toast.show('Clue found!', 'clue');
    this.hud.wiggleClues();
    const c = this.hud.cluePos;
    this.feel.clue(c.x, c.y);
    const from = this.flyOrigin();
    if (from && !isCalm(this.scene)) this.fly.clue(from, c, () => undefined);
  }

  private useHint(): void {
    if (this.modalOpen()) return;
    const hint = this.session.hint();
    if (!hint) {
      sfx.play('error');
      this.toast.show('No more hints right now.', 'warn');
      return;
    }
    this.countHint();
    this.toast.show(hint.text, 'info', 3200);
    if (hint.room) this.hud.flashTab(hint.room);
    if (hint.spotId) {
      this.view.pulse(hint.spotId);
      const c = this.view.center(hint.spotId);
      this.feel.hint(c ? c.x : 640, c ? c.y : 360);
    } else this.feel.hint(640, 360);
  }

  private countHint(): void {
    this.hintsUsed++;
    this.hud.setHints(this.hintsUsed);
  }

  private openBoard(): void {
    if (!this.clock.started || this.finished || this.flow.paused || this.puzzleOpen || this.card.isOpen || this.resolving) return;
    this.inspect.hide(true);
    this.board.show(this.session.discoveredClues());
  }

  private pointTo(room: RoomId | undefined, spotId: SpotId | undefined): void {
    if (!room && !spotId) {
      this.toast.show("That note doesn't point anywhere specific.");
      return;
    }
    if (room) this.hud.flashTab(room);
    if (spotId) this.view.pulse(spotId);
  }

  private reinspect(spot: Spot): void {
    let out: InspectOutcome;
    try {
      out = this.session.inspect(spot.id);
    } catch {
      return;
    }
    this.view.refresh(spot.id);
    this.applyOutcome(spot, out);
  }

  private onBack(): void {
    if (this.house.isOpen) this.house.close();
    else if (this.flow.paused) this.flow.closePause();
    else if (this.board.isOpen) this.board.hide();
    else if (this.inspect.isOpen) this.inspect.hide();
    else this.flow.openPause();
  }

  private lockUp(): boolean {
    if (this.finished) return false;
    this.finished = true;
    this.inspect.hide(true);
    this.board.hide();
    return true;
  }

  private onComplete(): void {
    if (!this.lockUp()) return;
    this.feel.win();
    burst(this.scene);
    this.scene.time.delayedCall(600, () => this.end(false));
  }

  private onTimeUp(): void {
    if (!this.lockUp()) return;
    this.feel.lose();
    this.card.show(timeUpCard(() => this.end(true)));
  }

  private end(timedOut: boolean): void {
    finishRun(this.scene, this.session, this.scenario, this.mode, this.clock.elapsed, timedOut);
  }
}
