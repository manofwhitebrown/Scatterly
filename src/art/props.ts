import { PAL, circle, line, panelBox, poly, rotPts, rrect, shade } from './palette';
import type { G } from './palette';

const BOOKS = [PAL.terracotta, PAL.blue, PAL.butter, PAL.sage, PAL.rose, PAL.navy, PAL.teal];

export function knob(g: G, x: number, y: number): void {
  circle(g, x, y, 4, PAL.gold);
}

export function leaf(g: G, cx: number, cy: number, deg: number, len: number, wid: number, col: number): void {
  const a = (deg * Math.PI) / 180;
  const tx = cx + Math.cos(a) * len;
  const ty = cy + Math.sin(a) * len;
  const mx = cx + Math.cos(a) * len * 0.5;
  const my = cy + Math.sin(a) * len * 0.5;
  const px = -Math.sin(a) * wid;
  const py = Math.cos(a) * wid;
  poly(g, [cx, cy, mx + px, my + py, tx, ty, mx - px, my - py], col);
}

export function shoe(g: G, x: number, yb: number, col: number, ang: number): void {
  const pts = [x, yb - 16, x + 14, yb - 24, x + 24, yb - 16, x + 44, yb - 10, x + 46, yb, x, yb];
  poly(g, rotPts(pts, x + 23, yb - 8, ang), col);
  const sole = rotPts([x, yb - 3, x + 46, yb - 3, x + 46, yb + 1, x, yb + 1], x + 23, yb - 8, ang);
  poly(g, sole, 0x2a2018, null);
}

export function books(g: G, yb: number, from: number, skip: number, pulled: number): void {
  const ws = [14, 18, 12, 16, 14, 20, 12, 16, 14, 18];
  const hs = [40, 34, 44, 38, 42, 36, 44, 34, 40, 38];
  let x = 22;
  for (let i = 0; i < ws.length; i++) {
    const c = BOOKS[(i + from) % BOOKS.length];
    if (i === skip) rrect(g, x, yb - hs[i], ws[i], hs[i], 2, 0x5a3a26);
    else if (i === pulled) panelBox(g, x - 2, yb - hs[i] + 10, ws[i] + 2, hs[i], 3, c, shade(c, -0.38), 2);
    else panelBox(g, x, yb - hs[i], ws[i], hs[i], 3, c, shade(c, -0.38), 2);
    x += ws[i] + 2;
  }
}

export function sheet(g: G, cx: number, cy: number, ang: number, col: number): void {
  const pts = rotPts([cx - 40, cy - 28, cx + 40, cy - 28, cx + 40, cy + 28, cx - 40, cy + 28], cx, cy, ang);
  poly(g, pts, col);
  for (let i = 0; i < 3; i++) {
    const l = rotPts([cx - 28, cy - 14 + i * 12, cx + 24, cy - 14 + i * 12], cx, cy, ang);
    line(g, l[0], l[1], l[2], l[3], 2, PAL.inkSoft, 0.4);
  }
}
