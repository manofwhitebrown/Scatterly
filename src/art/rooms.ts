import type { LegacyRoomId, RoomId } from '../shared/types';
import { PAL, line, panelBox, poly, rrect, shade, vgrad, vgradA } from './palette';
import type { G } from './palette';

type WallPattern = 'stripes' | 'dots' | 'grid' | 'plain';

interface RoomLook {
  wall: number; wallLow: number; trim: number; floor: number; floorAlt: number;
  tiles: boolean; pattern: WallPattern; sky: [number, number];
  win: { x: number; y: number; w: number; h: number; curtain: number | null; frosted: boolean };
}

const LOOK_PHASE3: Record<LegacyRoomId, RoomLook> = {
  entrance: {
    wall: 0xf0d0ae, wallLow: 0xe2b98f, trim: 0xfff1dc, floor: 0xb48257, floorAlt: 0xa97650, tiles: false, pattern: 'stripes',
    sky: [0xcfe6f2, 0xf6e7c8], win: { x: 520, y: 42, w: 200, h: 120, curtain: 0xd8795a, frosted: false },
  },
  living: {
    wall: 0xc9d8b6, wallLow: 0xb4c79f, trim: 0xf8f1e2, floor: 0xa97a52, floorAlt: 0x9d6f49, tiles: false, pattern: 'dots',
    sky: [0xb7dcee, 0xf4eccf], win: { x: 300, y: 36, w: 300, h: 126, curtain: 0xe3a76a, frosted: false },
  },
  kitchen: {
    wall: 0xf6dc94, wallLow: 0xe9c76f, trim: 0xffffff, floor: 0xf1e6cf, floorAlt: 0xb9cba7, tiles: true, pattern: 'grid',
    sky: [0xc4e4f2, 0xfaf0d2], win: { x: 760, y: 40, w: 240, h: 120, curtain: null, frosted: false },
  },
  bedroom: {
    wall: 0xb8cde0, wallLow: 0xa3bbd2, trim: 0xf6f2ec, floor: 0xd0a878, floorAlt: 0xc59d6d, tiles: false, pattern: 'stripes',
    sky: [0x9cc4e4, 0xe8e2ef], win: { x: 620, y: 36, w: 260, h: 126, curtain: 0xf0b8c0, frosted: false },
  },
  bathroom: {
    wall: 0xbfe3e0, wallLow: 0xa6d2cf, trim: 0xffffff, floor: 0xeef3f2, floorAlt: 0xcfe6e4, tiles: true, pattern: 'grid',
    sky: [0xe6f3f6, 0xf6fbfc], win: { x: 540, y: 52, w: 150, h: 104, curtain: null, frosted: true },
  },
};

/** Phase 4 stub looks for the new rooms. */
const LOOK: Record<RoomId, RoomLook> = {
  ...LOOK_PHASE3,
  laundry: LOOK_PHASE3.bathroom, study: LOOK_PHASE3.living, balcony: LOOK_PHASE3.entrance, garden: LOOK_PHASE3.living,
};

const ROW_Y = [440, 468, 500, 536, 578, 626, 680, 720];

function wall(g: G, look: RoomLook): void {
  vgrad(g, 0, 0, 1280, 440, look.wall, look.wallLow, 10);
  if (look.pattern === 'stripes') {
    for (let x = 0; x < 1280; x += 64) rrect(g, x, 0, 32, 424, 0, PAL.white, 0.06);
  } else if (look.pattern === 'dots') {
    g.fillStyle(PAL.white, 0.12);
    for (let y = 28; y < 420; y += 56) for (let x = 28 + ((y / 56) % 2) * 28; x < 1280; x += 56) g.fillCircle(x, y, 3);
  } else if (look.pattern === 'grid') {
    for (let x = 0; x <= 1280; x += 64) line(g, x, 0, x, 424, 2, PAL.shadow, 0.05);
    for (let y = 0; y <= 424; y += 64) line(g, 0, y, 1280, y, 2, PAL.shadow, 0.05);
  }
  vgradA(g, 0, 0, 1280, 220, PAL.white, 0.16, 0, 6);
  vgradA(g, 0, 330, 1280, 100, PAL.shadow, 0, 0.12, 6);
  g.fillStyle(PAL.white, 0.05);
  g.fillEllipse(0, 0, 1300, 700);
  g.fillEllipse(0, 0, 900, 480);
  rrect(g, 0, 420, 1280, 20, 0, look.trim);
  rrect(g, 0, 420, 1280, 3, 0, PAL.white, 0.6);
  rrect(g, 0, 436, 1280, 4, 0, PAL.shadow, 0.18);
}

function floorBoards(g: G, look: RoomLook): void {
  for (let r = 0; r < ROW_Y.length - 1; r++) {
    const y = ROW_Y[r];
    const h = ROW_Y[r + 1] - y;
    rrect(g, 0, y, 1280, h, 0, r % 2 === 0 ? look.floor : look.floorAlt);
    line(g, 0, y, 1280, y, 2, PAL.shadow, 0.22);
    const len = 260 + r * 24;
    for (let x = -((r * 97) % len); x < 1280; x += len) line(g, x, y, x, y + h, 2, PAL.shadow, 0.16);
    line(g, 0, y + 3, 1280, y + 3, 1, PAL.white, 0.1);
  }
}

function floorTiles(g: G, look: RoomLook): void {
  for (let r = 0; r < ROW_Y.length - 1; r++) {
    const y = ROW_Y[r];
    const h = ROW_Y[r + 1] - y;
    const tw = 66 + r * 12;
    const x0 = 640 - Math.ceil(640 / tw) * tw;
    for (let c = 0, x = x0; x < 1280; x += tw, c++) {
      rrect(g, x, y, tw, h, 0, (c + r) % 2 === 0 ? look.floor : look.floorAlt);
      line(g, x, y, x, y + h, 2, PAL.shadow, 0.14);
    }
    line(g, 0, y, 1280, y, 2, PAL.shadow, 0.18);
  }
}

function windowAt(g: G, look: RoomLook): void {
  const { x, y, w, h, curtain, frosted } = look.win;
  const frame = shade(look.trim, -0.06);
  panelBox(g, x - 8, y - 8, w + 16, h + 16, 8, frame);
  vgrad(g, x, y, w, h, look.sky[0], look.sky[1], 8);
  if (frosted) {
    for (let i = 0; i < 6; i++) line(g, x + 10, y + 14 + i * 16, x + w - 10, y + 14 + i * 16, 2, PAL.white, 0.35);
  } else {
    g.fillStyle(PAL.white, 0.5);
    g.fillCircle(x + w * 0.2, y + h * 0.28, 12);
    g.fillStyle(PAL.white, 0.7);
    g.fillEllipse(x + w * 0.62, y + h * 0.35, 54, 18);
    g.fillEllipse(x + w * 0.72, y + h * 0.3, 36, 14);
  }
  line(g, x + w / 2, y, x + w / 2, y + h, 5, frame);
  if (w > 220) line(g, x, y + h / 2, x + w, y + h / 2, 5, frame);
  rrect(g, x - 14, y + h + 6, w + 28, 9, 4, shade(frame, -0.1));
  rrect(g, x - 14, y + h + 6, w + 28, 3, 2, PAL.white, 0.5);
  if (curtain !== null) {
    for (const side of [-1, 1]) {
      const cx = side < 0 ? x - 34 : x + w - 2;
      panelBox(g, cx, y - 16, 36, h + 30, 10, curtain);
      for (let i = 1; i < 3; i++) line(g, cx + i * 12, y - 8, cx + i * 12, y + h + 8, 2, PAL.shadow, 0.12);
    }
    rrect(g, x - 44, y - 22, w + 88, 8, 4, shade(curtain, -0.3));
  }
  poly(g, [x + 60, 440, x + w + 60, 440, x + w + 230, 650, x + 230, 650], PAL.white, null, 0.07);
}

function picture(g: G, x: number, y: number, w: number, h: number, hue: number): void {
  panelBox(g, x, y, w, h, 6, PAL.woodDark);
  vgrad(g, x + 8, y + 8, w - 16, h - 16, shade(hue, 0.5), shade(hue, 0.2), 4);
  poly(g, [x + 8, y + h - 8, x + w * 0.4, y + h * 0.45, x + w * 0.62, y + h - 8], shade(hue, -0.1), null);
  poly(g, [x + w * 0.45, y + h - 8, x + w * 0.7, y + h * 0.55, x + w - 8, y + h - 8], shade(hue, -0.25), null);
  g.fillStyle(PAL.butter, 1);
  g.fillCircle(x + w * 0.76, y + h * 0.28, Math.max(4, w * 0.07));
}

function extras(g: G, id: RoomId): void {
  if (id === 'entrance') {
    picture(g, 860, 48, 90, 76, PAL.sage);
  } else if (id === 'living') {
    picture(g, 860, 44, 120, 84, PAL.blue);
    picture(g, 1010, 60, 64, 64, PAL.terracotta);
  } else if (id === 'kitchen') {
    line(g, 160, 64, 420, 64, 5, PAL.steel);
    for (let i = 0; i < 5; i++) {
      const hx = 190 + i * 52;
      line(g, hx, 64, hx, 84, 3, PAL.steel);
      rrect(g, hx - 7, 84, 14, 40 + (i % 3) * 8, 6, i % 2 ? PAL.woodDark : PAL.charcoal);
    }
  } else if (id === 'bedroom') {
    picture(g, 240, 56, 80, 70, PAL.rose);
    picture(g, 340, 62, 60, 60, PAL.butter);
  } else {
    line(g, 860, 70, 1040, 70, 5, PAL.steel);
    panelBox(g, 880, 72, 70, 72, 6, PAL.teal);
    panelBox(g, 962, 72, 62, 56, 6, PAL.cream);
    picture(g, 1120, 56, 60, 70, PAL.sky);
  }
}

export function drawRoom(g: G, id: RoomId): void {
  const look = LOOK[id];
  wall(g, look);
  if (look.tiles) floorTiles(g, look);
  else floorBoards(g, look);
  vgradA(g, 0, 440, 1280, 130, PAL.shadow, 0.22, 0, 8);
  vgradA(g, 0, 600, 1280, 120, PAL.shadow, 0, 0.1, 6);
  windowAt(g, look);
  extras(g, id);
}
