import { hashStr } from '../ui/theme';
import type { Gate, PuzzleLaunchData, PuzzleRequest, PuzzleResult, Scenario, Spot } from '../shared/types';

/** Builds the launch data for a gate: seed = scenario.seed + hash(spotId), as the contract says. */
export function puzzleLaunchData(
  scenario: Scenario,
  spot: Spot,
  gate: Gate,
  onDone: (r: PuzzleResult) => void,
): PuzzleLaunchData {
  const req: PuzzleRequest = {
    kind: gate.kind,
    seed: (scenario.seed + hashStr(spot.id)) >>> 0,
    difficulty: gate.difficulty,
  };
  if (gate.payload !== undefined) req.payload = gate.payload;
  if (gate.context !== undefined) req.context = gate.context;
  return { req, onDone };
}
