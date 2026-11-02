import { shade } from './palette';
import { ajar, box, dot, flat, front, P, quad } from './isoCtx';
import type { Ctx } from './isoCtx';

const DARK = 0x3a2c24;
const STEEL = 0xaab4bd;

export function drawKeyHook(c: Ctx): void {
  box(c, 0.08, 0.0, 0.1, 0.92, 0.16, 0.9, c.base);
  for (const a of [0.25, 0.5, 0.75]) {
    dot(c, P(c, a, 0.3, 0.6), 2.2, STEEL);
    if (!c.open) box(c, a - 0.04, 0.2, 0.05, a + 0.04, 0.3, 0.5, 0xe8b84a);
  }
}

export function drawShoeRack(c: Ctx): void {
  box(c, 0.05, 0.05, 0, 0.15, 0.95, 1, shade(c.base, -0.2));
  box(c, 1.85, 0.05, 0, 1.95, 0.95, 1, shade(c.base, -0.2));
  box(c, 0.05, 0.05, 0.35, 1.95, 0.95, 0.43, c.base);
  box(c, 0.05, 0.05, 0.9, 1.95, 0.95, 0.98, c.base);
  box(c, 0.3, 0.35, 0.43, 0.8, 0.7, 0.65, 0x5b6d8f);
  box(c, 1.0, 0.35, 0.43, 1.5, 0.7, 0.65, 0xc96a5a);
  if (c.open) box(c, 0.4, 0.8, 0.05, 0.9, 1.25, 0.28, 0x7fb08a);
  else box(c, 0.4, 0.35, 0.05, 0.9, 0.7, 0.28, 0x7fb08a);
}

export function drawSink(c: Ctx): void {
  box(c, 0, 0, 0, 2, 1, 1.5, shade(c.base, -0.35));
  box(c, -0.04, -0.04, 1.5, 2.04, 1.04, 1.7, 0xeef2f4);
  flat(c, 0.4, 0.25, 1.6, 0.8, 1.7, 0x8fa9b8);
  box(c, 0.95, 0.1, 1.7, 1.05, 0.2, 2.2, STEEL);
  front(c, 0.1, 0.12, 0.96, 1.35, shade(c.base, -0.2));
  front(c, 1.04, 0.12, 1.9, 1.35, shade(c.base, -0.2));
  if (c.open) {
    front(c, 0.1, 0.12, 0.96, 1.35, DARK);
    ajar(c, 0.08, 0.96, 0.12, 1.35, shade(c.base, -0.1), 12);
  }
}

export function drawTv(c: Ctx): void {
  box(c, 0, 0, 0, 2, 1, 1, shade(c.base, 0.35));
  front(c, 0.1, 0.1, 1.9, 0.9, shade(c.base, 0.2));
  box(c, 0.1, 0.35, 1, 1.9, 0.55, 2.8, 0x2d3239);
  front(c, 0.15, 1.1, 1.85, 2.7, c.open ? 0x6fa8d0 : 0x1c2026);
  dot(c, P(c, 1, 0.55, 1.05), 1.6, c.open ? 0x9ad98f : 0xc96a5a);
  box(c, 0.9, 0.4, 1, 1.1, 0.5, 1.12, 0x2d3239);
}

export function drawCharger(c: Ctx): void {
  box(c, 0.1, 0.1, 0, 0.9, 0.9, 0.18, c.base);
  box(c, 0.35, 0.35, 0.18, 0.65, 0.65, 0.3, shade(c.base, -0.25));
  dot(c, P(c, 0.5, 0.9, 0.12), 1.8, c.open ? 0x7fd08a : 0xe8b84a);
  box(c, 0.8, 0.1, 0, 0.9, 0.3, 0.1, 0x3a3f44);
}

export function drawRug(c: Ctx): void {
  const col = c.base;
  flat(c, 0, 0, 3, 2, 0, shade(col, -0.2));
  flat(c, 0.12, 0.12, 2.88, 1.88, 0, col);
  flat(c, 0.3, 0.3, 2.7, 1.7, 0, shade(col, 0.2));
  for (let i = 0; i < 6; i++) flat(c, 0.5 + i * 0.36, 0.45, 0.62 + i * 0.36, 1.55, 0, shade(col, -0.12));
  if (c.open) quad(c, [P(c, 0, 1.4, 0), P(c, 0, 2, 0), P(c, -0.45, 2.45, 0.35), P(c, -0.45, 1.85, 0.35)], shade(col, 0.3));
}

export function drawPlant(c: Ctx): void {
  const green = c.base;
  box(c, 0.25, 0.25, 0, 0.75, 0.75, 0.9, 0xc4785a);
  box(c, 0.2, 0.2, 0.9, 0.8, 0.8, 0.98, 0x8a5a45);
  const lift = c.open ? 0.12 : 0;
  box(c, 0.15 + lift, 0.2, 0.98, 0.85 + lift, 0.8, 2.0, green);
  box(c, 0.25, 0.3, 2.0, 0.75, 0.7, 2.9, shade(green, 0.1));
  box(c, 0.38, 0.38, 2.9, 0.62, 0.62, 3.5, shade(green, 0.22));
}

export function drawPapers(c: Ctx): void {
  const paper = 0xf1ebdc;
  for (let i = 0; i < 3; i++) box(c, 0.15 + i * 0.05, 0.15 - i * 0.03, i * 0.12, 0.8 + i * 0.05, 0.85 - i * 0.03, i * 0.12 + 0.1, shade(paper, -i * 0.04));
  flat(c, 0.35, 0.35, 0.75, 0.42, 0.34, 0x9a8f80);
  flat(c, 0.35, 0.5, 0.65, 0.57, 0.34, 0x9a8f80);
  if (c.open) box(c, 0.85, 0.2, 0, 1.45, 0.8, 0.08, paper);
}

export function drawBin(c: Ctx): void {
  box(c, 0.15, 0.15, 0, 0.85, 0.85, 1.8, c.base);
  front(c, 0.35, 0.2, 0.65, 1.6, shade(c.base, -0.2), 0.5);
  if (c.open) {
    flat(c, 0.2, 0.2, 0.8, 0.8, 1.8, DARK);
    box(c, 0.1, 0.1, 2.1, 0.9, 0.4, 2.3, shade(c.base, 0.2));
  } else box(c, 0.1, 0.1, 1.8, 0.9, 0.9, 2, shade(c.base, 0.2));
}
