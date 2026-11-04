import { STORAGE_SPOTS, anySpot } from '../content/decor';
import { ENABLED } from '../content/puzzleRoster';
import { TEMPLATES } from '../content/templates';
import type { SlotDef, Template } from '../content/templates';
import type {
  Difficulty, GameMode, ItemId, PlayerProfile, PuzzleKind, RoomId, Scenario, SessionLength, Spot, SpotId,
} from '../shared/types';
import { caseSpec } from './caseSpec';
import type { CaseSpec } from './caseSpec';
import { buildClues } from './clues';
import { expand, simulateEvening } from './evening';
import type { SlotMap } from './evening';
import { addGatesV3 } from './gates';
import { allSpots } from './progression';
import { Rng, deriveSeed } from './rng';
import { solveScenario } from './solver';
import { idealSearchCount, validateScenario } from './validator';

const MODE_SALT: Record<GameMode, number> = { rush: 11, relaxed: 23, daily: 37 };
const MAX_ATTEMPTS = 40;
const PUZZLE_TIME_SLACK = 1.2;

/** Local calendar date as an int, e.g. 20261101. */
export function dailySeed(d: Date = new Date()): number {
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

interface World {
  profile: PlayerProfile;
  unlocked: Set<RoomId>;
  spots: Spot[];
  byId: Map<SpotId, Spot>;
  byRoom: Map<RoomId, Spot[]>;
}

function makeWorld(profile: PlayerProfile): World {
  const unlocked = new Set(profile.unlockedRooms);
  const spots = allSpots(profile).filter((s) => unlocked.has(s.room));
  const byRoom = new Map<RoomId, Spot[]>();
  for (const s of spots) byRoom.set(s.room, [...(byRoom.get(s.room) ?? []), s]);
  return { profile, unlocked, spots, byId: new Map(spots.map((s) => [s.id, s])), byRoom };
}

function expandPool(pool: string[], w: World): Spot[] {
  const out: Spot[] = [];
  const seen = new Set<SpotId>();
  for (const sel of pool) {
    let list: Spot[] = [];
    if (sel.startsWith('room:')) list = w.byRoom.get(sel.slice(5) as RoomId) ?? [];
    else if (sel.startsWith('kind:')) list = w.spots.filter((s) => s.kind === sel.slice(5));
    else {
      const s = w.byId.get(sel);
      if (s) list = [s];
    }
    for (const s of list) {
      if (!seen.has(s.id)) {
        seen.add(s.id);
        out.push(s);
      }
    }
  }
  return out;
}

function pickDifficulty(day: number, rng: Rng): Difficulty {
  if (day <= 3) return 1;
  if (day <= 6) return rng.weighted<Difficulty>([[1, 2], [2, 5]]);
  if (day <= 11) return rng.weighted<Difficulty>([[1, 1], [2, 4], [3, 2]]);
  if (day <= 15) return rng.weighted<Difficulty>([[2, 3], [3, 4]]);
  return rng.weighted<Difficulty>([[2, 3], [3, 6]]);
}

interface Resolved { slots: SlotMap; habit: Map<ItemId, SpotId> }

function resolveSlots(t: Template, w: World, rng: Rng, spread = false): Resolved | null {
  const slots: SlotMap = {};
  const habit = new Map<ItemId, SpotId>();
  const used = new Set<SpotId>();
  const usedRooms = new Set<RoomId>([t.start]);
  const owned = new Set(STORAGE_SPOTS.filter((s) => w.profile.owned.some((o) => `${s.room}.${o}` === s.id)).map((s) => s.id));
  for (const [name, def] of Object.entries(t.slots) as Array<[string, SlotDef]>) {
    const need = def.items ?? [];
    const fits = (s: Spot): boolean => !used.has(s.id)
      && (!def.acts || def.acts.includes(s.action))
      && need.every((i) => s.plausible.includes(i))
      && s.capacity >= Math.max(1, need.length);
    let chosen: Spot | undefined;
    if (def.habit) {
      const home = w.profile.homeSpots[def.habit];
      const hs = home ? w.byId.get(home) : undefined;
      if (hs && fits(hs) && rng.chance(owned.has(hs.id) ? 0.85 : 0.65)) {
        chosen = hs;
        habit.set(def.habit, hs.id);
      }
    }
    if (!chosen) {
      const cands = expandPool(def.pool, w).filter(fits);
      if (cands.length === 0) return null;
      // Case builder: spread item slots over rooms the evening has not used yet.
      const fresh = spread && need.length > 0 ? cands.filter((c) => !usedRooms.has(c.room)) : [];
      chosen = rng.pick(fresh.length > 0 ? fresh : cands);
    }
    used.add(chosen.id);
    if (need.length > 0) usedRooms.add(chosen.room);
    slots[name] = chosen.id;
  }
  return { slots, habit };
}

function attempt(seed: number, mode: GameMode, w: World, salt: number, enabled: readonly PuzzleKind[], spec?: CaseSpec): Scenario {
  const rng = new Rng(deriveSeed(seed, salt * 101 + MODE_SALT[mode]));
  const picked: Difficulty = mode === 'daily' ? 2 : pickDifficulty(w.profile.day, rng);
  // A scaled case needs a template with at least four targets, which starts at base 2.
  const difficulty: Difficulty = spec ? (Math.max(picked, 2) as Difficulty) : picked;
  const eligible = TEMPLATES.filter((t) => t.base <= difficulty && (!spec || t.targets.length >= 4) && w.unlocked.has(t.start)
    && (t.needs ?? []).every((r) => w.unlocked.has(r)));
  const t = rng.weighted(eligible.map((x) => [x, x.base === difficulty ? 3 : x.base === difficulty - 1 ? 2 : 1] as const));
  const more = difficulty === 1 ? 0 : rng.chance(0.5) ? 1 : 0;
  const count = Math.min(t.targets.length, spec ? spec.targets : 2 + (difficulty === 3 ? 1 : 0) + more);
  const targets = t.targets.slice(0, count);
  const resolved = resolveSlots(t, w, rng, !!spec);
  if (!resolved) throw new Error('slots unresolved');
  const { steps, placement } = simulateEvening(t, resolved.slots, rng);
  const habit = new Map<ItemId, SpotId>();
  for (const [item, id] of resolved.habit) if (targets.includes(item)) habit.set(item, id);
  const factRng = new Rng(deriveSeed(seed, salt * 101 + MODE_SALT[mode] + 9000));
  const clues = buildClues(t, resolved.slots, targets, habit, difficulty, factRng);
  const s: Scenario = {
    id: `${mode}-${seed}`, seed, title: t.title, intro: expand(t.intro, resolved.slots, 1), difficulty,
    startRoom: t.start, evening: steps, targets, placement, clues, gates: {},
    timeLimitSec: Math.max(60, Math.round((25 * targets.length + 20 * difficulty) / 5) * 5), parSearches: 0,
  };
  const big = !spec && mode !== 'daily' && w.profile.day >= 12 && rng.chance(0.12);
  // The daily must be the same for everyone: gates ignore the player's day and puzzle history.
  const gateProfile: PlayerProfile = mode === 'daily' ? { ...w.profile, day: 6, puzzles: {} } : w.profile;
  addGatesV3(s, rng, {
    enabled, profile: gateProfile, big, spots: w.spots,
    ...(spec ? { budget: rng.int(spec.gatesMin, spec.gatesMax), finale: spec.finale, chains: rng.int(spec.chainsMin, spec.chainsMax), chainDepth: spec.chainDepth, finaleDepth: spec.finaleDepth } : {}),
  });
  s.parSearches = idealSearchCount(s) + 2;
  // Puzzles take real time: give every gate the player has to open its par time plus slack.
  s.timeLimitSec += Math.round((solveScenario(s).seconds * PUZZLE_TIME_SLACK) / 5) * 5;
  return s;
}

/** Known-good tutorial evening used if generation ever fails. Never throws. */
export function fallbackScenario(seed: number, mode: GameMode): Scenario {
  const evening = [
    { n: 1, clock: '18:40', verb: 'arrive', room: 'entrance', note: 'You got home tired and hungry.' },
    { n: 2, clock: '18:46', verb: 'drop', room: 'entrance', spotId: 'entrance.shelf', itemId: 'keys', note: 'You dropped your keys on the hall shelf.' },
    { n: 3, clock: '19:02', verb: 'use', room: 'living', spotId: 'living.sofa', itemId: 'phone', note: 'You flopped down and left your phone in the sofa cushions.' },
    { n: 4, clock: '19:30', verb: 'use', room: 'bedroom', spotId: 'bedroom.charger', note: 'You scribbled a reminder and propped it on the bedside charger.' },
    { n: 5, clock: '19:45', verb: 'use', room: 'bedroom', spotId: 'bedroom.bed', note: 'You tidied the bed, kind of.' },
    { n: 6, clock: '20:10', verb: 'sleep', room: 'bedroom', note: 'You fell asleep early.' },
  ] as Scenario['evening'];
  return {
    id: `${mode}-${seed}-tutorial`, seed, title: 'A Quiet Night In', difficulty: 1,
    intro: 'A quiet night in. Your keys and phone are somewhere. Start with what you can see.',
    startRoom: 'bedroom', evening, targets: ['keys', 'phone'],
    placement: { keys: 'entrance.shelf', phone: 'living.sofa' },
    clues: [{
      id: 'c1', spotId: 'bedroom.charger', title: 'Reminder note', icon: 'note',
      text: 'Note: keys on the hall shelf, phone in the sofa cushions.',
      links: [
        { spotId: 'entrance.shelf', item: 'keys', strength: 'strong' },
        { spotId: 'living.sofa', item: 'phone', strength: 'strong' },
      ],
    }],
    gates: {}, timeLimitSec: 90, parSearches: 5,
  };
}

/**
 * Day 1: a fixed, friendly morning with two targets and one easy puzzle (the keys sit in a jammed drawer).
 * Uses the first enabled kind from untangle / sort / word so it always has a working scene.
 */
export function guidedScenario(seed: number, mode: GameMode, enabled: readonly PuzzleKind[] = ENABLED): Scenario {
  const s = fallbackScenario(seed, mode);
  const kind = (['untangle', 'sort', 'word'] as PuzzleKind[]).find((k) => enabled.includes(k));
  const evening = s.evening.map((e) => (e.n === 2
    ? { ...e, spotId: 'entrance.console', note: 'You dropped your keys in the console drawer and shoved it shut.' }
    : e));
  s.id = `${mode}-${seed}-guided`;
  s.title = 'Your First Morning';
  s.intro = 'Welcome home. Your keys and phone are somewhere. Follow the note, and mind the stuck drawer.';
  s.evening = evening;
  s.placement = { keys: 'entrance.console', phone: 'living.sofa' };
  s.clues = [{
    id: 'c1', spotId: 'bedroom.charger', title: 'Reminder note', icon: 'note',
    text: 'Note: keys in the hall console drawer, phone in the sofa cushions.',
    links: [
      { spotId: 'entrance.console', item: 'keys', strength: 'strong' },
      { spotId: 'living.sofa', item: 'phone', strength: 'strong' },
    ],
  }];
  if (kind) {
    s.gates = { 'entrance.console': kind === 'word'
      ? { kind, difficulty: 1, payload: 'KEYS', context: 'What you are looking for.' }
      : kind === 'sort'
        ? { kind, difficulty: 1, payload: 'colour', context: 'It is crammed with odds and ends.' }
        : { kind, difficulty: 1, payload: 'cables', context: 'A knot of cords blocks the way.' } };
  }
  s.parSearches = idealSearchCount(s) + 2;
  return s;
}

export interface GenerateOptions {
  /** Case builder: session length (defaults to the profile's setting). */
  length?: SessionLength;
  /** Override the enabled puzzle kinds (tests, balance sims). Defaults to ENABLED. */
  enabled?: readonly PuzzleKind[];
}

/** Deterministic per (seed, mode, relevant profile). Retries with derived seeds until valid. */
export function generateScenario(seed: number, mode: GameMode, profile: PlayerProfile, opts: GenerateOptions = {}): Scenario {
  const enabled = opts.enabled ?? ENABLED;
  if (profile.day <= 1 && mode !== 'daily') {
    const g = guidedScenario(seed, mode, enabled);
    if (validateScenario(g, profile).length === 0) return g;
  }
  const w = makeWorld(profile);
  for (let salt = 0; salt < MAX_ATTEMPTS; salt++) {
    try {
      const s = attempt(seed, mode, w, salt, enabled);
      if (validateScenario(s, profile).length === 0 && solveScenario(s).ok) return s;
    } catch {
      // try the next derived seed
    }
  }
  return fallbackScenario(seed, mode);
}

/** Rooms the player has to visit: the start room plus every room holding a target or a clue. */
export function roomsTouched(s: Scenario): number {
  const rooms = new Set<RoomId>([s.startRoom]);
  for (const id of [...Object.values(s.placement), ...s.clues.map((c) => c.spotId)]) {
    const sp = id ? anySpot(id) : undefined;
    if (sp) rooms.add(sp.room);
  }
  return rooms.size;
}

const MIN_ROOMS = 4;

/** The compound finale: a code lock that needs facts from several clues, then a second puzzle stage. */
export function hasFinale(s: Scenario): boolean {
  return Object.values(s.gates).some((g) => g.kind === 'code' && (g.chain?.length ?? 0) > 0 && (g.needs?.length ?? 0) >= 2);
}
const caseScore = (s: Scenario, spec: CaseSpec): number =>
  Math.min(roomsTouched(s), MIN_ROOMS) + (!spec.finale || hasFinale(s) ? MIN_ROOMS : 0);

/**
 * Case builder: a full-length case (padlocks, decoys, compound gates and a finale) sized by day ramp and session length.
 * Gentle days, Rush and the Daily keep the classic generator, so this is a drop-in for generateScenario.
 * Deterministic per (seed, mode, profile, length). Never throws.
 */
export function generateCase(seed: number, mode: GameMode, profile: PlayerProfile, opts: GenerateOptions = {}): Scenario {
  const enabled = opts.enabled ?? ENABLED;
  const spec = caseSpec(profile.day, opts.length ?? profile.settings.sessionLength, mode);
  if (!spec.scaled) return generateScenario(seed, mode, profile, opts);
  const w = makeWorld(profile);
  let best: Scenario | undefined;
  for (let salt = 0; salt < MAX_ATTEMPTS; salt++) {
    try {
      const s = attempt(seed, mode, w, salt, enabled, spec);
      const limits = { maxGates: spec.gatesMax, maxChained: spec.chainsMax };
      if (validateScenario(s, profile, limits).length > 0 || !solveScenario(s).ok) continue;
      const score = caseScore(s, spec);
      if (score === MIN_ROOMS * 2) return s;
      if (!best || score > caseScore(best, spec)) best = s;
    } catch {
      // try the next derived seed
    }
  }
  return best ?? generateScenario(seed, mode, profile, opts);
}
