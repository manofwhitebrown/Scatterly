export const GAME_W = 1280;
export const GAME_H = 720;
export const ROOM_ORDER = ['entrance', 'living', 'kitchen', 'bedroom', 'bathroom'] as const;
export type RoomId = (typeof ROOM_ORDER)[number];
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
export type PuzzleKind = 'untangle' | 'sort' | 'word';
export type GameMode = 'rush' | 'relaxed' | 'daily';
export type Difficulty = 1 | 2 | 3;
export type SpotAction = 'open' | 'lift' | 'search' | 'peek'; // how the interaction animates

export interface Spot {
  id: SpotId; room: RoomId; kind: SpotKind; label: string;
  x: number; y: number; w: number; h: number;
  action: SpotAction;
  capacity: number;          // max items it can hold
  plausible: ItemId[];       // items that believably end up here
}
export interface Gate { kind: PuzzleKind; difficulty: Difficulty; payload?: string; context?: string }
export type ClueIcon = 'receipt' | 'note' | 'photo' | 'ticket' | 'bagTag' | 'mug' | 'stain' | 'wrapper' | 'text' | 'laundry';
export interface ClueLink { spotId?: SpotId; room?: RoomId; item?: ItemId; strength: 'weak' | 'strong' }
export interface Clue { id: string; spotId: SpotId; title: string; text: string; icon: ClueIcon; links: ClueLink[] }

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
export const SAVE_VERSION = 2;
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
}
export interface PlayerProfile {
  version: 2; day: number; coins: number; streak: number; lastDailyDate: string | null;
  unlockedRooms: RoomId[];                     // default: entrance, living, kitchen, bedroom
  owned: string[];                             // DecorDef ids
  homeSpots: Partial<Record<ItemId, SpotId>>;  // dedicated places chosen by player
  bestStars: Record<string, 0 | 1 | 2 | 3>;    // by scenario id
  tutorialDone: boolean;
  stats: ProfileStats; achievements: string[]; weekMorning: number; weekStars: number;
  settings: { sfx: boolean; music: boolean; vibration: boolean; lowFx: boolean; reducedMotion: boolean };
}
export interface DecorDef {
  id: string; name: string; room: RoomId; price: number; unlockDay: number;
  kind: 'cosmetic' | 'storage';
  x: number; y: number; w: number; h: number; // where it is drawn in the room (cosmetic: wall/corner; storage: becomes a Spot)
  spotKind?: SpotKind;                         // storage only: Spot added to house
  benefit?: string;                            // storage only: player-facing text, e.g. 'Keys left near the door are easier to find'
}
export interface DecorView { def: DecorDef; owned: boolean; canBuy: boolean; locked: boolean }

export interface PuzzleRequest { kind: PuzzleKind; seed: number; difficulty: Difficulty; payload?: string; context?: string }
export interface PuzzleResult { solved: boolean; skipped: boolean; ms: number }
export interface PuzzleLaunchData { req: PuzzleRequest; onDone: (r: PuzzleResult) => void }
export interface RoomSceneData { mode: GameMode; seed?: number }
export interface ResultSceneData { result: RunResult; scenario: Scenario }

export const SCENE = {
  Boot: 'Boot', Menu: 'Menu', ModeSelect: 'ModeSelect', Room: 'Room', Result: 'Result',
  Settings: 'Settings', Organise: 'Organise', Journal: 'Journal',
} as const;
export const PUZZLE_SCENE: Record<PuzzleKind, string> = {
  untangle: 'PuzzleUntangle', sort: 'PuzzleSort', word: 'PuzzleWord',
};
export const tex = {
  room: (r: RoomId) => `room_${r}`,
  spot: (k: SpotKind, open = false) => (open ? `spot_${k}_open` : `spot_${k}`),
  item: (i: ItemId) => `item_${i}`,
  icon: (c: ClueIcon) => `icon_${c}`,
  decor: (id: string) => `decor_${id}`,
  mark: (m: SpotMark) => `mark_${m}`,
  fx: (n: 'dot' | 'star' | 'ring' | 'confetti' | 'mote') => `fx_${n}`,
};
