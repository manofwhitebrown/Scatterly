/**
 * Full-width layout. Height is fixed at 720 game px; the logical width follows the window aspect,
 * clamped to 16:9 .. 21:9 (1280..1680), so phones fill the screen instead of showing side bars.
 * `LAYOUT` is one shared object that is updated in place, so every importer always sees the current size.
 */
export const BASE_W = 1280;
export const BASE_H = 720;
export const MAX_W = 1680;

export interface Layout { w: number; h: number; safeX: number }

/** Pure: the layout for a window of the given size (CSS px). Bad input falls back to 16:9. */
export function computeLayout(winW: number, winH: number): Layout {
  const aspect = winW > 0 && winH > 0 ? winW / winH : BASE_W / BASE_H;
  const w = Math.round(Math.min(MAX_W, Math.max(BASE_W, aspect * BASE_H)));
  return { w, h: BASE_H, safeX: (w - BASE_W) / 2 };
}

export const LAYOUT: Layout = { w: BASE_W, h: BASE_H, safeX: 0 };

/** Scenes that lay themselves out on the full `LAYOUT.w` width. Every other scene is a 1280 layout and gets centred by `safeX`. */
export const FULL_WIDTH_SCENES: ReadonlySet<string> = new Set(['Boot', 'Home']);

/** The colour behind the game and around it (HUD teal), so no purple bar ever shows. */
export const BACKDROP = '#1f3a40';

/** Recompute from the window and update LAYOUT in place. Returns true when the width changed. */
export function applyLayout(winW: number, winH: number): boolean {
  const next = computeLayout(winW, winH);
  const changed = next.w !== LAYOUT.w;
  LAYOUT.w = next.w;
  LAYOUT.h = next.h;
  LAYOUT.safeX = next.safeX;
  return changed;
}

/** True when the window is taller than wide (the game needs the "turn your phone" overlay). */
export function isPortrait(winW: number, winH: number): boolean {
  return winH > winW;
}
