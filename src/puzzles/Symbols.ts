import type Phaser from 'phaser';
import { PAL } from './ui';

export const SYMBOL_COUNT = 6;
export const SYMBOL_NAMES = ['Circle', 'Square', 'Triangle', 'Diamond', 'Star', 'Cross'] as const;
export const SYMBOL_COLORS: readonly number[] = [PAL.terracotta, PAL.blue, PAL.sage, PAL.butter, PAL.rose, PAL.teal];

/**
 * Draws one of six symbols that differ in SHAPE (and colour), so the game never relies on colour alone.
 * Event-driven use only (it allocates a few points for star/cross); never call it per frame.
 */
export function drawSymbol(g: Phaser.GameObjects.Graphics, id: number, cx: number, cy: number, r: number): void {
  const col = SYMBOL_COLORS[id] ?? PAL.steel;
  g.fillStyle(col, 1);
  g.lineStyle(Math.max(3, r / 6), PAL.ink, 1);
  switch (id) {
    case 0:
      g.fillCircle(cx, cy, r);
      g.strokeCircle(cx, cy, r);
      break;
    case 1:
      g.fillRect(cx - r, cy - r, r * 2, r * 2);
      g.strokeRect(cx - r, cy - r, r * 2, r * 2);
      break;
    case 2:
      g.fillTriangle(cx, cy - r, cx + r, cy + r * 0.85, cx - r, cy + r * 0.85);
      g.strokeTriangle(cx, cy - r, cx + r, cy + r * 0.85, cx - r, cy + r * 0.85);
      break;
    case 3: {
      const pts = [{ x: cx, y: cy - r * 1.15 }, { x: cx + r, y: cy }, { x: cx, y: cy + r * 1.15 }, { x: cx - r, y: cy }];
      g.fillPoints(pts, true);
      g.strokePoints(pts, true);
      break;
    }
    case 4: {
      const pts: Array<{ x: number; y: number }> = [];
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const rr = i % 2 === 0 ? r * 1.1 : r * 0.5;
        pts.push({ x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr });
      }
      g.fillPoints(pts, true);
      g.strokePoints(pts, true);
      break;
    }
    default: {
      const t = r * 0.38;
      const pts = [
        { x: cx - t, y: cy - r }, { x: cx + t, y: cy - r }, { x: cx + t, y: cy - t }, { x: cx + r, y: cy - t },
        { x: cx + r, y: cy + t }, { x: cx + t, y: cy + t }, { x: cx + t, y: cy + r }, { x: cx - t, y: cy + r },
        { x: cx - t, y: cy + t }, { x: cx - r, y: cy + t }, { x: cx - r, y: cy - t }, { x: cx - t, y: cy - t },
      ];
      g.fillPoints(pts, true);
      g.strokePoints(pts, true);
    }
  }
}
