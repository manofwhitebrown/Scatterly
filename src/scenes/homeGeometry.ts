import pal from '../../docs/art/palette.json';
import { STAIRS } from '../content/world';
import type { RoomId } from '../shared/types';
import { FLOOR1_RAISE, HOUSE_WORLD, UNIT, inside, project } from './homeWorld';
import type { Pt } from './homeWorld';

/** Pure geometry and colour maths for the Home world. No Phaser import, so node tests can load it. */
export const hex = (s: string): number => parseInt(s.slice(1), 16);
export const R = pal.ramps;

/** Sky bands top to bottom (blue to peach at the horizon), all from the 64-colour palette. */
export const SKY_BANDS: readonly number[] = [R.sky[2], R.sky[3], R.sky[4], R.butter[4], R.rose[4], R.terracotta[4]].map(hex);
export const SKY_TIMES = { morning: hex(pal.dayNight.morning), noon: hex(pal.dayNight.noon), dusk: hex(pal.dayNight.dusk), night: hex(pal.dayNight.night) } as const;
export type SkyTime = keyof typeof SKY_TIMES;

export const SKY_W = 2600;
export const SKY_H = 1000;
export const PARALLAX = 0.3;
export const HORIZON = 620;
export const B = 6; // one backdrop pixel = 6 game px (2 art px), so it reads as chunky pixel art
export const CLOUDS = 6;

/** Ground-line height of a hill layer at column x (deterministic, smooth, no random). */
export function hillY(x: number, layer: 0 | 1): number {
  const a = layer === 0 ? 70 : 46;
  const f = layer === 0 ? 0.0042 : 0.0071;
  const ph = layer === 0 ? 1.3 : 4.1;
  return Math.round((HORIZON + 40 - a - Math.sin(x * f + ph) * a * 0.55 - Math.sin(x * f * 2.3 + ph) * a * 0.22) / B) * B;
}


export const STEPS = 6;
export const RISE_UNITS = FLOOR1_RAISE / UNIT;

export const slotOf = (room: RoomId) => HOUSE_WORLD.find((s) => s.room === room);
export const shade = (c: number, k: number): number => {
  const ch = (v: number): number => Math.min(255, Math.round(v * k));
  return (ch((c >> 16) & 255) << 16) | (ch((c >> 8) & 255) << 8) | ch(c & 255);
};

/** The staircase as a tappable shape: its silhouette hexagon in art px for the room that shows it (lower = steps, upper = stairwell). */
export function stairsPolygon(room: RoomId): Pt[] | undefined {
  const slot = slotOf(room);
  if (!slot || (room !== STAIRS.lower && room !== STAIRS.upper)) return undefined;
  const { x, y, w, d } = STAIRS.footprint;
  const raise = slot.floor * FLOOR1_RAISE;
  const H = room === STAIRS.lower ? RISE_UNITS : 1;
  const P = (gx: number, gy: number, z: number): Pt => project(slot.wx + gx, slot.wy + gy, raise + z * UNIT);
  return [P(x, y, H), P(x + w, y, H), P(x + w, y, 0), P(x + w, y + d, 0), P(x, y + d, 0), P(x, y + d, H)];
}

/** Where a tap in `room` leads when it hits the staircase, or undefined. */
export function stairsTarget(room: RoomId, art: Pt): RoomId | undefined {
  const poly = stairsPolygon(room);
  if (!poly || !inside(poly, art)) return undefined;
  return room === STAIRS.lower ? STAIRS.upper : STAIRS.lower;
}


/** Frame key for a window glow: 0 = day right wall, 1 = day left wall; 2 and 3 are the night versions. */
export const glowKey = (wall: 'L' | 'R', night: boolean): string => `fx/windowGlow/${(night ? 2 : 0) + (wall === 'R' ? 0 : 1)}`;
