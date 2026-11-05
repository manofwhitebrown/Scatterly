/**
 * The fixed HUD grid for the Home world. Pure maths (no Phaser) so node tests can prove that nothing overlaps.
 * All rects are top-left x, y plus w, h in game px. Height is always 720; the width is `LAYOUT.w` (1280 .. 1680).
 *
 *   top-left     pause, house            top-centre  progress pill (+ Rush timer under it)       top-right  Clues, Hint
 *   bottom-left  "show tappables" chip   bottom-centre item tray                                  bottom-right  room buttons (a column)
 */
export interface Box { x: number; y: number; w: number; h: number }

export const HUD_EDGE = 24;
export const HUD_BTN = 96;
export const HUD_GAP = 16;
export const HUD_WIDE = 132; // Clues / Hint
export const NAV_W = 168;
export const PILL_W = 600;
export const PILL_H = 56;
export const TRAY_STEP = 84;
export const TRAY_H = 80;

export interface HudBoxes {
  pause: Box;
  house: Box;
  clues: Box;
  hint: Box;
  strip: Box;
  timer: Box;
  show: Box;
  tray: Box;
  nav: Box[];
}

/** Rect of the item tray for `trayCount` items (zero width when there are none). */
export function trayBox(w: number, h: number, trayCount: number): Box {
  const tw = trayCount > 0 ? trayCount * TRAY_STEP + 24 : 0;
  return { x: (w - tw) / 2, y: h - HUD_EDGE - TRAY_H, w: tw, h: TRAY_H };
}

/** Rect of the i-th room button in the bottom-right column (i = 0 is the lowest). */
export function navBox(w: number, h: number, i: number): Box {
  return { x: w - HUD_EDGE - NAV_W, y: h - HUD_EDGE - HUD_BTN - i * (HUD_BTN + 12), w: NAV_W, h: HUD_BTN };
}

export function hudBoxes(w: number, h: number, trayCount: number, navCount: number): HudBoxes {
  const hint: Box = { x: w - HUD_EDGE - HUD_WIDE, y: HUD_EDGE, w: HUD_WIDE, h: HUD_BTN };
  const clues: Box = { x: hint.x - HUD_GAP - HUD_WIDE, y: HUD_EDGE, w: HUD_WIDE, h: HUD_BTN };
  const pause: Box = { x: HUD_EDGE, y: HUD_EDGE, w: HUD_BTN, h: HUD_BTN };
  const house: Box = { x: pause.x + HUD_BTN + HUD_GAP, y: HUD_EDGE, w: HUD_BTN, h: HUD_BTN };
  const strip: Box = { x: (w - PILL_W) / 2, y: HUD_EDGE, w: PILL_W, h: PILL_H };
  const timer: Box = { x: (w - 200) / 2, y: HUD_EDGE + PILL_H + 8, w: 200, h: 52 };
  const show: Box = { x: HUD_EDGE, y: h - HUD_EDGE - HUD_BTN, w: HUD_BTN, h: HUD_BTN };
  const nav = Array.from({ length: navCount }, (_, i) => navBox(w, h, i));
  return { pause, house, clues, hint, strip, timer, show, tray: trayBox(w, h, trayCount), nav };
}

export const centre = (b: Box): { x: number; y: number } => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });

export function overlaps(a: Box, b: Box): boolean {
  return a.w > 0 && b.w > 0 && a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/** The Scatterly title block on the Overview menu: top-right, right-aligned to the edge margin (game px, generous). */
export function titleBox(w: number): Box {
  const width = 480;
  return { x: w - HUD_EDGE - 8 - width, y: HUD_EDGE - 4, w: width, h: 112 };
}
