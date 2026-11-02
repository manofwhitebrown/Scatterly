import { tex } from '../shared/types';
import type { G } from './palette';

/** Local badge keys (not in `tex`): padlock on locked containers, check on searched ones, shimmer idle sprite. */
export const ISO_BADGE = { padlock: 'iso_badge_padlock', check: 'iso_badge_check', shimmer: 'iso_shimmer' } as const;

export interface BadgeTask { key: string; w: number; h: number; draw: (g: G) => void }

function disc(g: G, cx: number, cy: number, r: number, fill: number): void {
  g.fillStyle(0x2b1d14, 0.28);
  g.fillCircle(cx, cy + 2, r);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(cx, cy, r);
  g.fillStyle(fill, 1);
  g.fillCircle(cx, cy, r - 3);
}

function padlock(g: G): void {
  disc(g, 24, 24, 21, 0x5b6d8f);
  g.lineStyle(4, 0xffffff, 1);
  g.beginPath();
  g.arc(24, 19, 6.5, Math.PI, 0, false);
  g.strokePath();
  g.fillStyle(0xe8b84a, 1);
  g.fillRoundedRect(14, 20, 20, 15, 3);
  g.fillStyle(0x3a2c24, 1);
  g.fillCircle(24, 27, 2.4);
  g.fillRect(23, 27, 2, 5);
}

function check(g: G): void {
  disc(g, 24, 24, 21, 0x5aa469);
  g.lineStyle(5, 0xffffff, 1);
  g.beginPath();
  g.moveTo(14, 25);
  g.lineTo(21, 32);
  g.lineTo(34, 17);
  g.strokePath();
}

/** Ruled out: round red badge with a cross. */
function ruledOut(g: G): void {
  disc(g, 24, 24, 21, 0xd9534f);
  g.lineStyle(5, 0xffffff, 1);
  g.beginPath();
  g.moveTo(16, 16);
  g.lineTo(32, 32);
  g.strokePath();
  g.beginPath();
  g.moveTo(32, 16);
  g.lineTo(16, 32);
  g.strokePath();
}

/** Hunch: amber diamond (different silhouette from the round badges) with an exclamation mark. */
function hunch(g: G): void {
  g.fillStyle(0x2b1d14, 0.28);
  g.fillTriangle(24, 5, 45, 26, 3, 26);
  g.fillStyle(0xffffff, 1);
  g.beginPath();
  g.moveTo(24, 2);
  g.lineTo(46, 24);
  g.lineTo(24, 46);
  g.lineTo(2, 24);
  g.closePath();
  g.fillPath();
  g.fillStyle(0xf2b134, 1);
  g.beginPath();
  g.moveTo(24, 7);
  g.lineTo(41, 24);
  g.lineTo(24, 41);
  g.lineTo(7, 24);
  g.closePath();
  g.fillPath();
  g.fillStyle(0xffffff, 1);
  g.fillRoundedRect(22, 14, 4, 13, 2);
  g.fillCircle(24, 32, 2.6);
}

function shimmer(g: G): void {
  g.fillStyle(0xfff1b8, 0.18);
  g.fillCircle(32, 32, 30);
  g.fillStyle(0xfff8dc, 0.9);
  g.beginPath();
  g.moveTo(32, 4);
  g.lineTo(37, 27);
  g.lineTo(60, 32);
  g.lineTo(37, 37);
  g.lineTo(32, 60);
  g.lineTo(27, 37);
  g.lineTo(4, 32);
  g.lineTo(27, 27);
  g.closePath();
  g.fillPath();
}

export function badgeTasks(): BadgeTask[] {
  return [
    { key: ISO_BADGE.padlock, w: 48, h: 48, draw: padlock },
    { key: ISO_BADGE.check, w: 48, h: 48, draw: check },
    { key: tex.mark('ruledOut'), w: 48, h: 48, draw: ruledOut },
    { key: tex.mark('hunch'), w: 48, h: 48, draw: hunch },
    { key: ISO_BADGE.shimmer, w: 64, h: 64, draw: shimmer },
  ];
}
