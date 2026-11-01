import { STORAGE_SPOTS, anySpot } from '../content/decor';
import { WORD_GATES } from '../content/phrases';
import { TEMPLATES } from '../content/templates';
import type { SlotDef, Template } from '../content/templates';
import type {
  Difficulty, Gate, GameMode, ItemId, PlayerProfile, PuzzleKind, RoomId, Scenario, Spot, SpotId,
} from '../shared/types';
import { buildClues } from './clues';
import { expand, simulateEvening } from './evening';
import type { SlotMap } from './evening';
import { allSpots } from './progression';
import { Rng, deriveSeed } from './rng';
import { solveScenario } from './solver';
import { gateCosts, idealSearchCount, validateScenario } from './validator';

const MODE_SALT: Record<GameMode, number> = { rush: 11, relaxed: 23, daily: 37 };
const MAX_ATTEMPTS = 40;

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

function resolveSlots(t: Template, w: World, rng: Rng): Resolved | null {
  const slots: SlotMap = {};
  const habit = new Map<ItemId, SpotId>();
  const used = new Set<SpotId>();
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
      chosen = rng.pick(cands);
    }
    used.add(chosen.id);
    slots[name] = chosen.id;
  }
  return { slots, habit };
}

const GATE_KINDS: Record<PuzzleKind, string[]> = {
  untangle: ['charger', 'drawer', 'bagSpot', 'jacket', 'basket'],
  sort: ['drawer', 'cabinet', 'basket', 'papers', 'wardrobe', 'bin'],
  word: ['drawer', 'cabinet', 'wardrobe', 'fridge', 'papers'],
};

function makeGate(kind: PuzzleKind, difficulty: Difficulty, rng: Rng): Gate {
  if (kind === 'word') {
    const [word, hint] = rng.pick(WORD_GATES);
    return { kind, difficulty, payload: word, context: hint };
  }
  if (kind === 'untangle') return { kind, difficulty, payload: 'cables', context: 'A knot of cords blocks the way.' };
  return { kind, difficulty, payload: 'colour', context: 'It is crammed with odds and ends.' };
}

function addGates(s: Scenario, t: Template, rng: Rng): void {
  const wanted = s.difficulty - 1;
  if (wanted <= 0) return;
  const kinds = t.gates ?? (['untangle', 'sort', 'word'] as PuzzleKind[]);
  const candidates = rng.shuffle(s.targets.map((i) => s.placement[i]).filter((x): x is SpotId => !!x));
  for (const id of candidates) {
    if (Object.keys(s.gates).length >= wanted) break;
    const sp = anySpot(id);
    if (!sp || sp.room === s.startRoom || s.gates[id]) continue;
    const ok = kinds.filter((k) => GATE_KINDS[k].includes(sp.kind));
    if (ok.length === 0) continue;
    s.gates[id] = makeGate(rng.pick(ok), s.difficulty, rng);
    const costs = gateCosts(s);
    const bad = s.targets.some((i) => {
      const p = s.placement[i];
      return p !== undefined && (costs.get(p) ?? 0) > 1;
    });
    if (bad) delete s.gates[id];
  }
}

function attempt(seed: number, mode: GameMode, w: World, salt: number): Scenario {
  const rng = new Rng(deriveSeed(seed, salt * 101 + MODE_SALT[mode]));
  const difficulty: Difficulty = mode === 'daily' ? 2 : pickDifficulty(w.profile.day, rng);
  const eligible = TEMPLATES.filter((t) => t.base <= difficulty && w.unlocked.has(t.start)
    && (t.needs ?? []).every((r) => w.unlocked.has(r)));
  const t = rng.weighted(eligible.map((x) => [x, x.base === difficulty ? 3 : x.base === difficulty - 1 ? 2 : 1] as const));
  const more = difficulty === 1 ? 0 : rng.chance(0.5) ? 1 : 0;
  const count = Math.min(t.targets.length, 2 + (difficulty === 3 ? 1 : 0) + more);
  const targets = t.targets.slice(0, count);
  const resolved = resolveSlots(t, w, rng);
  if (!resolved) throw new Error('slots unresolved');
  const { steps, placement } = simulateEvening(t, resolved.slots, rng);
  const habit = new Map<ItemId, SpotId>();
  for (const [item, id] of resolved.habit) if (targets.includes(item)) habit.set(item, id);
  const clues = buildClues(t, resolved.slots, targets, habit, difficulty);
  const s: Scenario = {
    id: `${mode}-${seed}`, seed, title: t.title, intro: expand(t.intro, resolved.slots, 1), difficulty,
    startRoom: t.start, evening: steps, targets, placement, clues, gates: {},
    timeLimitSec: Math.max(60, Math.round((25 * targets.length + 20 * difficulty) / 5) * 5), parSearches: 0,
  };
  addGates(s, t, rng);
  s.parSearches = idealSearchCount(s) + 2;
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

/** Deterministic per (seed, mode, relevant profile). Retries with derived seeds until valid. */
export function generateScenario(seed: number, mode: GameMode, profile: PlayerProfile): Scenario {
  const w = makeWorld(profile);
  for (let salt = 0; salt < MAX_ATTEMPTS; salt++) {
    try {
      const s = attempt(seed, mode, w, salt);
      if (validateScenario(s, profile).length === 0 && solveScenario(s).ok) return s;
    } catch {
      // try the next derived seed
    }
  }
  return fallbackScenario(seed, mode);
}
