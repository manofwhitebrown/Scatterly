import Phaser from 'phaser';
import { LAYOUT } from '../core/layout';
import type { RoomId } from '../shared/types';
import { centre, hudBoxes, navBox } from '../ui/hudLayout';
import type { Box } from '../ui/hudLayout';
import { COLOR, DEPTH, ROOM_LABEL, drawPlate, makeText } from '../ui/theme';

/** A plate button with a fixed box (so it can never grow into its neighbours). */
function chip(scene: Phaser.Scene, box: Box, label: string, cb: () => void, size = 24): Phaser.GameObjects.Container {
  const at = centre(box);
  const c = scene.add.container(at.x, at.y).setDepth(DEPTH.hud);
  const plate = scene.add.graphics();
  drawPlate(plate, -box.w / 2, -box.h / 2, box.w, box.h, 0, COLOR.plateLight, COLOR.plateEdge);
  const t = makeText(scene, 0, 0, label, { fontSize: `${size}px`, color: '#2a1d14' }).setOrigin(0.5);
  c.add([plate, t]).setSize(box.w, box.h).setInteractive({ useHandCursor: true });
  c.on('pointerup', cb);
  return c;
}

export interface ChromeOpts {
  /** Is a morning running? (The chip and room buttons only exist then.) */
  run: boolean;
  /** Rooms next to the focused one that the case uses. */
  near: readonly RoomId[];
  onShow(): void;
  onGo(room: RoomId): void;
}

/**
 * The Focus chrome that is not part of `Hud`: a compact "Look" chip at the bottom-left (shows the tappable pieces) and the
 * neighbouring-room buttons as a column at the bottom-right. Positions come from the pure grid in `ui/hudLayout`.
 */
export function buildHomeChrome(scene: Phaser.Scene, o: ChromeOpts): Phaser.GameObjects.Container[] {
  const out: Phaser.GameObjects.Container[] = [];
  if (!o.run) return out;
  out.push(chip(scene, hudBoxes(LAYOUT.w, LAYOUT.h, 0, 0).show, 'Look', o.onShow));
  o.near.forEach((to, i) => out.push(chip(scene, navBox(LAYOUT.w, LAYOUT.h, i), ROOM_LABEL[to], () => o.onGo(to))));
  return out;
}
