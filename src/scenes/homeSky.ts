import Phaser from 'phaser';
import pal from '../../docs/art/palette.json';
import { GAME_H, GAME_W } from '../shared/types';

const hex = (s: string): number => parseInt(s.slice(1), 16);
const R = pal.ramps;

/** Sky bands top to bottom (blue to peach at the horizon), all from the 64-colour palette. */
export const SKY_BANDS: readonly number[] = [R.sky[2], R.sky[3], R.sky[4], R.butter[4], R.rose[4], R.terracotta[4]].map(hex);
export const SKY_TIMES = { morning: hex(pal.dayNight.morning), noon: hex(pal.dayNight.noon), dusk: hex(pal.dayNight.dusk), night: hex(pal.dayNight.night) } as const;
export type SkyTime = keyof typeof SKY_TIMES;

export const SKY_W = 1800;
export const SKY_H = 1000;
export const PARALLAX = 0.3;
const HORIZON = 620;
const B = 6; // one backdrop pixel = 6 game px (2 art px), so it reads as chunky pixel art
const CLOUDS = 6;

/** Ground-line height of a hill layer at column x (deterministic, smooth, no random). */
export function hillY(x: number, layer: 0 | 1): number {
  const a = layer === 0 ? 70 : 46;
  const f = layer === 0 ? 0.0042 : 0.0071;
  const ph = layer === 0 ? 1.3 : 4.1;
  return Math.round((HORIZON + 40 - a - Math.sin(x * f + ph) * a * 0.55 - Math.sin(x * f * 2.3 + ph) * a * 0.22) / B) * B;
}

function bakeSky(scene: Phaser.Scene): Phaser.GameObjects.RenderTexture {
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  const bandH = HORIZON / SKY_BANDS.length;
  SKY_BANDS.forEach((c, i) => { g.fillStyle(c, 1).fillRect(0, i * bandH, SKY_W, bandH + 1); });
  const sx = 1180; const sy = 300;
  const disc = (r: number, c: number, a: number): void => {
    g.fillStyle(c, a);
    for (let y = -r; y < r; y += B) { const half = Math.floor(Math.sqrt(r * r - y * y) / B) * B; g.fillRect(sx - half, sy + y, half * 2, B); }
  };
  disc(150, hex(R.butter[4]), 0.22); disc(96, hex(R.butter[4]), 0.4); disc(54, hex(R.butter[3]), 1);
  g.fillStyle(hex(R.sage[2]), 1).fillRect(0, HORIZON, SKY_W, SKY_H - HORIZON);
  const hill = (layer: 0 | 1, col: number): void => {
    g.fillStyle(col, 1);
    for (let x = 0; x < SKY_W; x += B) { const y = hillY(x, layer); g.fillRect(x, y, B, SKY_H - y); }
  };
  hill(0, hex(R.sage[3]));
  g.fillStyle(hex(R.sage[1]), 1); // far tree line: pixel trees standing on the far hill
  for (let x = 12; x < SKY_W; x += 42) { const y = hillY(x, 0); const h = 24 + ((x * 7) % 18); g.fillRect(x, y - h, 24, h + 2).fillRect(x + 6, y - h - 6, 12, 6); }
  hill(1, hex(R.sage[2]));
  const out = scene.make.renderTexture({ x: 0, y: 0, width: SKY_W, height: SKY_H }, false);
  out.draw(g);
  g.destroy();
  return out;
}

function bakeCloud(scene: Phaser.Scene): void {
  if (scene.textures.exists('sky-cloud')) return;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(0xffffff, 0.95);
  g.fillRect(24, 24, 120, 24).fillRect(48, 6, 54, 18).fillRect(0, 36, 168, 12).fillRect(96, 12, 36, 12);
  g.fillStyle(hex(R.sky[4]), 1).fillRect(12, 48, 150, 6);
  g.generateTexture('sky-cloud', 168, 54);
  g.destroy();
}

/**
 * Procedural morning backdrop behind the house: baked once (RenderTexture), never interactive, parallax 0.3 against the
 * world camera. Clouds drift 1 px per second (a 1 s timer, none at all when calm). Works with no art frames.
 */
export class HomeSky {
  readonly root: Phaser.GameObjects.Container;
  private readonly tex: Phaser.GameObjects.RenderTexture;
  private readonly clouds: Phaser.GameObjects.Image[] = [];
  private readonly timer: Phaser.Time.TimerEvent | null;

  constructor(scene: Phaser.Scene, calm: boolean, time: SkyTime = 'morning') {
    this.tex = bakeSky(scene);
    this.tex.setTint(SKY_TIMES[time]);
    bakeCloud(scene);
    this.root = scene.add.container(0, 0, [this.tex]).setDepth(-100);
    this.tex.setOrigin(0.5, 0.5);
    for (let i = 0; i < CLOUDS; i++) {
      const c = scene.add.image(-SKY_W / 2 + 150 + i * 280, -SKY_H / 2 + 70 + ((i * 97) % 220), 'sky-cloud').setScale(1 + (i % 3) * 0.5).setAlpha(0.9).setTint(SKY_TIMES[time]);
      this.clouds.push(c);
      this.root.add(c);
    }
    this.timer = calm ? null : scene.time.addEvent({ delay: 1000, loop: true, callback: () => this.drift() });
  }

  private drift(): void {
    for (const c of this.clouds) { c.x += 1; if (c.x > SKY_W / 2 + 100) c.x = -SKY_W / 2 - 100; }
  }

  /** Parallax: the backdrop follows the camera at PARALLAX of the world's motion and zoom. */
  sync(cam: { zoom: number; cx: number; cy: number }, base: { zoom: number; cx: number; cy: number }): void {
    const k = 1 + PARALLAX * (cam.zoom / base.zoom - 1);
    this.root.setScale(k).setPosition(GAME_W / 2 - (cam.cx - base.cx) * cam.zoom * PARALLAX, GAME_H / 2 - (cam.cy - base.cy) * cam.zoom * PARALLAX);
  }

  destroy(): void {
    this.timer?.remove(false);
    this.root.destroy();
    this.clouds.length = 0;
  }
}
