import Phaser from 'phaser';
import { commitProfile } from '../core/save';
import { isLowFx } from '../core/perf';
import type { RoomId, Spot } from '../shared/types';
import { Button } from '../ui/Button';
import { COLOR, CSS, DEPTH, SIZE, getProfile, isCalm, makeText } from '../ui/theme';
import type { IsoRoomView } from './IsoRoomView';
import type { RoomRun } from './RoomRun';
import { LOCK_TEXT_ELSEWHERE, LOCK_TEXT_HERE, TUTORIAL_STEPS, nextStep, pickTarget } from './tutorialSteps';
import type { TutorialStep } from './tutorialSteps';

const BANNER_Y = 560;

/**
 * Guided first morning for the iso room: a banner plus a pulsing ring on the next tap target. Never blocks input (only
 * the Skip button is interactive), skippable at any time, and records `tutorialDone` when it ends either way.
 */
export class RoomTutorial {
  private step: TutorialStep = TUTORIAL_STEPS[0] as TutorialStep;
  private stepAt = 0;
  private marked = false;
  private paused = false;
  private ended = false;
  private readonly plate: Phaser.GameObjects.Graphics;
  private readonly text: Phaser.GameObjects.Text;
  private readonly ring: Phaser.GameObjects.Graphics;
  private readonly skip: Button;
  private readonly poll: Phaser.Time.TimerEvent;
  private readonly offMark: () => void;

  constructor(private readonly scene: Phaser.Scene, private readonly run: RoomRun, private readonly view: IsoRoomView) {
    this.plate = scene.add.graphics().setDepth(DEPTH.hud);
    this.plate.fillStyle(COLOR.plateEdge, 0.92).fillRoundedRect(60, BANNER_Y - 40, 960, 80, 16);
    this.text = makeText(scene, 90, BANNER_Y, '', { fontSize: `${SIZE.label}px`, color: CSS.cream, wordWrap: { width: 900 }, maxLines: 2 }).setOrigin(0, 0.5).setDepth(DEPTH.hud);
    this.ring = scene.add.graphics().setDepth(DEPTH.hud).setVisible(false);
    this.ring.lineStyle(8, COLOR.amber, 1).strokeCircle(0, 0, 64);
    this.skip = new Button(scene, 1130, BANNER_Y, 190, 'Skip', () => this.finish(), { height: 64 }).setDepth(DEPTH.hud);
    if (!isCalm(scene) && !isLowFx(scene.game)) scene.tweens.add({ targets: this.ring, scale: 1.12, duration: 520, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.offMark = run.session.on('mark', () => {
      this.marked = true;
    });
    scene.events.on(Phaser.Scenes.Events.PAUSE, this.onPause, this);
    this.poll = scene.time.addEvent({ delay: 250, loop: true, callback: this.tick, callbackScope: this });
    this.enter(TUTORIAL_STEPS[0] as TutorialStep);
  }

  destroy(): void {
    this.ended = true;
    this.poll.remove(false);
    this.offMark();
    this.scene.events.off(Phaser.Scenes.Events.PAUSE, this.onPause, this);
    this.scene.tweens.killTweensOf(this.ring);
    this.skip.destroy();
    for (const o of [this.plate, this.text, this.ring]) o.destroy();
  }

  private onPause(): void {
    this.paused = true;
  }

  private here(): Spot[] {
    const room: RoomId | null = this.view.room;
    return room === null ? [] : (this.run.session.spotsIn(room) ?? []).slice();
  }

  private target(): Spot | null {
    const opened = (id: string): boolean => this.run.session.isOpened(id);
    const gates = this.run.scenario.gates;
    if (this.step.id === 'tap' || this.step.id === 'mark') return pickTarget(this.here(), gates, opened, 'free');
    if (this.step.id === 'lock') return pickTarget(this.here(), gates, opened, 'locked');
    return null;
  }

  private enter(step: TutorialStep): void {
    this.step = step;
    this.stepAt = this.scene.time.now;
    this.paused = false;
    this.marked = false;
    const lockHere = step.id === 'lock' && this.target() !== null;
    this.text.setText(step.id === 'lock' ? (lockHere ? LOCK_TEXT_HERE : LOCK_TEXT_ELSEWHERE) : step.text);
    this.place();
  }

  /** Puts the ring on the current target (the clue button for the notebook step), or hides it. */
  private place(): void {
    let at: { x: number; y: number } | null = null;
    if (this.step.id === 'notebook') at = this.run.hud.cluePos;
    else {
      const t = this.target();
      const s = t ? this.view.spotOf(t.id) : undefined;
      at = s ? { x: s.x + s.w / 2, y: s.y + s.h / 2 } : null;
    }
    this.ring.setVisible(at !== null);
    if (at) this.ring.setPosition(at.x, at.y);
  }

  private anyOpened(): boolean {
    return this.run.rooms.some((r) => (this.run.session.spotsIn(r) ?? []).some((s) => this.run.session.isOpened(s.id)));
  }

  /** 4 Hz: follow the player (room changes move the ring) and move on when the step's action happened. */
  private tick(): void {
    if (this.ended) return;
    const id = this.step.id;
    const waited = this.scene.time.now - this.stepAt;
    let done = false;
    if (id === 'tap') done = this.anyOpened();
    else if (id === 'lock') done = this.paused || (this.target() === null && waited > 5000);
    else if (id === 'notebook') done = this.run.boardOpen;
    else if (id === 'mark') done = this.marked;
    else done = waited >= (this.step.autoMs ?? 2500);
    if (!done) {
      this.place();
      return;
    }
    const next = nextStep(id);
    if (next) this.enter(next);
    else this.finish();
  }

  private finish(): void {
    if (this.ended) return;
    const p = getProfile(this.scene);
    if (!p.tutorialDone) commitProfile(this.scene.game, { ...p, tutorialDone: true });
    this.destroy();
  }
}
