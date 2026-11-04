import { PUZZLES } from '../../src/logic/puzzles';
import { Rng, deriveSeed } from '../../src/logic/rng';
import { scenarioSpots } from '../../src/logic/validator';
import type { Clue, ItemId, PlayerProfile, Scenario, Spot, SpotId } from '../../src/shared/types';

/**
 * Session time model. Every number is an assumption about a casual phone player, not a measurement; change them here only
 * together with the written reason. Puzzle `parSeconds` is the time an expert needs, so casual players take a multiple.
 */
export interface TimeModel {
  /** Seconds to tap a room, let the camera zoom and look around. */
  roomChange: number;
  /** Seconds to tap one container and watch it open. */
  open: number;
  /** Seconds to read one clue and work out where it points. */
  readClue: number;
  /** Casual players need this multiple of the expert par time per puzzle stage. */
  puzzleSkill: number;
  /** Chance that a puzzle needs one more attempt (+60% of its time). */
  retryChance: number;
  /** Chance the player follows a clue instead of wandering. */
  followChance: number;
}
export const CASUAL: TimeModel = { roomChange: 6, open: 4, readClue: 9, puzzleSkill: 2.4, retryChance: 0.25, followChance: 0.85 };
export const EXPERT: TimeModel = { roomChange: 4, open: 3, readClue: 5, puzzleSkill: 1, retryChance: 0, followChance: 1 };

export interface SessionResult {
  seconds: number; opens: number; gatesSolved: number; found: ItemId[]; finished: boolean;
  /** Where the time went, in seconds. */
  parts: { puzzles: number; opening: number; walking: number; reading: number };
}

const stageSeconds = (kind: string, d: 1 | 2 | 3): number => (kind in PUZZLES ? PUZZLES[kind as keyof typeof PUZZLES].parSeconds(d) : 30);

/** Plays one case with a deterministic bot and returns how long it took. Pure; same inputs give the same result. */
export function playSession(s: Scenario, profile: PlayerProfile, model: TimeModel, seed: number): SessionResult {
  const rng = new Rng(deriveSeed(seed, 7001));
  const unlocked = new Set<string>(profile.unlockedRooms);
  const spots = scenarioSpots(s).filter((sp) => unlocked.has(sp.room));
  const byId = new Map<SpotId, Spot>(spots.map((sp) => [sp.id, sp]));
  const opened = new Set<SpotId>();
  const found = new Set<ItemId>();
  const known: Clue[] = [];
  let room = s.startRoom as string;
  let seconds = 0, opens = 0, gatesSolved = 0;
  const parts = { puzzles: 0, opening: 0, walking: 0, reading: 0 };

  const unopened = (list: Spot[]): Spot[] => list.filter((x) => !opened.has(x.id));
  const ready = (sp: Spot): boolean => (s.gates[sp.id]?.needs ?? []).every((cid) => known.some((c) => c.id === cid));
  const linked = (): Spot | undefined => {
    for (const strength of ['strong', 'weak'] as const) {
      for (const c of known) for (const l of c.links) {
        if (l.strength !== strength || (l.item && found.has(l.item))) continue;
        const direct = l.spotId ? byId.get(l.spotId) : undefined;
        if (direct && !opened.has(direct.id) && ready(direct)) return direct;
        if (l.room) {
          const inRoom = unopened(spots.filter((x) => x.room === l.room && ready(x)));
          if (inRoom.length > 0) return rng.pick(inRoom);
        }
      }
    }
    return undefined;
  };
  const wander = (): Spot | undefined => {
    const here = unopened(spots.filter((x) => x.room === room && ready(x)));
    if (here.length > 0) return rng.pick(here);
    const other = unopened(spots.filter((x) => ready(x)));
    return other.length > 0 ? rng.pick(other) : unopened(spots)[0];
  };

  for (let step = 0; step < 600 && s.targets.some((t) => !found.has(t)); step++) {
    const sp = (rng.chance(model.followChance) ? linked() : undefined) ?? wander();
    if (!sp) break;
    if (sp.room !== room) { seconds += model.roomChange; parts.walking += model.roomChange; room = sp.room; }
    seconds += model.open;
    parts.opening += model.open;
    opens++;
    opened.add(sp.id);
    const g = s.gates[sp.id];
    if (g) {
      gatesSolved++;
      for (const k of [g.kind, ...(g.chain ?? [])]) {
        let t = stageSeconds(k, g.difficulty) * model.puzzleSkill;
        if (rng.chance(model.retryChance)) t *= 1.6;
        seconds += t;
        parts.puzzles += t;
      }
    }
    for (const c of s.clues) if (c.spotId === sp.id && !known.includes(c)) { known.push(c); seconds += model.readClue; parts.reading += model.readClue; }
    for (const t of s.targets) if (s.placement[t] === sp.id) found.add(t);
  }
  return { seconds, opens, gatesSolved, found: [...found], finished: s.targets.every((t) => found.has(t)), parts };
}
