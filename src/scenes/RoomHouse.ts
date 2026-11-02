import type Phaser from 'phaser';
import type { GameSession } from '../logic';
import { SCENE } from '../shared/types';
import type { RoomId, Scenario, SpotId } from '../shared/types';
import { roomProgress } from './houseProgress';

/** Opens and closes the Dollhouse overlay over a running morning (the clock keeps running underneath). */
export class RoomHouse {
  private opened = false;
  private shown: RoomId;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly session: GameSession,
    private readonly scenario: Scenario,
    private readonly spotRoom: ReadonlyMap<SpotId, RoomId>,
    private readonly rooms: readonly RoomId[],
    start: RoomId,
    private readonly goRoom: (room: RoomId) => void,
    private readonly timeLeft: () => number | null,
  ) {
    this.shown = start;
  }

  get isOpen(): boolean {
    return this.opened;
  }

  setCurrent(room: RoomId): void {
    this.shown = room;
  }

  open(): void {
    if (this.opened) return;
    this.opened = true;
    this.scene.scene.launch(SCENE.House, {
      overlay: true,
      current: this.shown,
      unlocked: this.rooms,
      timeLeft: this.timeLeft,
      progress: (room: RoomId) => roomProgress(this.session, this.scenario, this.spotRoom, room),
      onPick: (room: RoomId) => this.goRoom(room),
      onClose: () => {
        this.opened = false;
      },
    });
  }

  close(): void {
    if (!this.opened) return;
    this.opened = false;
    this.scene.scene.stop(SCENE.House);
  }
}
