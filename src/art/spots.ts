import { SPOT_SIZE } from '../shared/types';
import type { SpotKind } from '../shared/types';
import { PAL, circle, line, panelBox, poly, rotPts, rrect, shade, softShadow, vgrad } from './palette';
import type { G } from './palette';
import { knob, leaf, shoe, books, sheet } from './props';

import { DARK, KINDS_B } from './spotsB';
import type { Draw } from './spotsB';

const KINDS_A: Partial<Record<SpotKind, Draw>> = {
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
};

const KINDS = { ...KINDS_A, ...KINDS_B } as Record<SpotKind, Draw>;

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
