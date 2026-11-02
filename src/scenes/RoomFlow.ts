import type Phaser from 'phaser';
import { commitProfile } from '../core/save';
import type { GameMode, Scenario } from '../shared/types';
import { getProfile } from '../ui/theme';
import { coachCard, introCard, pauseCard, quitCard, COACH_STEPS } from './RoomCardConfigs';
import type { ModalCard } from './RoomCards';

export interface FlowHooks {
  beginClock(): void;
  resyncClock(): void;
  restart(): void;
  quit(): void;
  canPause(): boolean;
  hideOverlays(): void;
  /** Iso view: start the guided tutorial instead of the coach cards; returns true when it took over. */
  tutorial?(): boolean;
}

/** Intro, coach and pause/quit modals for a morning. Owns the `paused` flag. */
export class RoomFlow {
  paused = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly card: ModalCard,
    private readonly scenario: Scenario,
    private readonly mode: GameMode,
    private readonly hooks: FlowHooks,
  ) {}

  intro(): void {
    this.card.show(introCard(this.scenario, this.mode, () => this.afterIntro()));
  }

  private afterIntro(): void {
    this.card.hide();
    const p = getProfile(this.scene);
    if (p.day === 1 || !p.tutorialDone) {
      if (this.hooks.tutorial?.()) this.hooks.beginClock();
      else this.showCoach(0);
    } else this.hooks.beginClock();
  }

  private showCoach(step: number): void {
    this.card.show(
      coachCard(step, () => {
        if (step < COACH_STEPS.length - 1) {
          this.showCoach(step + 1);
          return;
        }
        this.card.hide();
        const p = getProfile(this.scene);
        if (!p.tutorialDone) commitProfile(this.scene.game, { ...p, tutorialDone: true });
        this.hooks.beginClock();
      }),
    );
  }

  openPause(): void {
    if (!this.hooks.canPause() || this.paused) return;
    this.hooks.hideOverlays();
    this.paused = true;
    this.showPause();
  }

  closePause(): void {
    this.card.hide();
    this.paused = false;
    this.hooks.resyncClock();
  }

  private showPause(): void {
    this.card.show(
      pauseCard(
        () => this.closePause(),
        () => this.hooks.restart(),
        () => this.card.show(quitCard(() => this.showPause(), () => this.hooks.quit())),
      ),
    );
  }
}
