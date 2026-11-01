import type { ItemId } from '../shared/types';
import { PAL, circle, line, panelBox, poly, rotPts, rrect, shade, softShadow, vgrad } from './palette';
import type { G } from './palette';

type Draw = (g: G) => void;

function key(g: G, cx: number, cy: number, ang: number, col: number): void {
  const bow = rotPts([cx, cy], cx, cy + 20, ang);
  g.fillStyle(shade(col, -0.38), 1);
  g.fillCircle(bow[0], bow[1], 14);
  g.fillStyle(col, 1);
  g.fillCircle(bow[0], bow[1], 12);
  g.fillStyle(0x000000, 0.25);
  g.fillCircle(bow[0], bow[1], 5);
  const shaft = rotPts([cx - 4, cy + 12, cx + 4, cy + 12, cx + 4, cy + 56, cx - 4, cy + 56], cx, cy + 20, ang);
  poly(g, shaft, col);
  const t1 = rotPts([cx + 4, cy + 42, cx + 12, cy + 42, cx + 12, cy + 48, cx + 4, cy + 48], cx, cy + 20, ang);
  const t2 = rotPts([cx + 4, cy + 51, cx + 10, cy + 51, cx + 10, cy + 56, cx + 4, cy + 56], cx, cy + 20, ang);
  poly(g, t1, col);
  poly(g, t2, col);
}

const ITEMS: Record<ItemId, Draw> = {
  keys: (g) => {
    softShadow(g, 48, 88, 64, 8);
    key(g, 54, 16, 0.4, PAL.steel);
    key(g, 40, 14, -0.15, PAL.gold);
    circle(g, 46, 12, 9, PAL.steel);
    g.fillStyle(0x000000, 0.2);
    g.fillCircle(46, 12, 5);
    panelBox(g, 6, 50, 30, 38, 7, PAL.terracotta);
    circle(g, 21, 59, 4, PAL.cream);
    line(g, 12, 70, 30, 70, 3, PAL.cream, 0.7);
    line(g, 12, 78, 26, 78, 3, PAL.cream, 0.7);
  },
  wallet: (g) => {
    softShadow(g, 48, 82, 76, 8);
    panelBox(g, 10, 24, 76, 56, 11, 0x8a5a3a);
    rrect(g, 16, 18, 50, 12, 3, PAL.cloud);
    rrect(g, 22, 15, 36, 8, 3, PAL.sky);
    panelBox(g, 10, 36, 76, 44, 11, 0xa06b44);
    g.lineStyle(2, PAL.cream, 0.5);
    g.strokeRoundedRect(15, 41, 66, 34, 8);
    circle(g, 70, 58, 6, PAL.gold);
  },
  phone: (g) => {
    softShadow(g, 48, 91, 40, 6);
    panelBox(g, 28, 4, 42, 86, 11, PAL.charcoal, 0x1b2026);
    vgrad(g, 32, 12, 34, 68, PAL.blue, PAL.sky, 5);
    rrect(g, 42, 7, 14, 3, 1, 0x1b2026);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) rrect(g, 36 + c * 10, 18 + r * 12, 7, 7, 2, PAL.white, 0.85);
    circle(g, 49, 85, 2, 0x8a939c);
  },
  officeId: (g) => {
    softShadow(g, 48, 91, 56, 6);
    poly(g, [24, 0, 36, 0, 54, 26, 42, 32], PAL.teal);
    poly(g, [72, 0, 60, 0, 42, 26, 54, 32], shade(PAL.teal, -0.15));
    rrect(g, 42, 28, 12, 10, 2, PAL.steel);
    panelBox(g, 20, 36, 56, 54, 7, PAL.white, 0xb8b8b0);
    rrect(g, 22, 38, 52, 12, 5, PAL.teal);
    circle(g, 48, 61, 8, PAL.woodLight);
    poly(g, [32, 82, 36, 72, 60, 72, 64, 82], PAL.navy, null);
    line(g, 28, 86, 68, 86, 2, PAL.inkSoft, 0.5);
  },
  shoes: (g) => {
    softShadow(g, 48, 82, 84, 8);
    poly(g, [10, 40, 30, 40, 38, 52, 62, 56, 88, 66, 88, 74, 10, 74], PAL.charcoal);
    poly(g, [10, 28, 30, 28, 30, 42, 10, 42], shade(PAL.charcoal, 0.15));
    rrect(g, 8, 72, 82, 8, 4, 0x20150f);
    for (let i = 0; i < 3; i++) line(g, 36 + i * 8, 52 + i * 2, 42 + i * 8, 58 + i * 2, 2, PAL.cloud, 0.8);
    rrect(g, 14, 32, 12, 4, 2, PAL.white, 0.25);
  },
  glasses: (g) => {
    softShadow(g, 48, 82, 72, 6);
    line(g, 12, 50, 6, 30, 5, PAL.charcoal);
    line(g, 84, 50, 90, 30, 5, PAL.charcoal);
    for (const cx of [29, 67]) {
      g.fillStyle(PAL.sky, 0.45);
      g.fillCircle(cx, 56, 17);
      g.lineStyle(5, PAL.charcoal, 1);
      g.strokeCircle(cx, 56, 17);
      line(g, cx - 9, 48, cx - 3, 44, 2, PAL.white, 0.7);
    }
    line(g, 45, 54, 51, 54, 5, PAL.charcoal);
  },
  earbuds: (g) => {
    softShadow(g, 48, 86, 70, 7);
    panelBox(g, 16, 48, 64, 36, 16, PAL.cloud, 0xb8b2a6);
    line(g, 18, 62, 78, 62, 2, 0xb8b2a6);
    circle(g, 48, 62, 3, PAL.green);
    for (const cx of [32, 64]) {
      g.fillStyle(0xb8b2a6, 1);
      g.fillEllipse(cx, 26, 24, 26);
      g.fillStyle(PAL.white, 1);
      g.fillEllipse(cx, 25, 21, 23);
      rrect(g, cx - 3, 30, 6, 22, 3, PAL.white);
      g.fillStyle(PAL.charcoal, 0.5);
      g.fillCircle(cx, 22, 4);
    }
  },
  bag: (g) => {
    softShadow(g, 48, 88, 80, 8);
    g.lineStyle(7, 0x3b2f2a, 1);
    g.strokeRoundedRect(30, 14, 36, 30, 10);
    panelBox(g, 8, 34, 80, 54, 11, 0x6b5a50);
    panelBox(g, 8, 34, 80, 24, 11, 0x7d6a5e);
    rrect(g, 40, 52, 16, 12, 3, PAL.gold);
    rrect(g, 44, 56, 8, 5, 2, 0x3b2f2a);
    line(g, 14, 72, 82, 72, 2, 0x3b2f2a, 0.35);
  },
};

export function drawItem(g: G, id: ItemId): void {
  ITEMS[id](g);
}
