import type { EveningVerb, ItemId, ReplayStep, RoomId, RunResult, Scenario, SpotId } from '../shared/types';

export type { ReplayStep };

const BEAT = 1.2;
const WALK = 0.6;

const minutes = (clock: string): number => {
  const [h, m] = clock.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
};

/**
 * Turns the evening timeline into replay steps: ordered, timed, deterministic. Pure function of the scenario (and
 * which items the run found); never mutates its inputs. Longer real gaps get a slightly longer beat (capped), and a
 * room change adds walking time, so the avatar has time to cross the house.
 */
export function replayScript(scenario: Scenario, run?: Pick<RunResult, 'found'>): ReplayStep[] {
  const found = new Set<ItemId>(run?.found ?? []);
  const out: ReplayStep[] = [];
  let t = 0;
  let prevRoom: RoomId | null = null;
  let prevMin: number | null = null;
  for (const e of scenario.evening) {
    const m = minutes(e.clock);
    const gap = prevMin === null ? 0 : Math.max(0, m - prevMin);
    if (prevMin !== null) t += BEAT + Math.min(1.2, gap / 30) + (prevRoom !== null && prevRoom !== e.room ? WALK : 0);
    const step: ReplayStep = { t: Math.round(t * 100) / 100, room: e.room, verb: e.verb, icon: `icon/${e.itemId ?? e.verb}` };
    if (e.spotId) step.spotId = e.spotId;
    if (e.itemId) {
      step.itemId = e.itemId;
      if (found.has(e.itemId) && scenario.placement[e.itemId] === e.spotId) step.found = true;
    }
    out.push(step);
    prevRoom = e.room;
    prevMin = m;
  }
  return out;
}

/** Total replay length in seconds (last step time plus one beat). */
export function replayDuration(steps: readonly ReplayStep[]): number {
  const last = steps[steps.length - 1];
  return last ? last.t + BEAT : 0;
}
