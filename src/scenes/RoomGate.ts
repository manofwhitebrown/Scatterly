import type Phaser from 'phaser';
import { PUZZLE_SCENE } from '../shared/types';
import type { Clue, Gate, PuzzleResult, Scenario, Spot } from '../shared/types';
import { sceneExists } from '../ui/theme';
import { puzzleLaunchData } from './RoomPuzzle';

export interface GateHooks {
  setPuzzleOpen(open: boolean): void;
  solve(spot: Spot, skipped: boolean): void;
  countHint(): void;
  reinspect(spot: Spot): void;
  warn(msg: string): void;
  /** Clues found so far, ordered for the puzzle's notes drawer. */
  notes(): Clue[];
}

/** Puzzle gate launching. Keeps the Room resume inside onDone (scene contract). */
export class RoomGate {
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly scenario: Scenario,
    private readonly hooks: GateHooks,
  ) {}

  /** `before` runs first (the iso lock zoom) and calls `go` when the puzzle may open. */
  launch(spot: Spot, gate: Gate, before?: (go: () => void) => void): void {
    const key = PUZZLE_SCENE[gate.kind];
    if (!sceneExists(this.scene, key)) {
      this.hooks.warn("That puzzle isn't available, so it opened anyway.");
      this.hooks.solve(spot, true);
      this.hooks.countHint();
      this.hooks.reinspect(spot);
      return;
    }
    const data = puzzleLaunchData(this.scenario, spot, gate, this.hooks.notes(), (r) => this.done(spot, r));
    const open = (): void => {
      this.hooks.setPuzzleOpen(true);
      this.scene.scene.pause();
      this.scene.scene.launch(key, data);
    };
    if (before) before(open);
    else open();
  }

  private done(spot: Spot, r: PuzzleResult): void {
    this.hooks.setPuzzleOpen(false);
    this.scene.scene.resume();
    if (r.solved) this.hooks.solve(spot, false);
    else if (r.skipped) {
      this.hooks.solve(spot, true);
      this.hooks.countHint();
    } else return;
    this.hooks.reinspect(spot);
  }
}
