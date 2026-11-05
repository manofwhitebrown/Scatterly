import pal from '../../docs/art/palette.json';

/**
 * Day/night light, AI-4 side. ONE multiply overlay (not part of the 64 colours) tinted with the key colour of the time of day,
 * plus the art that switches with it: lit/dark window glow and the baked shell variant. Pure data, no Phaser import.
 * AI-3 applies `LIGHT_KEYS[time]` as a multiply rectangle over the world in Overview and Focus (noon is white, i.e. no tint).
 */
export type LightTime = 'morning' | 'noon' | 'dusk' | 'night';
export const LIGHT_TIMES: readonly LightTime[] = ['morning', 'noon', 'dusk', 'night'];

const hex = (s: string): number => parseInt(s.slice(1), 16);
/** Multiply colours per time of day (palette.json > dayNight: morning #ffe9cf, noon #ffffff, dusk #ffc79a, night #6f7bb8). */
export const LIGHT_KEYS: Readonly<Record<LightTime, number>> = {
  morning: hex(pal.dayNight.morning), noon: hex(pal.dayNight.noon), dusk: hex(pal.dayNight.dusk), night: hex(pal.dayNight.night),
};

/** Baked shell variant for the room walls and floor: `shell/<room>/<part>`. Morning and noon share the day shell. */
export function shellPart(time: LightTime): 'full' | 'full_dusk' | 'full_night' {
  return time === 'dusk' ? 'full_dusk' : time === 'night' ? 'full_night' : 'full';
}

/** Window glow frame key (`fx/windowGlow/<n>`: 0 right wall day, 1 left wall day, 2 right wall night, 3 left wall night). Dusk uses the night glow. */
export function windowGlowKey(time: LightTime, leftWall: boolean): string {
  const night = time === 'dusk' || time === 'night';
  return `fx/windowGlow/${(night ? 2 : 0) + (leftWall ? 1 : 0)}`;
}

/** Lamps only glow once the light has dropped. */
export function lampsOn(time: LightTime): boolean {
  return time === 'dusk' || time === 'night';
}
