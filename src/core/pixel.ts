/** Pixel-art helpers. One art pixel = PX game pixels (ART.px in Art Bible v1). */
export const PX = 3;

/** Snap a game-pixel coordinate to the art-pixel grid (multiples of PX). */
export function snap(v: number): number {
  return Math.round(v / PX) * PX;
}

/** Art pixels -> game pixels. */
export function toGame(artPx: number): number {
  return artPx * PX;
}
