import type { FactKey } from './facts';
import type {
  ClueIcon, Difficulty, EveningVerb, ItemId, PuzzleKind, RoomId, SpotAction,
} from '../shared/types';

/** A named spot choice. Pool entries: spot id, 'kind:<SpotKind>' or 'room:<RoomId>'. */
export interface SlotDef {
  pool: string[];
  /** Items that end up here; the chosen spot must list them all as plausible. */
  items?: ItemId[];
  /** Restrict to these interaction types (used to keep entry clues on easy surfaces). */
  acts?: SpotAction[];
  /** If the player set a home spot for this item, the evening may use it instead. */
  habit?: ItemId;
}

export interface StepDef {
  v: EveningVerb;
  slot?: string;
  room?: RoomId;
  item?: ItemId;
  /** Tokens: {w:slot} "on the table", {s:slot} "table", {r:slot} room name. */
  note: string;
}

export interface LinkDef {
  slot?: string;
  roomOf?: string;
  room?: RoomId;
  item?: ItemId;
  s: 'weak' | 'strong';
}

export interface ClueDef {
  slot: string;
  icon: ClueIcon;
  title: string;
  /** Extra token {where:slot}: plain spot name on difficulty 1, an oblique hint above. */
  text: string;
  links: LinkDef[];
  /** Fact keys rolled per seed; the text must contain a matching {fact:key} token for each. */
  facts?: FactKey[];
}

export interface Template {
  id: string;
  title: string;
  intro: string;
  base: Difficulty;
  start: RoomId;
  needs?: RoomId[];
  /** Ordered by importance; difficulty decides how many are required. */
  targets: ItemId[];
  slots: Record<string, SlotDef>;
  steps: StepDef[];
  clues: ClueDef[];
  gates?: PuzzleKind[];
}

/** Entry-clue slot: an easy surface in the starting room. */
export const entry = (room: RoomId = 'bedroom'): SlotDef => ({ pool: [`room:${room}`], acts: ['peek', 'lift'] });
export const strong = (slot: string, item: ItemId): LinkDef => ({ slot, item, s: 'strong' });
export const weak = (slot: string, item: ItemId): LinkDef => ({ slot, item, s: 'weak' });
export const weakRoom = (slot: string, item: ItemId): LinkDef => ({ roomOf: slot, item, s: 'weak' });
