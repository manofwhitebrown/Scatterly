import type { ClueIcon } from '../shared/types';
import { PAL, circle, line, panelBox, poly, rrect, shade, softShadow } from './palette';
import type { G } from './palette';

type Draw = (g: G) => void;

export const CLUE_ICONS: ClueIcon[] = ['receipt', 'note', 'photo', 'ticket', 'bagTag', 'mug', 'stain', 'wrapper', 'text', 'laundry'];

const ICONS: Record<ClueIcon, Draw> = {
  receipt: (g) => {
    softShadow(g, 32, 60, 40, 5);
    poly(g, [14, 4, 50, 4, 50, 56, 44, 51, 38, 56, 32, 51, 26, 56, 20, 51, 14, 56], PAL.white, 0xb8b2a6);
    rrect(g, 20, 10, 24, 5, 2, PAL.inkSoft, 0.7);
    for (let i = 0; i < 4; i++) line(g, 20, 22 + i * 7, 44 - (i % 2) * 8, 22 + i * 7, 2, PAL.inkSoft, 0.45);
    rrect(g, 34, 42, 10, 4, 2, PAL.terracotta);
  },
  note: (g) => {
    softShadow(g, 32, 60, 42, 5);
    panelBox(g, 10, 6, 44, 48, 5, PAL.butter);
    poly(g, [54, 40, 54, 54, 40, 54], shade(PAL.butter, -0.2), null);
    for (let i = 0; i < 4; i++) line(g, 17, 18 + i * 8, 46 - (i === 3 ? 12 : 0), 18 + i * 8, 2, PAL.ink, 0.5);
    circle(g, 32, 8, 3, PAL.red);
  },
  photo: (g) => {
    softShadow(g, 32, 60, 44, 5);
    panelBox(g, 8, 8, 48, 46, 4, PAL.white, 0xb8b2a6);
    rrect(g, 13, 13, 38, 30, 2, PAL.sky);
    poly(g, [13, 43, 27, 26, 38, 43], PAL.green, null);
    poly(g, [28, 43, 40, 30, 51, 43], PAL.sageDark, null);
    g.fillStyle(PAL.butter, 1);
    g.fillCircle(42, 20, 4);
  },
  ticket: (g) => {
    softShadow(g, 32, 56, 48, 5);
    poly(g, [6, 14, 58, 14, 58, 26, 54, 30, 58, 34, 58, 46, 6, 46, 6, 34, 10, 30, 6, 26], PAL.terracotta);
    line(g, 42, 16, 42, 44, 2, PAL.cream, 0.8);
    poly(g, [24, 22, 27, 29, 34, 29, 28, 33, 30, 40, 24, 36, 18, 40, 20, 33, 14, 29, 21, 29], PAL.butter, null);
    for (let i = 0; i < 3; i++) line(g, 46, 22 + i * 8, 54, 22 + i * 8, 2, PAL.cream, 0.8);
  },
  bagTag: (g) => {
    softShadow(g, 32, 60, 36, 5);
    g.lineStyle(3, PAL.inkSoft, 1);
    g.beginPath();
    g.arc(26, 14, 12, Math.PI * 0.9, Math.PI * 2.1, false);
    g.strokePath();
    poly(g, [22, 22, 42, 22, 50, 32, 50, 56, 18, 56, 18, 32], PAL.sky);
    circle(g, 34, 29, 3, PAL.white);
    rrect(g, 24, 38, 20, 4, 2, PAL.navy, 0.7);
    rrect(g, 24, 46, 14, 4, 2, PAL.navy, 0.5);
  },
  mug: (g) => {
    softShadow(g, 30, 58, 40, 5);
    g.lineStyle(6, shade(PAL.teal, -0.3), 1);
    g.beginPath();
    g.arc(46, 38, 9, -Math.PI / 2, Math.PI / 2, false);
    g.strokePath();
    panelBox(g, 10, 20, 36, 36, 8, PAL.teal);
    rrect(g, 14, 24, 28, 8, 4, 0x6b4a32);
    for (const x of [20, 30]) {
      g.lineStyle(3, PAL.inkSoft, 0.35);
      g.beginPath();
      g.moveTo(x, 16);
      g.lineTo(x + 3, 10);
      g.lineTo(x, 4);
      g.strokePath();
    }
  },
  stain: (g) => {
    softShadow(g, 32, 56, 44, 5, 0.08);
    g.fillStyle(0x7b5a3c, 0.85);
    g.fillEllipse(30, 32, 36, 28);
    g.fillEllipse(44, 38, 20, 18);
    g.fillEllipse(22, 22, 14, 12);
    g.fillStyle(0x5a3f28, 0.9);
    g.fillEllipse(32, 32, 22, 16);
    g.fillStyle(0x7b5a3c, 0.85);
    g.fillCircle(50, 18, 4);
    g.fillCircle(14, 44, 3);
    g.fillStyle(PAL.white, 0.25);
    g.fillEllipse(24, 26, 8, 5);
  },
  wrapper: (g) => {
    softShadow(g, 32, 56, 46, 5);
    poly(g, [4, 22, 16, 28, 16, 44, 4, 50], PAL.rose);
    poly(g, [60, 22, 48, 28, 48, 44, 60, 50], PAL.rose);
    panelBox(g, 14, 22, 36, 26, 8, PAL.yellow);
    for (let i = 0; i < 4; i++) line(g, 20 + i * 8, 26, 18 + i * 8, 44, 2, PAL.white, 0.45);
    g.fillStyle(PAL.red, 1);
    g.fillCircle(32, 35, 5);
  },
  text: (g) => {
    softShadow(g, 32, 58, 44, 5);
    poly(g, [8, 8, 56, 8, 56, 40, 36, 40, 26, 52, 26, 40, 8, 40], PAL.green);
    for (const x of [22, 32, 42]) circle(g, x, 24, 3, PAL.white, PAL.white);
  },
  laundry: (g) => {
    softShadow(g, 32, 58, 44, 5);
    poly(g, [22, 6, 42, 6, 56, 16, 50, 26, 44, 22, 44, 54, 20, 54, 20, 22, 14, 26, 8, 16], PAL.blue);
    poly(g, [24, 6, 32, 16, 40, 6], PAL.cloud, shade(PAL.cloud, -0.3));
    for (let y = 26; y < 52; y += 8) line(g, 21, y, 43, y, 2, PAL.white, 0.35);
  },
};

export function drawIcon(g: G, id: ClueIcon): void {
  ICONS[id](g);
}
