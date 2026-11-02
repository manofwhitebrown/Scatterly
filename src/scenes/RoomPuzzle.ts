import { hashStr } from '../ui/theme';
import type { Clue, Gate, PuzzleLaunchData, PuzzleRequest, PuzzleResult, Scenario, Spot } from '../shared/types';

/** Builds the launch data for a gate (notes = the clues found so far, for the keypad's drawer): seed = scenario.seed + hash(spotId), as the contract says. */
export function puzzleLaunchData(
  scenario: Scenario,
  spot: Spot,
  gate: Gate,
  notes: Clue[],
  onDone: (r: PuzzleResult) => void,
): PuzzleLaunchData {
  const req: PuzzleRequest = {
    kind: gate.kind,
    seed: (scenario.seed + hashStr(spot.id)) >>> 0,
    difficulty: gate.difficulty,
  };
  if (gate.payload !== undefined) req.payload = gate.payload;
  if (gate.context !== undefined) req.context = gate.context;
  return { req, notes, onDone };
}
