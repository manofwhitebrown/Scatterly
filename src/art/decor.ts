import type { DecorDef } from '../shared/types';
import { PAL, circle, line, panelBox, poly, rrect, shade, softShadow, vgrad } from './palette';
import type { G } from './palette';
import { drawSpot } from './spots';

const HUES = [PAL.terracotta, PAL.blue, PAL.sage, PAL.rose, PAL.butter, PAL.teal];

function hueOf(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return HUES[h % HUES.length];
}

function framed(g: G, w: number, h: number, hue: number): void {
  panelBox(g, 1, 1, w - 2, h - 2, 6, PAL.woodDark);
  vgrad(g, 8, 8, w - 16, h - 16, shade(hue, 0.5), shade(hue, 0.2), 4);
  poly(g, [8, h - 8, w * 0.38, h * 0.45, w * 0.6, h - 8], shade(hue, -0.1), null);
  poly(g, [w * 0.45, h - 8, w * 0.7, h * 0.52, w - 8, h - 8], shade(hue, -0.25), null);
  g.fillStyle(PAL.butter, 1);
  g.fillCircle(w * 0.76, h * 0.28, Math.max(4, w * 0.07));
}

function lamp(g: G, w: number, h: number): void {
  const cx = w / 2;
  softShadow(g, cx, h - 5, w * 0.8, 8);
  g.fillStyle(PAL.butter, 0.18);
  g.fillEllipse(cx, h * 0.2, w * 1.1, h * 0.22);
  rrect(g, cx - 3, h * 0.26, 6, h * 0.66, 3, PAL.charcoal);
  panelBox(g, cx - w * 0.3, h - 14, w * 0.6, 10, 5, PAL.charcoal);
  poly(g, [cx - w * 0.32, h * 0.26, cx + w * 0.32, h * 0.26, cx + w * 0.2, h * 0.04, cx - w * 0.2, h * 0.04], PAL.butter);
  line(g, cx - w * 0.26, h * 0.14, cx - w * 0.14, h * 0.07, 3, PAL.white, 0.5);
}

function clock(g: G, w: number, h: number): void {
  const r = Math.min(w, h) / 2 - 2;
  const cx = w / 2;
  const cy = h / 2;
  circle(g, cx, cy, r, PAL.woodDark);
  circle(g, cx, cy, r - 6, PAL.cream);
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    line(g, cx + Math.cos(a) * (r - 12), cy + Math.sin(a) * (r - 12), cx + Math.cos(a) * (r - 9), cy + Math.sin(a) * (r - 9), 2, PAL.ink);
  }
  line(g, cx, cy, cx, cy - r * 0.5, 3, PAL.ink);
  line(g, cx, cy, cx + r * 0.36, cy + r * 0.1, 3, PAL.terracotta);
  circle(g, cx, cy, 3, PAL.ink);
}

function mirror(g: G, w: number, h: number): void {
  panelBox(g, 1, 1, w - 2, h - 2, Math.min(w, h) / 2, PAL.gold);
  vgrad(g, 8, 8, w - 16, h - 16, 0xd9eef5, 0xaed2de, 6);
  line(g, w * 0.28, h * 0.3, w * 0.4, h * 0.18, 4, PAL.white, 0.6);
}

function vase(g: G, w: number, h: number, hue: number): void {
  const cx = w / 2;
  softShadow(g, cx, h - 4, w * 0.7, 6);
  for (const d of [-0.28, 0, 0.28]) {
    line(g, cx, h * 0.5, cx + d * w, h * 0.12 + Math.abs(d) * h * 0.2, 3, PAL.sageDark);
    circle(g, cx + d * w, h * 0.12 + Math.abs(d) * h * 0.2, w * 0.1, shade(hue, 0.1));
  }
  poly(g, [cx - w * 0.2, h * 0.5, cx + w * 0.2, h * 0.5, cx + w * 0.3, h - 8, cx - w * 0.3, h - 8], hue);
}

function curtain(g: G, w: number, h: number, hue: number): void {
  rrect(g, 0, 0, w, 8, 4, shade(hue, -0.3));
  panelBox(g, 2, 6, w - 4, h - 8, 8, hue);
  for (let x = 12; x < w - 6; x += 14) line(g, x, 10, x, h - 6, 2, PAL.shadow, 0.12);
}

function cushion(g: G, w: number, h: number, hue: number): void {
  softShadow(g, w / 2, h - 4, w * 0.8, 6);
  panelBox(g, 2, 2, w - 4, h - 10, Math.min(w, h) / 3, hue);
  line(g, w * 0.2, h * 0.4, w * 0.8, h * 0.4, 2, PAL.white, 0.45);
  circle(g, w / 2, h * 0.4, 4, shade(hue, -0.2));
}

function candle(g: G, w: number, h: number, hue: number): void {
  softShadow(g, w / 2, h - 4, w * 0.8, 6);
  panelBox(g, w * 0.25, h * 0.35, w * 0.5, h * 0.58, 5, hue);
  line(g, w / 2, h * 0.35, w / 2, h * 0.26, 2, PAL.ink);
  poly(g, [w / 2, h * 0.04, w / 2 + 6, h * 0.2, w / 2, h * 0.27, w / 2 - 6, h * 0.2], PAL.butter);
}

export function drawDecor(g: G, def: DecorDef): void {
  const { w, h } = def;
  const key = `${def.id} ${def.name}`.toLowerCase();
  const hue = hueOf(def.id);
  if (def.kind === 'storage' && def.spotKind) drawSpot(g, def.spotKind, false, w, h);
  else if (/lamp/.test(key)) lamp(g, w, h);
  else if (/clock/.test(key)) clock(g, w, h);
  else if (/mirror/.test(key)) mirror(g, w, h);
  else if (/vase|flower|bouquet/.test(key)) vase(g, w, h, hue);
  else if (/plant|fern|cactus/.test(key)) drawSpot(g, 'plant', false, w, h);
  else if (/curtain/.test(key)) curtain(g, w, h, hue);
  else if (/cushion|pillow/.test(key)) cushion(g, w, h, hue);
  else if (/rug|mat/.test(key)) drawSpot(g, 'rug', false, w, h);
  else if (/shelf/.test(key)) drawSpot(g, 'shelf', false, w, h);
  else if (/candle/.test(key)) candle(g, w, h, hue);
  else framed(g, w, h, hue);
}
