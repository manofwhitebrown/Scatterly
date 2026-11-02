import type Phaser from 'phaser';
import { tex } from '../shared/types';
import { bake } from '../art/palette';

/** Bakes the five shared fx textures once. Idempotent and safe on Boot retry. */
export function ensureFxTextures(scene: Phaser.Scene): void {
  try {
    bake(scene, tex.fx('dot'), 16, 16, (g) => {
      g.fillStyle(0xffffff, 1);
      g.fillCircle(8, 8, 7);
    });
    bake(scene, tex.fx('mote'), 16, 16, (g) => {
      g.fillStyle(0xffffff, 0.35);
      g.fillCircle(8, 8, 8);
      g.fillStyle(0xffffff, 0.9);
      g.fillCircle(8, 8, 3.5);
    });
    bake(scene, tex.fx('ring'), 64, 64, (g) => {
      g.lineStyle(5, 0xffffff, 1);
      g.strokeCircle(32, 32, 27);
    });
    bake(scene, tex.fx('star'), 24, 24, (g) => {
      g.fillStyle(0xffffff, 1);
      g.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? 11 : 4.6;
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const px = 12 + Math.cos(a) * r;
        const py = 12 + Math.sin(a) * r;
        if (i === 0) g.moveTo(px, py);
        else g.lineTo(px, py);
      }
      g.closePath();
      g.fillPath();
    });
    bake(scene, tex.fx('confetti'), 12, 8, (g) => {
      g.fillStyle(0xffffff, 1);
      g.fillRect(0, 0, 12, 8);
    });
  } catch {
    /* fx stays invisible rather than breaking the game */
  }
}
