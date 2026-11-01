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

export interface HintResult { text: string; room?: RoomId; spotId?: SpotId }

const EMPTY_SPOTS: Spot[] = [];
const EMPTY_MSGS = [
  'Nothing here but dust and good intentions.',
  'Just a stray crumb. Nothing useful.',
  'Empty. Whatever you left, it was not here.',
  'You rummage thoroughly and find only regret.',
];
const GATE_MSGS: Record<Gate['kind'], string> = {
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
      return { kind: 'locked', items: [], clues: [], gate, message: GATE_MSGS[gate.kind] };
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
      stars, coinsEarned: coins,
    };
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
