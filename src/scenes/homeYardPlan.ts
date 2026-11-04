import { ROOM_SIZE, HOUSE_MAP_V2 } from '../content/world';
import type { WorldRoom } from '../content/world';

/** One decorative yard piece: art key, cell on the global iso grid (cell centre), ground-anchored. */
export interface YardItem { key: string; gx: number; gy: number }

const X0 = -4; const Y0 = -3;
const x1 = Math.max(...HOUSE_MAP_V2.map((s) => s.wx + ROOM_SIZE[s.room as WorldRoom].w));
const y1 = Math.max(...HOUSE_MAP_V2.map((s) => s.wy + ROOM_SIZE[s.room as WorldRoom].d));
const FRONT = y1 + 3; // fence row (cells), 3 cells of lawn in front of the house
const GATE = 4;       // entrance room: gate, path and porch share this column

/** Pure plan of the whole exterior (lawn, path, porch, fence, trees, bushes, flowers, mailbox). Painter order = gx + gy. */
export function yardPlan(): YardItem[] {
  const out: YardItem[] = [];
  const add = (key: string, gx: number, gy: number): void => { out.push({ key, gx, gy }); };
  for (let gy = Y0; gy <= FRONT; gy++) for (let gx = X0; gx <= x1 + 3; gx++) {
    const underHouse = gx >= 0 && gx < x1 && gy >= 0 && gy < y1;
    if (!underHouse) add(`yard/lawn_${(gx * 7 + gy * 3 + 99) % 3}`, gx, gy);
  }
  for (let gy = y1; gy < FRONT; gy++) add('yard/path', GATE, gy);
  for (let gx = GATE - 1; gx <= GATE + 1; gx++) add('porch/floor', gx, y1);
  add('porch/steps', GATE, y1 + 1);
  add('porch/mat', GATE, y1);
  add('porch/plant', GATE - 1, y1);
  add('porch/lamp', GATE + 1, y1);
  for (let gx = X0 + 1; gx <= x1 + 2; gx++) if (gx !== GATE) add('yard/fence_r', gx, FRONT);
  add('yard/fence_gate', GATE, FRONT);
  add('yard/fence_corner', X0, FRONT);
  add('yard/fence_corner', x1 + 3, FRONT);
  for (let gy = Y0 + 1; gy < FRONT; gy += 1) { add('yard/fence_l', X0, gy); add('yard/fence_l', x1 + 3, gy); }
  add('yard/tree_0', X0 + 1, 1); add('yard/tree_1', X0 + 1, 6); add('yard/tree_0', x1 + 2, 2); add('yard/tree_1', x1 + 2, 7);
  [7, 11, 16, 22, 27].forEach((gx, i) => add(`yard/bush_${i % 3}`, gx, y1 + 1));
  [2, 9, 14, 20, 25].forEach((gx, i) => add(`yard/flowers_${i % 4}`, gx, y1 + 2));
  add('yard/mailbox', GATE + 2, FRONT - 1);
  return out.sort((a, b) => a.gx + a.gy - (b.gx + b.gy));
}

