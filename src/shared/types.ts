import type { SessionSnapshot } from '../logic/snapshot';

export const GAME_W = 1280;
export const GAME_H = 720;
/** Ground floor: entrance, living, kitchen, laundry. Upper floor: bedroom, bathroom, study, balcony. Garden outside. */
export const ROOM_ORDER = [
  'entrance', 'living', 'kitchen', 'laundry', 'bedroom', 'bathroom', 'study', 'balcony', 'garden',
] as const;
export type RoomId = (typeof ROOM_ORDER)[number];
/** Rooms that have layouts and art today (Phase 3 content). Removed when the new rooms land and the old views go. */
export const LEGACY_ROOMS = ['entrance', 'living', 'kitchen', 'bedroom', 'bathroom'] as const;
export type LegacyRoomId = (typeof LEGACY_ROOMS)[number];
/** Day (profile.day) on which each room becomes available. */
export const ROOM_UNLOCK_DAY: Record<RoomId, number> = {
  entrance: 1, living: 1, kitchen: 1, bedroom: 1, bathroom: 6, laundry: 9, study: 12, balcony: 16, garden: 20,
};
export const ITEM_IDS = ['keys', 'wallet', 'phone', 'officeId', 'shoes', 'glasses', 'earbuds', 'bag'] as const;
export type ItemId = (typeof ITEM_IDS)[number];
export const ITEM_LABEL: Record<ItemId, string> = {
  keys: 'Car keys', wallet: 'Wallet', phone: 'Phone', officeId: 'Office ID',
  shoes: 'Work shoes', glasses: 'Glasses', earbuds: 'Earbuds', bag: 'Work bag',
};
export const SPOT_SIZE = {
  drawer: { w: 160, h: 90 }, cabinet: { w: 180, h: 200 }, fridge: { w: 160, h: 300 },
  sofa: { w: 360, h: 160 }, table: { w: 300, h: 140 }, shelf: { w: 220, h: 180 },
  bed: { w: 420, h: 220 }, wardrobe: { w: 200, h: 320 }, jacket: { w: 90, h: 200 },
  bagSpot: { w: 110, h: 130 }, basket: { w: 120, h: 140 }, keyHook: { w: 120, h: 80 },
  shoeRack: { w: 220, h: 110 }, sink: { w: 200, h: 110 }, tv: { w: 260, h: 170 },
  charger: { w: 90, h: 60 }, rug: { w: 300, h: 180 }, plant: { w: 100, h: 200 },
  papers: { w: 120, h: 80 }, bin: { w: 80, h: 100 },
} as const;
export type SpotKind = keyof typeof SPOT_SIZE;
export type SpotId = string; // 'room.name' e.g. 'kitchen.fridge'
export const PUZZLE_KINDS = [
  'untangle', 'sort', 'word', 'code', 'target', 'sequence', 'lights', 'slide', 'pipes',
  'mastermind', 'memory', 'sudoku', 'kenken', 'balance', 'dial', 'tangram', 'cipher', 'logic', 'nonogram',
  'mirror', 'jigsaw', 'flow', 'gears',
] as const;
export type PuzzleKind = (typeof PUZZLE_KINDS)[number];
/** Puzzle level 1-5 (Scenario.difficulty stays 1-3). Levels 4-5 are gated by day in the generator. */
export type PuzzleDifficulty = 1 | 2 | 3 | 4 | 5;

/** Pixel-art scale: 1 art pixel = ART.px game pixels. A tile is tileArtW x tileArtH art pixels (Art Bible v1). */
export const ART = { px: 3, tileArtW: 32, tileArtH: 16 } as const;
/** Isometric grid in game px: tileW = 32*3, tileH = 16*3, one height unit = 4 art px = 12 game px. */
export const ISO = { tileW: 96, tileH: 48, unitH: 12 } as const;
/** Phase 3 grid, kept only for the old code-drawn iso kit until the parity flip deletes it. */
export const ISO_LEGACY = { tileW: 64, tileH: 32, unitH: 16 } as const;
/** Footprint on the iso grid in cells; h and gz are in height units (wall mounts use gz). */
export interface IsoPlacement { gx: number; gy: number; w: number; d: number; h: number; gz?: number }
export interface Door { to: RoomId; wall: 'left' | 'right'; at: number }
export interface RoomLayout {
  id: RoomId; cols: number; rows: number; doors: Door[];
  windows: Array<{ wall: 'left' | 'right'; at: number; w: number }>; theme: string;
}
/** Old dollhouse tile placement (menu backdrop and overlay). */
export interface DollhouseSlot { room: RoomId; floor: 0 | 1; col: number; row: number }
/** World placement on the one global iso grid: (wx, wy) is the world cell of the room's back corner. */
export interface HouseSlot { room: RoomId; floor: 0 | 1; wx: number; wy: number }
export type GameMode = 'rush' | 'relaxed' | 'daily';
export type Difficulty = 1 | 2 | 3;
export type SpotAction = 'open' | 'lift' | 'search' | 'peek'; // how the interaction animates

export interface Spot {
  id: SpotId; room: RoomId; kind: SpotKind; label: string;
  x: number; y: number; w: number; h: number;
  iso: IsoPlacement;         // isometric placement (x,y,w,h stay until the Phase 2 cleanup)
  lockable: boolean;         // closed containers only: may be locked by a puzzle gate
  action: SpotAction;
  capacity: number;          // max items it can hold
  plausible: ItemId[];       // items that believably end up here
}
export interface Gate {
  kind: PuzzleKind; difficulty: Difficulty; payload?: string; context?: string; needs?: string[];
  chain?: PuzzleKind[];      // compound gate: these stages are solved in order after `kind`
}
export type ClueIcon = 'receipt' | 'note' | 'photo' | 'ticket' | 'bagTag' | 'mug' | 'stain' | 'wrapper' | 'text' | 'laundry';
export interface ClueLink { spotId?: SpotId; room?: RoomId; item?: ItemId; strength: 'weak' | 'strong' }
export interface ClueFact { key: string; label: string; value: number }
export interface Clue {
  id: string; spotId: SpotId; title: string; text: string; icon: ClueIcon; links: ClueLink[];
  facts?: ClueFact[];        // numbers that feed code locks
}

export type EveningVerb = 'arrive' | 'drop' | 'use' | 'charge' | 'cook' | 'shop' | 'change' | 'pocket' | 'tidy' | 'sleep';
export interface EveningStep { n: number; clock: string; verb: EveningVerb; room: RoomId; spotId?: SpotId; itemId?: ItemId; note: string }

export interface Scenario {
  id: string; seed: number; title: string; intro: string; difficulty: Difficulty;
  startRoom: RoomId;
  evening: EveningStep[];                      // ground truth, shown on Result screen as "what happened"
  targets: ItemId[];                           // 2–5 items the player must find
  placement: Partial<Record<ItemId, SpotId>>;  // final location of EVERY item present (targets + decoys)
  clues: Clue[];
  gates: Record<SpotId, Gate>;
  timeLimitSec: number;                        // used in 'rush'; ignored otherwise
  parSearches: number;                         // searches an ideal player needs
}
export interface InspectOutcome {
  kind: 'empty' | 'found' | 'locked';
  items: ItemId[]; clues: Clue[]; gate?: Gate; message: string;
}
export const SAVE_VERSION = 4;
export type SpotMark = 'ruledOut' | 'hunch';
export type FxName = 'tap' | 'open' | 'empty' | 'found' | 'take' | 'clue' | 'hint' | 'room'
  | 'urgent' | 'win' | 'lose' | 'coin' | 'star' | 'buy' | 'unlock' | 'puzzleOk';
export interface ProfileStats {
  mornings: number; perfect: number; itemsFound: number; hintsUsed: number;
  puzzlesSolved: number; bestStreak: number; fastestMs: number | null;
}
export interface RunResult {
  scenarioId: string; mode: GameMode; targets: ItemId[]; found: ItemId[];
  timeMs: number; searches: number; hintsUsed: number; timedOut: boolean;
  stars: 0 | 1 | 2 | 3; coinsEarned: number;
  habitHits: ItemId[]; newAchievements: string[];
  puzzleLog: Array<{ kind: PuzzleKind; solved: boolean; skipped: boolean; ms: number }>;
}
export interface PuzzleStat { solved: number; skipped: number; bestMs: number | null; seen: boolean }
export type Quality = 'auto' | 'low' | 'high';
export type SessionLength = 'short' | 'standard' | 'long';
export interface PlacedPiece { id: string; gx: number; gy: number; rot: 0 | 1 | 2 | 3; flip: boolean }
export interface ProfileSettings {
  sfx: boolean; music: boolean; vibration: boolean; lowFx: boolean; reducedMotion: boolean;
  quality: Quality; musicVol: number; sfxVol: number; ambienceVol: number; ambience: string;
  matchClock: boolean; walkAnim: boolean; sessionLength: SessionLength;
  /** Easy mode: draw padlock icons on gated pieces before the first tap (default off). */
  showLockIcons: boolean;
}
/** One beat of the Evening Replay. `icon` is an art manifest key (`icon/<item>` or `icon/<verb>`). */
export interface ReplayStep {
  t: number; room: RoomId; spotId?: SpotId; verb: EveningVerb; icon: string;
  itemId?: ItemId;           // set when an item is involved
  found?: boolean;           // true when this step puts down an item the player found this morning
}
export interface PlayerProfile {
  version: 4; day: number; coins: number; streak: number; lastDailyDate: string | null;
  unlockedRooms: RoomId[];                     // default: entrance, living, kitchen, bedroom
  owned: string[];                             // DecorDef ids
  homeSpots: Partial<Record<ItemId, SpotId>>;  // dedicated places chosen by player
  bestStars: Record<string, 0 | 1 | 2 | 3>;    // by scenario id
  tutorialDone: boolean;
  stats: ProfileStats; achievements: string[]; weekMorning: number; weekStars: number;
  settings: ProfileSettings;
  puzzles: Record<string, PuzzleStat>;         // mastery per PuzzleKind
  builder: Record<string, PlacedPiece[]>;      // House Builder placements per room
  themes: Record<string, { wall: string; floor: string }>;
  pet: { name: string; outfit: string | null; treats: number };
  chill: { minutes: number; sessions: number };
  collection: string[];
  resume: SessionSnapshot | null;              // mid-case autosave
}
export interface DecorDef {
  id: string; name: string; room: RoomId; price: number; unlockDay: number;
  kind: 'cosmetic' | 'storage';
  iso: IsoPlacement;                          // placement on the iso grid
  x: number; y: number; w: number; h: number; // where it is drawn in the room (cosmetic: wall/corner; storage: becomes a Spot)
  spotKind?: SpotKind;                         // storage only: Spot added to house
  benefit?: string;                            // storage only: player-facing text, e.g. 'Keys left near the door are easier to find'
}
export interface DecorView { def: DecorDef; owned: boolean; canBuy: boolean; locked: boolean }

export interface PuzzleRequest {
  kind: PuzzleKind; seed: number; difficulty: Difficulty; payload?: string; context?: string;
  level?: PuzzleDifficulty; // 1-5; defaults to `difficulty` when absent
}
export interface PuzzleResult { solved: boolean; skipped: boolean; ms: number; hints?: number }
export interface PuzzleLaunchData { req: PuzzleRequest; notes: Clue[]; onDone: (r: PuzzleResult) => void }
export interface RoomSceneData { mode: GameMode; seed?: number; resume?: boolean }
export interface ResultSceneData { result: RunResult; scenario: Scenario }

export const SCENE = {
  Boot: 'Boot', Menu: 'Menu', ModeSelect: 'ModeSelect', Room: 'Room', Result: 'Result',
  Settings: 'Settings', Organise: 'Organise', Journal: 'Journal', House: 'House',
  Home: 'Home', Chill: 'Chill', Builder: 'Builder',
} as const;
export const PUZZLE_SCENE: Record<PuzzleKind, string> = {
  untangle: 'PuzzleUntangle', sort: 'PuzzleSort', word: 'PuzzleWord', code: 'PuzzleCode', target: 'PuzzleTarget',
  sequence: 'PuzzleSequence', lights: 'PuzzleLights', slide: 'PuzzleSlide', pipes: 'PuzzlePipes',
  mastermind: 'PuzzleMastermind', memory: 'PuzzleMemory', sudoku: 'PuzzleSudoku', kenken: 'PuzzleKenken',
  balance: 'PuzzleBalance', dial: 'PuzzleDial', tangram: 'PuzzleTangram', cipher: 'PuzzleCipher',
  logic: 'PuzzleLogic', nonogram: 'PuzzleNonogram',
  mirror: 'PuzzleMirror', jigsaw: 'PuzzleJigsaw', flow: 'PuzzleFlow', gears: 'PuzzleGears',
};
export const tex = {
  room: (r: RoomId) => `room_${r}`,
  spot: (k: SpotKind, open = false) => (open ? `spot_${k}_open` : `spot_${k}`),
  item: (i: ItemId) => `item_${i}`,
  icon: (c: ClueIcon) => `icon_${c}`,
  decor: (id: string) => `decor_${id}`,
  isoSpot: (k: SpotKind, open = false) => (open ? `iso_spot_${k}_open` : `iso_spot_${k}`),
  isoShell: (r: RoomId) => `iso_shell_${r}`,
  isoProp: (id: string) => `iso_prop_${id}`,
  mark: (m: SpotMark) => `mark_${m}`,
  fx: (n: 'dot' | 'star' | 'ring' | 'confetti' | 'mote') => `fx_${n}`,
};
