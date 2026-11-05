import { anySpot } from '../content/decor';
import { ITEM_DEFS, ROOM_NAME } from '../content/items';
import { hashString } from './rng';
import { allSpots } from './progression';
import { nextMark } from './marks';
import type { MarkMap, SpotMark } from './marks';
import { ITEM_LABEL } from '../shared/types';
import type {
  Clue, GameMode, Gate, InspectOutcome, ItemId, PlayerProfile, RoomId, RunResult, Scenario, Spot, SpotId,
} from '../shared/types';

type EventName = 'clue' | 'found' | 'complete' | 'hint' | 'mark';
type Listener = (payload?: unknown) => void;

/** Everything a GameSession needs to continue where it stopped (JSON-safe). The scenario itself is regenerated, never stored. */
export interface SessionState {
  opened: SpotId[]; solved: SpotId[]; clues: string[]; taken: ItemId[];
  hints: Array<[ItemId, number]>; marks: Array<[SpotId, SpotMark]>; searches: number; hintsUsed: number;
}

const isStrArr = (v: unknown, max: number): v is string[] => Array.isArray(v) && v.length <= max && v.every((x) => typeof x === 'string');
const isCount = (v: unknown, max: number): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= max;
const distinct = (a: readonly string[]): boolean => new Set(a).size === a.length;

export interface HintResult { text: string; room?: RoomId; spotId?: SpotId }

const EMPTY_SPOTS: Spot[] = [];
const EMPTY_MSGS = [
  'Nothing here but dust and good intentions.',
  'Just a stray crumb. Nothing useful.',
  'Empty. Whatever you left, it was not here.',
  'You rummage thoroughly and find only regret.',
];
const GATE_MSGS: Partial<Record<Gate['kind'], string>> = {
  untangle: 'A knot of cords blocks the way. Untangle it first.',
  sort: 'It is jammed with odds and ends. Sort them out to get in.',
  word: 'It will not budge. There is a riddle to solve first.',
};

export class GameSession {
  readonly scenario: Scenario;
  readonly mode: GameMode;
  private readonly profile: PlayerProfile;
  private readonly spots: Map<SpotId, Spot>;
  private readonly opened = new Set<SpotId>();
  private readonly solvedGates = new Set<SpotId>();
  private readonly clueIds = new Set<string>();
  private readonly clueList: Clue[] = [];
  private readonly taken: ItemId[] = [];
  private readonly hintStage = new Map<ItemId, number>();
  private readonly byRoom = new Map<RoomId, Spot[]>();
  private readonly markMap = new Map<SpotId, SpotMark>();
  private readonly listeners = new Map<EventName, Set<Listener>>();
  private searches = 0;
  private hintsUsed = 0;
  private completeEmitted = false;

  constructor(scenario: Scenario, profile: PlayerProfile, mode: GameMode) {
    this.scenario = scenario;
    this.mode = mode;
    this.profile = profile;
    this.spots = new Map(allSpots(profile).filter((s) => profile.unlockedRooms.includes(s.room)).map((s) => [s.id, s]));
    for (const s of this.spots.values()) {
      const list = this.byRoom.get(s.room);
      if (list) list.push(s);
      else this.byRoom.set(s.room, [s]);
    }
  }

  /** Cached per room; callers must not mutate the returned array. */
  spotsIn(room: RoomId): Spot[] {
    return this.byRoom.get(room) ?? EMPTY_SPOTS;
  }

  /** Sets or clears (null) a note on an unsearched spot. Returns true if anything changed. */
  setMark(spotId: SpotId, mark: SpotMark | null): boolean {
    if (!this.spots.has(spotId) || this.opened.has(spotId)) return false;
    if (this.markMap.get(spotId) === (mark ?? undefined)) return false;
    if (mark === null) this.markMap.delete(spotId);
    else this.markMap.set(spotId, mark);
    this.emit('mark', { spotId, mark });
    return true;
  }

  /** Advances the mark on a spot through none -> ruledOut -> hunch -> none. */
  cycleMark(spotId: SpotId): SpotMark | null {
    const next = nextMark(this.markMap.get(spotId));
    this.setMark(spotId, next);
    return this.markMap.get(spotId) ?? null;
  }

  marks(): MarkMap {
    return this.markMap;
  }

  /** Found targets that were sitting at the player's chosen home spot for that item. */
  habitHits(): ItemId[] {
    const homes = this.profile.homeSpots;
    return this.found().filter((i) => homes[i] !== undefined && homes[i] === this.scenario.placement[i]);
  }

  isOpened(spotId: SpotId): boolean {
    return this.opened.has(spotId);
  }

  inspect(spotId: SpotId): InspectOutcome {
    const spot = this.spots.get(spotId);
    if (!spot) return { kind: 'empty', items: [], clues: [], message: 'There is nothing to inspect there.' };
    const gate = this.scenario.gates[spotId];
    if (gate && !this.solvedGates.has(spotId)) {
      return { kind: 'locked', items: [], clues: [], gate, message: GATE_MSGS[gate.kind] ?? 'It is locked. Solve the puzzle to open it.' };
    }
    if (!this.opened.has(spotId)) {
      this.opened.add(spotId);
      this.searches++;
      if (this.markMap.delete(spotId)) this.emit('mark', { spotId, mark: null });
    }
    const items = this.itemsAt(spotId);
    const clues = this.scenario.clues.filter((c) => c.spotId === spotId);
    for (const c of clues) {
      if (this.clueIds.has(c.id)) continue;
      this.clueIds.add(c.id);
      this.clueList.push(c);
      this.emit('clue', c);
    }
    if (items.length === 0 && clues.length === 0) {
      return { kind: 'empty', items, clues, message: EMPTY_MSGS[hashString(spotId) % EMPTY_MSGS.length] as string };
    }
    const parts: string[] = [];
    if (items.length > 0) parts.push(`You spot ${items.map((i) => ITEM_LABEL[i].toLowerCase()).join(' and ')}.`);
    if (clues.length > 0) parts.push(clues.length === 1 ? 'Something here might be a clue.' : 'A couple of things here look like clues.');
    return { kind: 'found', items, clues, message: parts.join(' ') };
  }

  solveGate(spotId: SpotId, skipped = false): void {
    if (!this.scenario.gates[spotId] || this.solvedGates.has(spotId)) return;
    this.solvedGates.add(spotId);
    if (skipped) this.hintsUsed++;
  }

  take(itemId: ItemId): boolean {
    const where = this.scenario.placement[itemId];
    if (!where || !this.opened.has(where) || this.taken.includes(itemId)) return false;
    this.taken.push(itemId);
    const isTarget = this.scenario.targets.includes(itemId);
    if (isTarget) {
      this.emit('found', itemId);
      if (this.isComplete() && !this.completeEmitted) {
        this.completeEmitted = true;
        this.emit('complete');
      }
    }
    return isTarget;
  }

  inventory(): ItemId[] {
    return this.taken.slice();
  }

  discoveredClues(): Clue[] {
    return this.clueList.slice();
  }

  found(): ItemId[] {
    return this.taken.filter((i) => this.scenario.targets.includes(i));
  }

  remainingTargets(): ItemId[] {
    return this.scenario.targets.filter((t) => !this.taken.includes(t));
  }

  hint(): HintResult | null {
    const remaining = this.remainingTargets();
    const first = remaining[0];
    if (!first) return null;
    const target = remaining.find((t) => (this.hintStage.get(t) ?? 0) < 2) ?? first;
    const stage = this.hintStage.get(target) ?? 0;
    const spotId = this.scenario.placement[target];
    const spot = spotId ? anySpot(spotId) : undefined;
    if (!spot) return null;
    const habit = this.scenario.clues.some((c) => c.id === `habit-${target}`);
    const def = ITEM_DEFS[target];
    let res: HintResult;
    if (stage === 0) {
      res = { text: def.roomHint.replace('{room}', ROOM_NAME[spot.room]), room: spot.room };
      if (!habit) this.hintsUsed++; // habit homes make the first nudge free
    } else {
      res = { text: def.spotHint.replace('{spot}', spot.label.toLowerCase()), room: spot.room, spotId: spot.id };
      this.hintsUsed++;
    }
    this.hintStage.set(target, stage + 1);
    this.emit('hint', res);
    return res;
  }

  isComplete(): boolean {
    return this.scenario.targets.every((t) => this.taken.includes(t));
  }

  finish(timeMs: number, timedOut: boolean): RunResult {
    const complete = this.isComplete() && !timedOut;
    const par = this.scenario.parSearches;
    let stars: 0 | 1 | 2 | 3 = 0;
    if (complete) {
      if (this.searches <= par * 1.25 && this.hintsUsed === 0) stars = 3;
      else if (this.searches <= par * 2 || this.hintsUsed <= 1) stars = 2;
      else stars = 1;
    }
    let coins = 10 + 15 * stars + 5 * this.scenario.difficulty;
    if (complete) coins += Math.min(10, this.profile.streak * 2);
    if (this.mode === 'rush' && complete && timeMs < this.scenario.timeLimitSec * 1000 * 0.8) {
      coins = Math.round(coins * 1.25);
    }
    return {
      scenarioId: this.scenario.id, mode: this.mode, targets: this.scenario.targets.slice(),
      found: this.found(), timeMs, searches: this.searches, hintsUsed: this.hintsUsed, timedOut,
      stars, coinsEarned: coins, habitHits: [], newAchievements: [], puzzleLog: [],
    };
  }

  /** Snapshot of the player's progress for Resume. */
  exportState(): SessionState {
    return {
      opened: [...this.opened], solved: [...this.solvedGates], clues: this.clueList.map((c) => c.id), taken: this.taken.slice(),
      hints: [...this.hintStage], marks: [...this.markMap], searches: this.searches, hintsUsed: this.hintsUsed,
    };
  }

  /**
   * Loads a state exported earlier into a FRESH session. All or nothing: anything that does not fit this scenario
   * (unknown ids, a taken item whose spot was never opened, a locked spot that was opened, bad counts) returns false
   * and leaves the session untouched.
   */
  importState(raw: unknown): boolean {
    if (this.opened.size > 0 || this.taken.length > 0 || this.clueList.length > 0 || this.solvedGates.size > 0 || this.searches > 0) return false;
    const st = raw as Partial<Record<keyof SessionState, unknown>> | null;
    if (!st || typeof st !== 'object') return false;
    const { opened, solved, clues, taken, hints, marks, searches, hintsUsed } = st;
    if (!isStrArr(opened, 400) || !isStrArr(solved, 400) || !isStrArr(clues, 400) || !isStrArr(taken, 100)) return false;
    if (!Array.isArray(hints) || hints.length > 20 || !Array.isArray(marks) || marks.length > 400) return false;
    if (!isCount(searches, 5000) || !isCount(hintsUsed, 500)) return false;
    if (![opened, solved, clues, taken].every(distinct)) return false;
    const gates = this.scenario.gates;
    if (!opened.every((id) => this.spots.has(id)) || searches < opened.length) return false;
    if (!solved.every((id) => gates[id] !== undefined)) return false;
    if (!opened.every((id) => gates[id] === undefined || solved.includes(id))) return false;
    const clueById = new Map(this.scenario.clues.map((c) => [c.id, c]));
    if (!clues.every((id) => { const c = clueById.get(id); return c !== undefined && opened.includes(c.spotId); })) return false;
    for (const c of this.scenario.clues) if (opened.includes(c.spotId) && !clues.includes(c.id)) return false;
    if (!taken.every((id) => { const w = this.scenario.placement[id as ItemId]; return w !== undefined && opened.includes(w); })) return false;
    const hintPairs: Array<[ItemId, number]> = [];
    for (const h of hints) {
      if (!Array.isArray(h) || h.length !== 2 || typeof h[0] !== 'string' || !this.scenario.targets.includes(h[0] as ItemId) || !isCount(h[1], 500)) return false;
      hintPairs.push([h[0] as ItemId, h[1]]);
    }
    const markPairs: Array<[SpotId, SpotMark]> = [];
    for (const m of marks) {
      if (!Array.isArray(m) || m.length !== 2 || typeof m[0] !== 'string' || !this.spots.has(m[0]) || opened.includes(m[0])) return false;
      if (m[1] !== 'ruledOut' && m[1] !== 'hunch') return false;
      markPairs.push([m[0], m[1]]);
    }
    for (const id of opened) this.opened.add(id);
    for (const id of solved) this.solvedGates.add(id);
    for (const id of clues) { this.clueIds.add(id); this.clueList.push(clueById.get(id) as Clue); }
    for (const id of taken) this.taken.push(id as ItemId);
    for (const [i, n] of hintPairs) this.hintStage.set(i, n);
    for (const [id, m] of markPairs) this.markMap.set(id, m);
    this.searches = searches;
    this.hintsUsed = hintsUsed;
    this.completeEmitted = this.isComplete();
    return true;
  }

  on(ev: EventName, cb: Listener): () => void {
    const set = this.listeners.get(ev) ?? new Set<Listener>();
    set.add(cb);
    this.listeners.set(ev, set);
    return () => { set.delete(cb); };
  }

  private emit(ev: EventName, payload?: unknown): void {
    this.listeners.get(ev)?.forEach((cb) => cb(payload));
  }

  private itemsAt(spotId: SpotId): ItemId[] {
    const out: ItemId[] = [];
    for (const [item, id] of Object.entries(this.scenario.placement) as Array<[ItemId, SpotId]>) {
      if (id === spotId && !this.taken.includes(item)) out.push(item);
    }
    return out;
  }
}
