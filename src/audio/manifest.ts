/** What audio exists and how it loads. Pure data: no AudioContext, safe to import from tests and tools.
 *  Files live in `public/audio/` (made by `tools/audio/render.py`); a group is one lazy download, never boot payload. */
export const VARIANTS = 3;

export type SoundGroup = 'core' | 'house' | 'puzzle' | 'result' | 'cat';

/** Sound effects by group. Each name has `sfx_<name>_1..3.ogg`. `core` is fetched right after the first tap, the rest on demand. */
export const SFX_GROUPS: Record<SoundGroup, readonly string[]> = {
  core: ['click', 'tap', 'open', 'close', 'ui_back', 'ui_toggle', 'ui_slider', 'swoosh', 'pop', 'snap', 'zoom_in', 'zoom_out', 'tick',
    'hint', 'clue', 'error', 'mark_ruled_out', 'mark_hunch', 'clue_note', 'item_take', 'found', 'success', 'unlock', 'coin', 'bell'],
  house: ['drawer', 'drawer_close', 'door', 'door_close', 'lock', 'lock_open', 'lock_fail', 'key_jingle', 'keys', 'cupboard', 'fridge_open',
    'fridge_close', 'tap_water', 'kettle_click', 'cushion', 'wardrobe', 'hanger', 'bag_zip', 'shoe_drop', 'switch_lamp', 'tv_on',
    'charger_plug', 'bin_lid', 'basket_rustle', 'rug_flap', 'paper', 'ceramic', 'step', 'step_stairs', 'stairs'],
  puzzle: ['puzzle_ok', 'puzzle_wrong', 'puzzle_tick', 'puzzle_dial', 'puzzle_slide', 'puzzle_flip', 'puzzle_gear', 'puzzle_pipe', 'puzzle_mirror', 'timer_urgent'],
  result: ['unlock_room', 'coin_spend', 'coin_tick', 'star', 'star_stamp', 'win', 'fanfare', 'lose'],
  cat: ['meow', 'meow2', 'cat_happy', 'purr'],
};

export const MUSIC_TRACKS = ['morning', 'lofi_a', 'lofi_b', 'puzzle', 'result'] as const;
export type MusicTrack = (typeof MUSIC_TRACKS)[number];
/** Extra music files: the Rush tension layer (loop) and the 6 s result sting (one shot). */
export const TENSION_FILE = 'music_rush_tension';
export const STING_FILE = 'music_result_sting';

export const AMBIENCE_LOOPS = ['rain', 'birds', 'kitchen', 'clock', 'night', 'fireplace'] as const;
export type AmbienceLoop = (typeof AMBIENCE_LOOPS)[number];

/** Loops under each room (at most two), and how loud each sits (the files are already at -26 LUFS). `null` = the house from outside. */
export const ROOM_AMBIENCE: Record<string, readonly AmbienceLoop[]> = {
  overview: ['birds'], entrance: ['birds'], living: ['clock', 'fireplace'], kitchen: ['kitchen'], bedroom: ['night'], bathroom: ['rain'], study: ['clock'],
  // legacy chill beds
  rain: ['rain'], birds: ['birds'], fire: ['fireplace'], night: ['night'],
};
export const AMBIENCE_LEVEL: Record<AmbienceLoop, number> = { rain: 0.9, birds: 1.0, kitchen: 0.9, clock: 0.8, night: 1.0, fireplace: 0.8 };

/** Names that take the music down for a moment (seconds held) so they are heard. */
export const DUCKS: Readonly<Record<string, number>> = { win: 1.4, fanfare: 1.6, star_stamp: 0.9, unlock_room: 1.2, found: 0.7, lose: 1.2 };

/** Names that are interface sounds (own bus, never ducked). */
export const UI_NAMES: ReadonlySet<string> = new Set(['click', 'tap', 'open', 'close', 'ui_back', 'ui_toggle', 'ui_slider', 'swoosh', 'pop', 'snap', 'zoom_in', 'zoom_out', 'tick']);

export const ALL_SFX: readonly string[] = Object.values(SFX_GROUPS).flat();
export const sfxFile = (name: string, n: number): string => `sfx_${name}_${n}`;
export const musicFile = (t: MusicTrack): string => `music_${t}`;
export const ambFile = (a: AmbienceLoop): string => `amb_${a}`;

export function groupOf(name: string): SoundGroup | null {
  for (const g of Object.keys(SFX_GROUPS) as SoundGroup[]) if (SFX_GROUPS[g].includes(name)) return g;
  return null;
}

/** Every file name (no extension) that must exist in public/audio. */
export function allFiles(): string[] {
  const out: string[] = [];
  for (const n of ALL_SFX) for (let v = 1; v <= VARIANTS; v++) out.push(sfxFile(n, v));
  for (const t of MUSIC_TRACKS) out.push(musicFile(t));
  out.push(TENSION_FILE, STING_FILE);
  for (const a of AMBIENCE_LOOPS) out.push(ambFile(a));
  return out;
}

export const AUDIO_LIMIT_BYTES = 8 * 1024 * 1024;
