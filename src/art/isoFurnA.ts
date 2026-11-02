import { shade } from './palette';
import { ajar, box, dot, flat, front, P, quad } from './isoCtx';
import type { Ctx } from './isoCtx';
import { faceShade } from './iso';

const DARK = 0x3a2c24;
const STEEL = 0xaab4bd;
const GLOW = 0xfff1b8;

export function drawDrawer(c: Ctx): void {
  const f = faceShade(c.base);
  box(c, 0, 0, 0, c.w, c.d, c.h, c.base);
  front(c, 0.1, 0.12, 1.9, 0.95, shade(c.base, 0.12));
  if (c.open) {
    front(c, 0.1, 1.05, 1.9, 1.88, DARK);
    box(c, 0.12, 0.2, 1.0, 1.88, c.d + 0.5, 1.5, shade(c.base, 0.1));
    front(c, 0.12, 1.0, 1.88, 1.5, f.top);
    return;
  }
  front(c, 0.1, 1.05, 1.9, 1.88, shade(c.base, 0.12));
  dot(c, P(c, 1, c.d, 0.55), 2.4, STEEL);
  dot(c, P(c, 1, c.d, 1.45), 2.4, STEEL);
}

export function drawCabinet(c: Ctx): void {
  box(c, 0, 0, 0, c.w, c.d, c.h, c.base);
  front(c, 0.08, 0.15, 1.92, 3.85, shade(c.base, 0.08));
  front(c, 0.97, 0.15, 1.03, 3.85, DARK, 0.6);
  box(c, 0.05, 0.05, c.h, c.w - 0.05, c.d + 0.05, c.h + 0.12, shade(c.base, 0.1));
  if (c.open) {
    front(c, 0.08, 0.15, 1.0, 3.85, DARK);
    for (const v of [1.3, 2.5]) front(c, 0.1, v, 0.98, v + 0.1, shade(c.base, 0.15));
    ajar(c, 0.05, 1.0, 0.15, 3.85, shade(c.base, 0.12));
    return;
  }
  dot(c, P(c, 0.85, c.d, 2), 2.4, STEEL);
  dot(c, P(c, 1.15, c.d, 2), 2.4, STEEL);
}

export function drawFridge(c: Ctx): void {
  box(c, 0, 0, 0, c.w, c.d, c.h, c.base);
  front(c, 0.06, 0.2, 0.94, 5.8, shade(c.base, 0.1));
  front(c, 0.06, 4.1, 0.94, 4.2, DARK, 0.55);
  if (c.open) {
    front(c, 0.06, 0.2, 0.94, 4.0, GLOW, 0.5);
    for (const v of [1.2, 2.2, 3.2]) front(c, 0.08, v, 0.92, v + 0.08, STEEL);
    ajar(c, 0.04, 0.94, 0.2, 4.0, shade(c.base, 0.05), 12);
    return;
  }
  front(c, 0.78, 4.35, 0.86, 5.5, STEEL);
  front(c, 0.78, 2.2, 0.86, 3.8, STEEL);
}

export function drawSofa(c: Ctx): void {
  box(c, 0, 0, 0, 3, 1, 1, shade(c.base, -0.1));
  box(c, 0, 0, 1, 3, 0.3, 2, c.base);
  box(c, 0, 0.3, 1, 0.35, 1, 1.6, c.base);
  box(c, 2.65, 0.3, 1, 3, 1, 1.6, c.base);
  const seat = shade(c.base, 0.12);
  box(c, 0.35, 0.3, 1, 1.5, 1, 1.3, seat);
  if (c.open) {
    quad(c, [P(c, 1.5, 0.3, 1.3), P(c, 2.65, 0.3, 1.3), P(c, 2.65, 1, 1.3), P(c, 1.5, 1, 1.3)], DARK);
    box(c, 1.5, 0.2, 1.55, 2.65, 1, 1.85, seat);
  } else {
    box(c, 1.5, 0.3, 1, 2.65, 1, 1.3, seat);
  }
}

export function drawTable(c: Ctx): void {
  for (const [a, b] of [[0.1, 0.1], [1.7, 0.1], [0.1, 1.7], [1.7, 1.7]]) box(c, a, b, 0, a + 0.2, b + 0.2, 1.6, shade(c.base, -0.2));
  box(c, 0, 0, 1.6, 2, 2, 2, c.base);
  if (c.open) box(c, 0.5, 0.7, 2, 1.2, 1.4, 2.1, 0xe9e0cf);
  else flat(c, 0.55, 0.55, 1.45, 1.45, 2, shade(c.base, 0.18));
}

export function drawShelf(c: Ctx): void {
  const wood = c.base;
  box(c, 0, 0, 0, 2, 0.15, 5, shade(wood, -0.15));
  box(c, 0, 0, 0, 0.15, 1, 5, wood);
  box(c, 1.85, 0, 0, 2, 1, 5, wood);
  const books = [0xc96a5a, 0x5b8fc7, 0xe8b84a, 0x7fb08a];
  for (let i = 0; i < 4; i++) {
    const z = 0.15 + i * 1.2;
    box(c, 0.15, 0, z, 1.85, 1, z + 0.12, shade(wood, 0.1));
    if (i === 1 && c.open) box(c, 0.3, 0.3, z + 0.12, 0.55, 1.35, z + 0.95, books[2]);
    for (let k = 0; k < 3; k++) box(c, 0.3 + k * 0.28 + (i % 2) * 0.5, 0.2, z + 0.12, 0.5 + k * 0.28 + (i % 2) * 0.5, 0.8, z + 0.9 - k * 0.1, books[(i + k) % 4]);
  }
}

export function drawBed(c: Ctx): void {
  box(c, 0, 0, 0, 3, 2, 0.8, shade(c.base, -0.25));
  box(c, 0, 0, 0.8, 3, 0.2, 2.1, shade(c.base, -0.35));
  box(c, 0.05, 0.2, 0.8, 2.95, 1.95, 1.4, 0xf1e8dc);
  box(c, 0.3, 0.3, 1.4, 1.0, 0.95, 1.65, 0xffffff);
  box(c, 0.3, 1.05, 1.4, 1.0, 1.7, 1.65, 0xffffff);
  const blanket = 0x6fa8a0;
  if (c.open) {
    box(c, 2.0, 0.05, 1.4, 2.95, 1.95, 1.58, blanket);
    box(c, 1.3, 0.05, 1.4, 2.0, 1.95, 1.7, shade(blanket, 0.2));
  } else box(c, 1.3, 0.05, 1.4, 2.95, 1.95, 1.58, blanket);
}

export function drawWardrobe(c: Ctx): void {
  box(c, 0, 0, 0, c.w, c.d, c.h, c.base);
  box(c, -0.04, -0.04, c.h, c.w + 0.04, c.d + 0.04, c.h + 0.15, shade(c.base, 0.12));
  front(c, 0.08, 0.2, 0.96, 5.8, shade(c.base, 0.07));
  front(c, 1.04, 0.2, 1.92, 5.8, shade(c.base, 0.07));
  front(c, 0.97, 0.2, 1.03, 5.8, DARK, 0.6);
  if (c.open) {
    front(c, 0.08, 0.2, 0.96, 5.8, DARK);
    for (const [i, col] of [0xc96a5a, 0x5b8fc7, 0xe8b84a].entries()) front(c, 0.15 + i * 0.25, 1.5, 0.3 + i * 0.25, 4.8, col);
    ajar(c, 0.05, 0.96, 0.2, 5.8, shade(c.base, 0.1), 16);
    return;
  }
  dot(c, P(c, 0.88, c.d, 3), 2.4, STEEL);
  dot(c, P(c, 1.12, c.d, 3), 2.4, STEEL);
}

export function drawJacket(c: Ctx): void {
  box(c, 0.25, 0.25, 0, 0.75, 0.75, 0.2, shade(c.base, -0.3));
  box(c, 0.45, 0.45, 0.2, 0.55, 0.55, 4.7, shade(c.base, -0.35));
  box(c, 0.2, 0.4, 4.5, 0.8, 0.6, 4.7, shade(c.base, -0.3));
  const coat = 0x7a8fb0;
  box(c, 0.18, 0.2, 1.4, 0.82, 0.8, 4.2, coat);
  front(c, 0.28, 1.6, 0.52, 2.0, c.open ? DARK : shade(coat, 0.2));
  front(c, 0.28, 2.0, 0.52, 2.1, shade(coat, -0.2));
}

export function drawBagSpot(c: Ctx): void {
  box(c, 0.15, 0.15, 0, 0.85, 0.85, 1.3, c.base);
  box(c, 0.3, 0.4, 1.3, 0.4, 0.6, 1.8, shade(c.base, -0.3));
  box(c, 0.6, 0.4, 1.3, 0.7, 0.6, 1.8, shade(c.base, -0.3));
  front(c, 0.25, 0.5, 0.75, 1.0, shade(c.base, 0.15));
  if (c.open) flat(c, 0.2, 0.2, 0.8, 0.8, 1.3, DARK);
  else dot(c, P(c, 0.5, c.d - 0.15, 0.95), 2, STEEL);
}

export function drawBasket(c: Ctx): void {
  box(c, 0.1, 0.1, 0, 0.9, 0.9, 1.6, c.base);
  for (const v of [0.4, 0.8, 1.2]) front(c, 0.1, v, 0.9, v + 0.08, shade(c.base, -0.25), 0.8);
  if (c.open) {
    flat(c, 0.15, 0.15, 0.85, 0.85, 1.6, DARK);
    box(c, 0.05, 0.05, 1.75, 0.95, 0.4, 1.95, shade(c.base, 0.15));
  } else box(c, 0.05, 0.05, 1.6, 0.95, 0.95, 1.8, shade(c.base, 0.15));
}
