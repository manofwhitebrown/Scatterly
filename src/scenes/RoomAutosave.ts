import type Phaser from 'phaser';
import type { GameSession } from '../logic';
import { saveResume } from './runSave';

const EVENTS = ['found', 'clue', 'mark', 'hint'] as const;
const EVERY_MS = 10000;

/** Keeps the autosave current: after every finding, clue, mark or hint, and every 10 s while the clock runs. */
export class RoomAutosave {
  private readonly offs: Array<() => void> = [];
  private timer: Phaser.Time.TimerEvent;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly session: GameSession,
    private readonly seed: number,
    private readonly elapsed: () => number,
    private readonly active: () => boolean,
  ) {
    for (const ev of EVENTS) this.offs.push(session.on(ev, () => this.save()));
    this.timer = scene.time.addEvent({ delay: EVERY_MS, loop: true, callback: () => this.save() });
  }

  save(): void {
    if (this.active()) saveResume(this.scene, this.session, this.seed, this.elapsed());
  }

  off(): void {
    for (const f of this.offs) f();
    this.offs.length = 0;
    this.timer.remove();
  }
}
