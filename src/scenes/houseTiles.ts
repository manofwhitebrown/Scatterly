import Phaser from 'phaser';
import { buildHouseFrame } from '../art/isoHouse';
import { MINI_K, prefetchRoomShells, shellKey, shellSize } from '../art/isoShell';
import { specFor } from '../art/isoTheme';
import { HOUSE_MAP } from '../content/layout';
import type { RoomId } from '../shared/types';

export const TILE_COL_X = 300;
export const TILE_COL_STEP = 340;
export const TILE_FLOOR_Y = [440, 215] as const;
const LOCKED_TINT = 0x555555;

export interface HouseTile { room: RoomId; x: number; y: number; img: Phaser.GameObjects.Image; open: boolean }

/**
 * The cutaway house: AI-4's frame behind one crisp mini shell per HOUSE_MAP slot. Shells bake one per frame; each
 * image appears as its texture does. Shared by the Dollhouse scene and the (non-interactive) Menu backdrop.
 */
export function buildHouseTiles(scene: Phaser.Scene, unlocked: readonly RoomId[], alpha = 1): HouseTile[] {
  let tileW = 0;
  let tileH = 0;
  for (const slot of HOUSE_MAP) {
    const s = specFor(slot.room);
    const sz = shellSize(s.cols, s.rows, MINI_K);
    tileW = Math.max(tileW, sz.w);
    tileH = Math.max(tileH, sz.h);
  }
  buildHouseFrame(scene, { colX: TILE_COL_X, colStep: TILE_COL_STEP, cols: 3, floorY: TILE_FLOOR_Y, tileW, tileH });
  const tiles: HouseTile[] = HOUSE_MAP.map((slot) => {
    const x = TILE_COL_X + slot.col * TILE_COL_STEP;
    const y = TILE_FLOOR_Y[slot.floor];
    const open = unlocked.includes(slot.room);
    const img = scene.add.image(x, y, shellKey(slot.room, true)).setAlpha(alpha).setVisible(false);
    if (!open) img.setTint(LOCKED_TINT);
    return { room: slot.room, x, y, img, open };
  });
  const reveal = (): void => {
    for (const t of tiles) if (!t.img.visible && scene.textures.exists(shellKey(t.room, true))) t.img.setVisible(true);
  };
  reveal();
  if (tiles.some((t) => !t.img.visible)) {
    prefetchRoomShells(scene, tiles.map((t) => t.room), true);
    scene.time.addEvent({ delay: 60, loop: true, callback: reveal });
  }
  return tiles;
}
