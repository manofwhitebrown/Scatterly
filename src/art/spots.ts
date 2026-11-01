import { SPOT_SIZE } from '../shared/types';
import type { SpotKind } from '../shared/types';
import { PAL, circle, line, panelBox, poly, rotPts, rrect, shade, softShadow, vgrad } from './palette';
import type { G } from './palette';
import { knob, leaf, shoe, books, sheet } from './props';

type Draw = (g: G, open: boolean) => void;

const DARK = 0x3b2a22;
const KINDS: Record<SpotKind, Draw> = {
  drawer: (g, o) => {
    rrect(g, 14, 76, 14, 10, 3, PAL.woodDark);
    rrect(g, 132, 76, 14, 10, 3, PAL.woodDark);
    panelBox(g, 2, 6, 156, 74, 9, PAL.wood);
    if (!o) {
      panelBox(g, 10, 14, 140, 28, 6, PAL.woodLight);
      panelBox(g, 10, 46, 140, 28, 6, PAL.woodLight);
      knob(g, 80, 28);
      knob(g, 80, 60);
    } else {
      rrect(g, 10, 14, 140, 22, 5, DARK);
      rrect(g, 20, 20, 50, 10, 2, PAL.cream);
      panelBox(g, 6, 28, 148, 30, 6, PAL.woodLight);
      knob(g, 80, 43);
      panelBox(g, 10, 60, 140, 16, 5, PAL.woodLight);
      knob(g, 80, 68);
    }
  },
  cabinet: (g, o) => {
    const c = 0x8fae9a;
    rrect(g, 14, 188, 18, 10, 3, PAL.woodDark);
    rrect(g, 148, 188, 18, 10, 3, PAL.woodDark);
    panelBox(g, 6, 4, 168, 186, 10, c);
    if (!o) {
      for (const x of [14, 92]) {
        panelBox(g, x, 12, 74, 170, 6, shade(c, 0.18));
        rrect(g, x + 8, 20, 58, 72, 4, shade(c, 0.06));
        rrect(g, x + 8, 100, 58, 72, 4, shade(c, 0.06));
      }
      knob(g, 80, 100);
      knob(g, 100, 100);
    } else {
      rrect(g, 14, 12, 152, 170, 6, DARK);
      rrect(g, 14, 64, 152, 6, 0, shade(c, -0.1));
      rrect(g, 14, 116, 152, 6, 0, shade(c, -0.1));
      rrect(g, 40, 38, 18, 26, 5, PAL.butter);
      rrect(g, 110, 90, 24, 26, 5, PAL.rose);
      poly(g, [14, 12, 36, 22, 36, 172, 14, 182], shade(c, 0.18));
      poly(g, [166, 12, 144, 22, 144, 172, 166, 182], shade(c, 0.18));
    }
  },
  fridge: (g, o) => {
    panelBox(g, 10, 6, 140, 286, 16, 0xeaf1ef);
    if (!o) {
      line(g, 12, 104, 148, 104, 3, 0x9fb1ae);
      rrect(g, 126, 36, 8, 48, 4, PAL.steel);
      rrect(g, 126, 120, 8, 84, 4, PAL.steel);
      rrect(g, 40, 60, 26, 30, 3, PAL.butter);
      rrect(g, 90, 150, 24, 20, 3, PAL.rose);
    } else {
      rrect(g, 18, 14, 124, 270, 10, 0xfff6dc);
      for (const y of [84, 136, 188, 240]) rrect(g, 18, y, 124, 6, 0, 0xcfe3e6);
      circle(g, 60, 72, 10, PAL.red);
      rrect(g, 90, 40, 24, 44, 5, PAL.cloud);
      rrect(g, 40, 108, 40, 28, 6, PAL.butter);
      rrect(g, 92, 160, 34, 28, 5, PAL.sage);
      circle(g, 56, 218, 11, PAL.terracotta);
      poly(g, [10, 6, 38, 18, 38, 276, 10, 292], 0xdfe8e6);
      rrect(g, 30, 120, 5, 56, 2, PAL.steel);
    }
  },
  sofa: (g, o) => {
    const c = PAL.terracotta;
    rrect(g, 20, 146, 16, 12, 3, PAL.woodDark);
    rrect(g, 324, 146, 16, 12, 3, PAL.woodDark);
    panelBox(g, 22, 14, 316, 86, 22, shade(c, -0.06));
    panelBox(g, 8, 96, 344, 46, 12, c);
    panelBox(g, 2, 50, 54, 96, 18, c);
    panelBox(g, 304, 50, 54, 96, 18, c);
    if (!o) {
      panelBox(g, 52, 66, 128, 56, 12, shade(c, 0.12));
      panelBox(g, 180, 66, 128, 56, 12, shade(c, 0.12));
      panelBox(g, 66, 30, 44, 44, 10, PAL.butter);
    } else {
      rrect(g, 52, 76, 256, 44, 8, DARK);
      rrect(g, 190, 100, 40, 12, 3, PAL.cloud);
      poly(g, [54, 40, 176, 34, 184, 84, 48, 90], shade(c, 0.22));
      panelBox(g, 186, 72, 122, 48, 12, shade(c, 0.12));
    }
  },
  table: (g, o) => {
    rrect(g, 60, 64, 12, 50, 4, shade(PAL.woodDark, -0.1));
    rrect(g, 228, 64, 12, 50, 4, shade(PAL.woodDark, -0.1));
    rrect(g, 26, 66, 18, 68, 5, PAL.woodDark);
    rrect(g, 256, 66, 18, 68, 5, PAL.woodDark);
    panelBox(g, 6, 16, 288, 28, 9, PAL.woodLight);
    panelBox(g, 30, 44, 240, 26, 6, PAL.wood);
    if (!o) {
      rrect(g, 70, 20, 160, 10, 3, PAL.teal);
      panelBox(g, 100, 48, 100, 18, 5, PAL.woodLight);
      knob(g, 150, 57);
    } else {
      rrect(g, 90, 20, 160, 10, 3, PAL.teal);
      rrect(g, 104, 48, 92, 12, 3, DARK);
      rrect(g, 112, 52, 30, 8, 2, PAL.cream);
      panelBox(g, 92, 60, 116, 22, 5, PAL.woodLight);
      knob(g, 150, 71);
    }
  },
  shelf: (g, o) => {
    panelBox(g, 8, 4, 204, 168, 8, PAL.wood);
    rrect(g, 16, 12, 188, 152, 4, 0x8a5a3a);
    rrect(g, 12, 60, 196, 8, 0, PAL.woodLight);
    rrect(g, 12, 110, 196, 8, 0, PAL.woodLight);
    books(g, 60, 0, -1, -1);
    books(g, 110, 2, o ? 4 : -1, o ? 5 : -1);
    panelBox(g, 28, 124, 50, 34, 5, PAL.butter);
    circle(g, 120, 142, 14, PAL.sage);
    rrect(g, 150, 128, 40, 30, 5, PAL.rose);
    if (o) poly(g, [96, 108, 118, 106, 108, 66, 90, 70], PAL.blue);
  },
  bed: (g, o) => {
    rrect(g, 14, 196, 26, 20, 4, PAL.woodDark);
    rrect(g, 380, 196, 26, 20, 4, PAL.woodDark);
    panelBox(g, 10, 6, 400, 110, 16, PAL.woodDark);
    panelBox(g, 26, 18, 368, 82, 10, shade(PAL.woodDark, 0.12));
    panelBox(g, 6, 92, 408, 108, 14, 0xf6efe6);
    if (!o) {
      panelBox(g, 36, 70, 150, 52, 22, PAL.cream);
      panelBox(g, 234, 70, 150, 52, 22, PAL.cream);
      panelBox(g, 6, 112, 408, 86, 14, PAL.blue);
      rrect(g, 10, 114, 400, 24, 10, shade(PAL.blue, 0.25));
      for (let x = 40; x < 400; x += 60) circle(g, x, 168, 5, shade(PAL.blue, 0.3));
    } else {
      panelBox(g, 234, 70, 150, 52, 22, PAL.cream);
      rrect(g, 36, 100, 150, 14, 6, PAL.shadow, 0.25);
      poly(g, rotPts([36, 56, 186, 56, 186, 108, 36, 108], 110, 96, -0.32), PAL.cream);
      poly(g, [6, 196, 6, 158, 290, 142, 414, 112, 414, 196], PAL.blue);
      poly(g, [6, 158, 290, 142, 414, 112, 414, 128, 290, 160, 6, 176], shade(PAL.blue, 0.28), null);
    }
  },
  wardrobe: (g, o) => {
    rrect(g, 20, 308, 22, 10, 3, PAL.woodDark);
    rrect(g, 158, 308, 22, 10, 3, PAL.woodDark);
    panelBox(g, 2, 2, 196, 18, 6, PAL.woodDark);
    panelBox(g, 8, 14, 184, 296, 12, PAL.wood);
    if (!o) {
      for (const x of [16, 102]) {
        panelBox(g, x, 24, 82, 278, 7, PAL.woodLight);
        rrect(g, x + 10, 38, 62, 110, 5, PAL.wood);
        rrect(g, x + 10, 160, 62, 130, 5, PAL.wood);
      }
      knob(g, 88, 170);
      knob(g, 112, 170);
    } else {
      rrect(g, 16, 24, 168, 278, 6, DARK);
      line(g, 20, 56, 180, 56, 4, PAL.steel);
      const cols = [PAL.blue, PAL.rose, PAL.butter, PAL.sage, PAL.terracotta];
      for (let i = 0; i < 5; i++) {
        const x = 46 + i * 26;
        poly(g, [x - 9, 60, x + 9, 60, x + 12, 120 + (i % 3) * 22, x - 12, 120 + (i % 3) * 22], cols[i]);
      }
      rrect(g, 16, 262, 168, 6, 0, PAL.woodLight);
      panelBox(g, 30, 272, 50, 26, 4, PAL.cloud);
      poly(g, [16, 24, 36, 34, 36, 292, 16, 302], PAL.woodLight);
      poly(g, [184, 24, 164, 34, 164, 292, 184, 302], PAL.woodLight);
    }
  },
  jacket: (g, o) => {
    const c = PAL.navy;
    softShadow(g, 45, 192, 60, 8, 0.12);
    line(g, 45, 4, 45, 16, 3, PAL.steel);
    line(g, 45, 16, 10, 36, 3, PAL.steel);
    line(g, 45, 16, 80, 36, 3, PAL.steel);
    panelBox(g, 2, 40, 22, 118, 11, shade(c, -0.05));
    panelBox(g, 66, 40, 22, 118, 11, shade(c, -0.05));
    panelBox(g, 14, 34, 62, 140, 14, c);
    poly(g, [30, 34, 45, 50, 60, 34, 52, 30, 45, 40, 38, 30], shade(c, 0.25));
    line(g, 45, 50, 45, 172, 2, PAL.steel);
    panelBox(g, 20, 122, 28, 24, 5, shade(c, -0.14));
    if (!o) {
      panelBox(g, 18, 118, 32, 11, 3, shade(c, 0.1));
    } else {
      rrect(g, 22, 128, 24, 16, 3, 0x241a15);
      rrect(g, 28, 116, 12, 16, 2, PAL.cream);
      poly(g, [18, 122, 50, 122, 54, 106, 16, 108], shade(c, 0.2));
    }
  },
  bagSpot: (g, o) => {
    const c = 0xd9a05b;
    softShadow(g, 55, 124, 80, 8, 0.14);
    circle(g, 55, 8, 5, PAL.steel);
    g.lineStyle(6, shade(c, -0.3), 1);
    g.beginPath();
    g.arc(55, 52, 24, Math.PI, 0, false);
    g.strokePath();
    if (!o) {
      panelBox(g, 14, 50, 82, 70, 10, c);
      panelBox(g, 14, 50, 82, 26, 10, shade(c, -0.1));
      circle(g, 55, 76, 5, PAL.gold);
    } else {
      rrect(g, 20, 48, 70, 18, 8, DARK);
      rrect(g, 36, 40, 38, 22, 3, PAL.cream);
      panelBox(g, 14, 60, 82, 60, 10, c);
      line(g, 20, 72, 90, 72, 2, shade(c, -0.25), 0.6);
    }
  },
  basket: (g, o) => {
    softShadow(g, 60, 134, 96, 8, 0.14);
    poly(g, [14, 54, 106, 54, 98, 132, 22, 132], PAL.woodLight);
    for (let y = 70; y < 130; y += 12) line(g, 18, y, 102, y, 2, PAL.shadow, 0.16);
    for (let x = 30; x < 100; x += 18) line(g, x, 56, x - 2, 130, 2, PAL.shadow, 0.1);
    panelBox(g, 8, 46, 104, 14, 6, PAL.wood);
    if (!o) {
      rrect(g, 20, 28, 40, 24, 10, PAL.blue);
      rrect(g, 50, 22, 40, 28, 12, PAL.rose);
      rrect(g, 70, 32, 34, 20, 9, PAL.butter);
    } else {
      g.fillStyle(DARK, 1);
      g.fillEllipse(60, 52, 90, 12);
      rrect(g, 26, 40, 30, 14, 6, PAL.blue);
      rrect(g, 86, 52, 18, 44, 8, PAL.rose);
      rrect(g, 66, 38, 22, 14, 6, PAL.butter);
    }
  },
  keyHook: (g, o) => {
    panelBox(g, 4, 6, 112, 66, 10, PAL.wood);
    if (!o) {
      panelBox(g, 10, 12, 100, 54, 8, PAL.woodLight);
      knob(g, 98, 39);
      circle(g, 28, 39, 6, shade(PAL.woodLight, -0.15));
      line(g, 34, 39, 56, 39, 3, shade(PAL.woodLight, -0.15));
    } else {
      rrect(g, 10, 12, 100, 54, 8, DARK);
      for (const x of [26, 52, 78]) {
        line(g, x, 20, x, 36, 3, PAL.gold);
        circle(g, x, 40, 4, PAL.gold);
      }
      poly(g, [110, 12, 92, 18, 92, 60, 110, 66], PAL.woodLight);
    }
  },
  shoeRack: (g, o) => {
    softShadow(g, 110, 106, 200, 8, 0.14);
    panelBox(g, 6, 4, 10, 98, 3, PAL.woodDark);
    panelBox(g, 204, 4, 10, 98, 3, PAL.woodDark);
    for (const y of [34, 72, 100]) panelBox(g, 6, y, 208, 8, 3, PAL.wood);
    const cs = [PAL.charcoal, PAL.terracotta, PAL.navy, PAL.woodDark, PAL.sageDark, PAL.rose];
    for (let i = 0; i < 6; i++) {
      const yb = i < 3 ? 34 : 72;
      const x = 26 + (i % 3) * 56;
      shoe(g, x, yb, cs[i], o ? [0.2, -0.15, 0.1, -0.25, 0.18, 0.3][i] : 0);
    }
    if (o) shoe(g, 62, 100, PAL.charcoal, -0.5);
  },
  sink: (g, o) => {
    panelBox(g, 12, 46, 176, 58, 8, PAL.wood);
    panelBox(g, 4, 30, 192, 16, 6, 0xdde3e6);
    g.fillStyle(0xb9d6e0, 1);
    g.fillEllipse(100, 30, 112, 14);
    g.fillStyle(0x8fb3c2, 1);
    g.fillEllipse(100, 31, 96, 9);
    line(g, 100, 10, 100, 26, 6, PAL.steel);
    line(g, 100, 10, 114, 10, 6, PAL.steel);
    circle(g, 72, 24, 4, PAL.steel);
    circle(g, 128, 24, 4, PAL.steel);
    panelBox(g, 100, 52, 82, 46, 5, PAL.woodLight);
    knob(g, 108, 75);
    if (!o) {
      panelBox(g, 18, 52, 82, 46, 5, PAL.woodLight);
      knob(g, 92, 75);
    } else {
      rrect(g, 18, 52, 82, 46, 5, DARK);
      g.lineStyle(5, PAL.steel, 1);
      g.beginPath();
      g.arc(59, 66, 12, 0, Math.PI, false);
      g.strokePath();
      poly(g, [18, 52, 32, 56, 32, 94, 18, 98], PAL.woodLight);
    }
  },
  tv: (g, o) => {
    panelBox(g, 38, 128, 184, 30, 8, PAL.woodDark);
    rrect(g, 50, 156, 14, 10, 3, PAL.woodDark);
    rrect(g, 196, 156, 14, 10, 3, PAL.woodDark);
    panelBox(g, 14, 6, 232, 122, 12, 0x2b2f38, 0x14171c);
    if (!o) {
      rrect(g, 24, 16, 212, 102, 6, 0x1c2128);
      poly(g, [30, 22, 110, 22, 60, 112, 30, 112], PAL.white, null, 0.06);
      circle(g, 130, 123, 2, PAL.red);
    } else {
      vgrad(g, 24, 16, 212, 102, PAL.blue, PAL.sky, 6);
      g.fillStyle(PAL.butter, 1);
      g.fillCircle(190, 42, 12);
      poly(g, [24, 118, 100, 62, 160, 118], PAL.green, null);
      poly(g, [110, 118, 180, 74, 236, 118], PAL.sageDark, null);
    }
  },
  charger: (g, o) => {
    softShadow(g, 45, 54, 76, 6, 0.14);
    panelBox(g, 8, 26, 74, 26, 9, 0xf3efe6);
    g.lineStyle(4, 0x2f353d, 1);
    g.beginPath();
    g.moveTo(80, 38);
    g.lineTo(86, 44);
    g.lineTo(84, 54);
    g.strokePath();
    if (!o) {
      panelBox(g, 12, 18, 66, 12, 5, PAL.charcoal);
      circle(g, 45, 24, 2, 0x888888);
    } else {
      rrect(g, 14, 28, 60, 6, 3, PAL.shadow, 0.3);
      poly(g, [12, 22, 78, 8, 80, 18, 14, 32], PAL.charcoal);
      circle(g, 70, 14, 2, PAL.green);
    }
  },
  rug: (g, o) => {
    const c = 0x6fa5a8;
    if (!o) {
      panelBox(g, 10, 30, 280, 130, 22, c);
      rrect(g, 22, 42, 256, 106, 14, shade(c, 0.18));
      rrect(g, 34, 54, 232, 82, 10, c);
    } else {
      poly(g, [32, 30, 268, 30, 290, 52, 290, 108, 238, 160, 32, 160, 10, 138, 10, 52], c);
      rrect(g, 22, 42, 242, 104, 14, shade(c, 0.18));
      rrect(g, 34, 54, 220, 76, 10, c);
    }
    poly(g, [150, 60, 210, 95, 150, 130, 90, 95], PAL.butter, shade(PAL.butter, -0.3));
    for (let y = 44; y < 150; y += 12) {
      line(g, 4, y, 10, y, 2, PAL.cream);
      line(g, 290, y, 296, y, 2, PAL.cream);
    }
    if (o) {
      g.fillStyle(PAL.shadow, 0.22);
      g.fillEllipse(258, 160, 56, 10);
      poly(g, [290, 108, 238, 160, 274, 150], shade(c, 0.5));
    }
  },
  plant: (g, o) => {
    softShadow(g, 50, 194, 70, 8, 0.15);
    const cx = 50;
    const cy = 132;
    const degs = o ? [-18, -42, -138, -162, -66, -114] : [-90, -62, -118, -40, -140, -76, -104];
    degs.forEach((d, i) => leaf(g, cx, cy, d, 62 + (i % 3) * 8, 14, i % 2 ? PAL.green : PAL.sageDark));
    poly(g, [24, 140, 76, 140, 68, 192, 32, 192], PAL.terracotta);
    panelBox(g, 18, 130, 64, 16, 6, shade(PAL.terracotta, 0.1));
    g.fillStyle(DARK, 1);
    g.fillEllipse(50, 134, 50, 7);
  },
  papers: (g, o) => {
    softShadow(g, 60, 70, 100, 8, 0.14);
    if (!o) {
      sheet(g, 54, 44, -0.1, PAL.cloud);
      sheet(g, 62, 41, 0.06, PAL.white);
      sheet(g, 58, 37, -0.03, PAL.cloud);
    } else {
      sheet(g, 52, 44, -0.35, PAL.cloud);
      sheet(g, 60, 42, -0.1, PAL.white);
      sheet(g, 68, 42, 0.18, PAL.cloud);
      sheet(g, 74, 40, 0.42, PAL.white);
      panelBox(g, 82, 30, 26, 24, 3, PAL.butter);
    }
  },
  bin: (g, o) => {
    const c = 0x8fa7b8;
    softShadow(g, 40, 94, 66, 7, 0.15);
    poly(g, [12, 34, 68, 34, 62, 94, 18, 94], c);
    for (const x of [26, 40, 54]) line(g, x, 40, x - 1 + (x > 40 ? 2 : 0), 90, 2, PAL.shadow, 0.18);
    if (!o) {
      panelBox(g, 6, 24, 68, 12, 6, shade(c, -0.1));
      panelBox(g, 32, 16, 16, 9, 4, PAL.steel);
    } else {
      g.fillStyle(DARK, 1);
      g.fillEllipse(40, 35, 52, 9);
      circle(g, 48, 32, 5, PAL.cream);
      poly(g, rotPts([6, 24, 74, 24, 74, 36, 6, 36], 6, 30, -0.55), shade(c, -0.1));
    }
  },
};

export function drawSpot(g: G, kind: SpotKind, open: boolean, w: number = SPOT_SIZE[kind].w, h: number = SPOT_SIZE[kind].h): void {
  const base = SPOT_SIZE[kind];
  const scaled = w !== base.w || h !== base.h;
  const generalShadow = kind !== 'jacket' && kind !== 'bagSpot' && kind !== 'basket' && kind !== 'shoeRack' && kind !== 'charger'
    && kind !== 'plant' && kind !== 'papers' && kind !== 'bin';
  if (scaled) {
    g.save();
    g.scaleCanvas(w / base.w, h / base.h);
  }
  if (generalShadow && kind !== 'rug') softShadow(g, base.w / 2, base.h - 5, base.w * 0.86, 10);
  KINDS[kind](g, open);
  if (scaled) g.restore();
}
