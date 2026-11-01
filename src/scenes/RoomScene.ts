import Phaser from 'phaser';
import { sfx } from '../audio/sfx';
import { isLowFx } from '../core/perf';
import { GameSession, allSpots, generateScenario } from '../logic';
import { ITEM_LABEL, ROOM_ORDER, SCENE, tex } from '../shared/types';
import type {
  GameMode,
  InspectOutcome,
  ItemId,
  RoomId,
  RoomSceneData,
  Scenario,
  Spot,
  SpotId,
} from '../shared/types';
import { Button } from '../ui/Button';
import { ClueBoard } from '../ui/ClueBoard';
import { Hud } from '../ui/Hud';
import { InspectPanel } from '../ui/InspectPanel';
import { Toast } from '../ui/Toast';
import { DEPTH, Dim, SIZE, enterFade, getProfile, go, makeText } from '../ui/theme';
import { timeUpCard } from './RoomCardConfigs';
import { ModalCard } from './RoomCards';
import { burst, flyItem } from './RoomFx';
import { finishRun } from './RoomFinish';
import { RoomBack } from './RoomBack';
import { RoomClock } from './RoomClock';
import { RoomNav } from './RoomNav';
import { RoomFlow } from './RoomFlow';
import { RoomGate } from './RoomGate';
import { RoomView } from './RoomView';

export class RoomScene extends Phaser.Scene {
  private mode: GameMode = 'relaxed';
  private seed = 0;
  private built = false;
  private scenario!: Scenario;
  private session!: GameSession;
  private view!: RoomView;
  private hud!: Hud;
  private nav!: RoomNav;
  private back!: RoomBack;
  private clock!: RoomClock;
  private toast!: Toast;
  private dim!: Dim;
  private inspect!: InspectPanel;
  private board!: ClueBoard;
  private card!: ModalCard;
  private spotRoom = new Map<SpotId, RoomId>();
  private flyImgs: Phaser.GameObjects.Image[] = [];
  private flyIdx = 0;
  private unsubs: Array<() => void> = [];
  private flow!: RoomFlow;
  private gate!: RoomGate;
  private puzzleOpen = false;
  private resolving = false;
  private finished = false;
  private hintsUsed = 0;

  constructor() {
    super(SCENE.Room);
  }

  init(data: RoomSceneData): void {
    this.mode = data.mode;
    this.seed = data.seed ?? Math.floor(Math.random() * 2147483647);
    this.built = false;
    this.puzzleOpen = false;
    this.resolving = false;
    this.finished = false;
    this.hintsUsed = 0;
    this.flyIdx = 0;
    this.flyImgs = [];
    this.unsubs = [];
  }

  create(): void {
    enterFade(this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
    const profile = getProfile(this);
    try {
      this.scenario = generateScenario(this.seed, this.mode, profile);
      this.session = new GameSession(this.scenario, profile, this.mode);
    } catch {
      makeText(this, 640, 280, "Couldn't set up this morning.", { fontSize: `${SIZE.heading}px`, fontStyle: 'bold' }).setOrigin(0.5);
      new Button(this, 640, 400, 320, 'Back to menu', () => go(this, SCENE.Menu), { variant: 'primary' });
      return;
    }
    let rooms: RoomId[] = ROOM_ORDER.filter((r) => profile.unlockedRooms.includes(r));
    if (rooms.length === 0) rooms = ['entrance'];
    for (const s of allSpots(profile)) this.spotRoom.set(s.id, s.room);
    const start: RoomId = rooms.includes(this.scenario.startRoom) ? this.scenario.startRoom : rooms[0] ?? 'entrance';

    this.dim = new Dim(this);
    this.toast = new Toast(this);
    this.view = new RoomView(this, this.session, profile, (spot) => this.onSpot(spot));
    this.view.show(start, 0);
    this.hud = new Hud(this, {
      targets: this.scenario.targets,
      timed: this.mode === 'rush',
      rooms,
      active: start,
      handlers: {
        onPause: () => this.flow.openPause(),
        onClues: () => this.openBoard(),
        onHint: () => this.useHint(),
        onRoom: (room) => this.nav.goTo(room),
      },
    });
    this.nav = new RoomNav(this, this.view, this.hud, rooms, () => this.modalOpen());
    this.inspect = new InspectPanel(this, this.dim, {
      onTake: (item, x, y) => this.takeItem(item, x, y),
      onClose: () => undefined,
    });
    this.board = new ClueBoard(this, (id) => this.spotRoom.get(id), {
      onClose: () => undefined,
      onPoint: (room, spotId) => this.pointTo(room, spotId),
    });
    this.card = new ModalCard(this, this.dim);
    for (let i = 0; i < 3; i++) {
      this.flyImgs.push(this.add.image(0, 0, tex.item('keys')).setDepth(DEPTH.fly).setVisible(false));
    }

    this.unsubs.push(this.session.on('clue', () => this.onClue()));
    this.unsubs.push(this.session.on('complete', () => this.onComplete()));
    this.clock = new RoomClock(
      this,
      this.mode === 'rush' ? this.scenario.timeLimitSec : null,
      this.hud,
      () => this.finished || this.flow.paused || this.puzzleOpen,
      () => this.onTimeUp(),
    );
    this.events.on(Phaser.Scenes.Events.RESUME, this.clock.resync, this.clock);
    this.flow = new RoomFlow(this, this.card, this.scenario, this.mode, {
      beginClock: () => this.beginClock(),
      resyncClock: () => this.clock.resync(),
      restart: () => this.scene.restart({ mode: this.mode, seed: this.seed } as RoomSceneData),
      quit: () => go(this, SCENE.Menu),
      canPause: () => this.clock.started && !this.finished && !this.puzzleOpen,
      hideOverlays: () => {
        this.inspect.hide(true);
        this.board.hide();
      },
    });
    this.gate = new RoomGate(this, this.scenario, {
      setPuzzleOpen: (open) => {
        this.puzzleOpen = open;
      },
      solve: (spot, skipped) => this.session.solveGate(spot.id, skipped ? true : undefined),
      countHint: () => this.countHint(),
      reinspect: (spot) => this.reinspect(spot),
      warn: (m) => this.toast.show(m, 'warn'),
    });
    this.back = new RoomBack(this, () => this.onBack());
    this.built = true;
    this.flow.intro();
  }

  private beginClock(): void {
    this.clock.begin();
    sfx.play('swoosh');
  }

  private modalOpen(): boolean {
    return (
      !this.clock.started ||
      this.finished ||
      this.flow.paused ||
      this.puzzleOpen ||
      this.resolving ||
      this.inspect.isOpen ||
      this.board.isOpen ||
      this.card.isOpen
    );
  }

  private onSpot(spot: Spot): void {
    if (this.modalOpen()) return;
    let out: InspectOutcome;
    try {
      out = this.session.inspect(spot.id);
    } catch {
      this.toast.show("Couldn't search there.", 'warn');
      return;
    }
    this.view.playAction(spot);
    sfx.play(out.kind === 'locked' ? 'tap' : out.kind === 'empty' ? 'close' : 'swoosh');
    if (isLowFx(this.game)) {
      this.applyOutcome(spot, out);
      return;
    }
    this.resolving = true;
    this.time.delayedCall(140, () => this.applyOutcome(spot, out));
  }

  private applyOutcome(spot: Spot, out: InspectOutcome): void {
    this.resolving = false;
    if (this.finished) return;
    if (out.kind === 'found') {
      this.inspect.show(spot.label, out.items, out.clues, out.message);
    } else if (out.kind === 'locked') {
      const gate = out.gate ?? this.scenario.gates[spot.id];
      if (gate) this.gate.launch(spot, gate);
      else this.toast.show("It won't budge.", 'warn');
    } else {
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
    sfx.play('found');
    const to = this.hud.slotPos(item);
    const img = this.flyImgs[this.flyIdx++ % Math.max(1, this.flyImgs.length)];
    if (!to || !img || isLowFx(this.game)) this.hud.markFound(item);
    else flyItem(this, img, item, { x, y }, to, () => this.hud.markFound(item));
  }

  private onClue(): void {
    this.hud.setClues(this.session.discoveredClues().length);
    this.toast.show('Clue found!', 'clue');
    sfx.play('clue');
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
    if (hint.spotId) this.view.queuePulse(hint.spotId);
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
    if (spotId) this.view.queuePulse(spotId);
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
    if (this.flow.paused) this.flow.closePause();
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
    sfx.play('win');
    burst(this);
    this.time.delayedCall(600, () => this.end(false));
  }

  private onTimeUp(): void {
    if (!this.lockUp()) return;
    sfx.play('lose');
    this.card.show(timeUpCard(() => this.end(true)));
  }

  private end(timedOut: boolean): void {
    finishRun(this, this.session, this.scenario, this.mode, this.clock.elapsed, timedOut);
  }

  private cleanup(): void {
    if (!this.built) return;
    this.events.off(Phaser.Scenes.Events.RESUME, this.clock.resync, this.clock);
    this.back.destroy();
    for (const off of this.unsubs) off();
    this.unsubs = [];
    this.nav.destroy();
    this.tweens.killAll();
    this.time.removeAllEvents();
    this.board.destroy();
    this.inspect.destroy();
    this.card.destroy();
    this.hud.destroy();
    this.view.destroy();
    this.toast.destroy();
    this.dim.destroy();
    this.built = false;
  }
}
