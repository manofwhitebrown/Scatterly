import type Phaser from 'phaser';
import { GAME_H, GAME_W } from '../shared/types';
import { PAL, makeButton, makeText, panelBox } from '../art/palette';
import { BTN_H } from './layout';

/** First-time "how to play" card. `onClose` fires once, from the Got it button or from `close()` (Android Back). */
export function buildHowToCard(scene: Phaser.Scene, title: string, text: string, onClose: () => void): { close(): void } {
  const c = scene.add.container(0, 0).setDepth(70);
  let closed = false;
  const close = (): void => {
    if (closed) return;
    closed = true;
    c.destroy();
    onClose();
  };
  const dim = scene.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x000000, 0.5).setInteractive();
  const bg = scene.add.graphics();
  panelBox(bg, GAME_W / 2 - 360, GAME_H / 2 - 170, 720, 340, 24, PAL.panel, PAL.panelEdge, 4);
  const head = makeText(scene, GAME_W / 2, GAME_H / 2 - 120, `How to play: ${title}`, 34, PAL.ink, { bold: true, ox: 0.5, oy: 0.5, align: 'center', wrap: 660 });
  const body = makeText(scene, GAME_W / 2, GAME_H / 2 - 30, text, 30, PAL.ink, { ox: 0.5, oy: 0.5, align: 'center', wrap: 640 });
  const ok = makeButton(scene, GAME_W / 2, GAME_H / 2 + 100, 280, BTN_H, 'Got it', close, { fill: PAL.terracotta, size: 32 });
  c.add([dim, bg, head, body, ok.g, ok.label]);
  return { close };
}
