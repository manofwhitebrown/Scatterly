import { houseBounds } from './homeWorld';
import type { CameraState, Pt } from './homeWorld';

export const PINCH_OUT = 0.72;   // fingers ended closer than this fraction of where they started: leave Focus
export const MAX_ZOOM_X = 2;     // Overview may zoom in to 2x its fitted zoom
export const MIN_ZOOM_X = 0.85;

export const dist = (a: Pt, b: Pt): number => Math.hypot(a.x - b.x, a.y - b.y);

/** Pan by a screen-space drag (game px); the world follows the finger. */
export function panCamera(cam: CameraState, dx: number, dy: number): CameraState {
  return { zoom: cam.zoom, cx: cam.cx - dx / cam.zoom, cy: cam.cy - dy / cam.zoom };
}

/** Keeps the camera centre inside the house bounds (plus a margin in art px) so the house can never be dragged away. */
export function clampCamera(cam: CameraState, margin = 60): CameraState {
  const b = houseBounds();
  return {
    zoom: cam.zoom,
    cx: Math.min(b.x + b.w + margin, Math.max(b.x - margin, cam.cx)),
    cy: Math.min(b.y + b.h + margin, Math.max(b.y - margin, cam.cy)),
  };
}

/** Pinch: scale the zoom by the finger-distance ratio, clamped around the fitted Overview zoom. */
export function pinchCamera(start: CameraState, ratio: number, base: CameraState): CameraState {
  const zoom = Math.min(base.zoom * MAX_ZOOM_X, Math.max(base.zoom * MIN_ZOOM_X, start.zoom * ratio));
  return clampCamera({ zoom, cx: start.cx, cy: start.cy });
}
