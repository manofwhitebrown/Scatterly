import { ROOM_NAME } from '../content/items';
import { IMPLY, PREP } from '../content/phrases';
import { anySpot } from '../content/decor';
import { hashString } from './rng';
import type { Rng } from './rng';
import type { EveningStep, ItemId, RoomId, Spot, SpotId } from '../shared/types';
import type { Template } from '../content/templateKit';

export type SlotMap = Record<string, SpotId>;

function spotOf(slots: SlotMap, name: string): Spot {
  const id = slots[name];
  const spot = id ? anySpot(id) : undefined;
  if (!spot) throw new Error(`unknown slot ${name}`);
  return spot;
}

/** Plain, truthful wording: "on the coffee table". */
export function plainWhere(spot: Spot): string {
  return `${PREP[spot.kind]} the ${spot.label.toLowerCase()}`;
}

/** Difficulty 1 names the spot; harder days only hint at what kind of place it is. */
export function whereText(spot: Spot, difficulty: number): string {
  if (difficulty <= 1) return plainWhere(spot);
  const options = IMPLY[spot.kind];
  return options[hashString(spot.id) % options.length] ?? plainWhere(spot);
}

export function expand(text: string, slots: SlotMap, difficulty: number): string {
  return text.replace(/\{(where|w|s|r):([A-Za-z0-9]+)\}/g, (_m, kind: string, name: string) => {
    const spot = spotOf(slots, name);
    if (kind === 'where') return whereText(spot, difficulty);
    if (kind === 'w') return plainWhere(spot);
    if (kind === 's') return spot.label.toLowerCase();
    return ROOM_NAME[spot.room].replace(/^the /, '');
  });
}

function clock(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h < 10 ? '0' : ''}${h}:${m < 10 ? '0' : ''}${m}`;
}

export interface Evening {
  steps: EveningStep[];
  placement: Partial<Record<ItemId, SpotId>>;
}

/**
 * Runs a template as a small state machine: the body walks between rooms and every
 * item's final location is whatever the LAST step involving it says. Nothing is random
 * about where things end up beyond the slot choices that drove the steps.
 */
export function simulateEvening(t: Template, slots: SlotMap, rng: Rng): Evening {
  const loc = new Map<ItemId, SpotId | 'carried'>();
  const steps: EveningStep[] = [];
  let body: RoomId = 'entrance';
  let mins = rng.int(17 * 60 + 30, 19 * 60 + 30);
  t.steps.forEach((def, i) => {
    const spot = def.slot ? spotOf(slots, def.slot) : undefined;
    const room: RoomId = spot ? spot.room : (def.room ?? body);
    body = room;
    if (def.item) loc.set(def.item, spot ? spot.id : 'carried');
    mins += i === 0 ? 0 : rng.int(4, 14);
    steps.push({
      n: i + 1, clock: clock(mins), verb: def.v, room,
      spotId: spot?.id, itemId: def.item, note: expand(def.note, slots, 1),
    });
  });
  const placement: Partial<Record<ItemId, SpotId>> = {};
  for (const [item, where] of loc) {
    if (where === 'carried') throw new Error(`${item} still carried at end of ${t.id}`);
    placement[item] = where;
  }
  return { steps, placement };
}
