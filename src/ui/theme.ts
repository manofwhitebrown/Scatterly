import Phaser from 'phaser';
import { defaultProfile } from '../core/save';
import { GAME_H, GAME_W } from '../shared/types';
import type { PlayerProfile, RoomId } from '../shared/types';

/** Safe margin from every screen edge (px). */
export const SAFE = 24;

export const COLOR = {
  bg: 0x2a2018,
  plate: 0x3b2e23,
  plateLight: 0x56422f,
  plateEdge: 0x1c130d,
  cream: 0xf7ecd4,
  paper: 0xfbf1d8,
  paperEdge: 0xd8c291,
  amber: 0xf2a93b,
  amberDark: 0xc4781a,
  red: 0xdb5a4b,
  redDark: 0x9b3329,
  green: 0x74c07a,
  ink: 0x3a2c1f,
  cork: 0x7b5736,
  corkDark: 0x5e4129,
} as const;

export const CSS = {
  cream: '#f7ecd4',
  muted: '#cdbc9c',
  amber: '#f2a93b',
  red: '#ff7a6b',
  green: '#8fd694',
  ink: '#3a2c1f',
} as const;

export const FONT = 'system-ui, "Segoe UI", Roboto, sans-serif';

export const SIZE = { body: 24, label: 26, button: 28, heading: 40, title: 56 } as const;

export const DEPTH = { hud: 100, dim: 190, panel: 200, board: 300, cardDim: 390, card: 400, fly: 500, toast: 1000 } as const;

export const ROOM_LABEL: Record<RoomId, string> = {
  entrance: 'Entrance',
  living: 'Living',
  kitchen: 'Kitchen',
  bedroom: 'Bedroom',
  bathroom: 'Bathroom',
};

/** Creates a Text once (resolution 2 for crisp phone rendering). Change it later with setText only when the value changes. */
export function makeText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  str: string,
  style: Phaser.Types.GameObjects.Text.TextStyle = {},
): Phaser.GameObjects.Text {
  return scene.add.text(x, y, str, {
    fontFamily: FONT,
    fontSize: `${SIZE.body}px`,
    color: CSS.cream,
    ...style,
    resolution: 2,
  });
}

export function drawPlate(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: number,
  edge?: number,
): void {
  g.fillStyle(fill, 1);
  g.fillRoundedRect(x, y, w, h, r);
  if (edge !== undefined) {
    g.lineStyle(3, edge, 1);
    g.strokeRoundedRect(x, y, w, h, r);
  }
}

export function getProfile(scene: Phaser.Scene): PlayerProfile {
  return (scene.registry.get('profile') as PlayerProfile | undefined) ?? defaultProfile();
}

export function fmtClock(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const r = s % 60;
  return `${Math.floor(s / 60)}:${r < 10 ? '0' : ''}${r}`;
}

/** Local calendar date as YYYY-MM-DD (same format the profile stores in lastDailyDate). */
export function localDateKey(d: Date = new Date()): string {
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${d.getFullYear()}-${m < 10 ? '0' : ''}${m}-${day < 10 ? '0' : ''}${day}`;
}

export function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function starText(n: number): string {
  const k = Math.max(0, Math.min(3, Math.floor(n)));
  return '★'.repeat(k) + '☆'.repeat(3 - k);
}

export function buzz(scene: Phaser.Scene, ms = 8): void {
  if (!getProfile(scene).settings.vibration) return;
  try {
    navigator.vibrate?.(ms);
  } catch {
    // Vibration unsupported: ignore.
  }
}

export function sceneExists(scene: Phaser.Scene, key: string): boolean {
  return scene.scene.manager.getScenes(false).some((s) => s.sys.settings.key === key);
}

/** Call first thing in create(): resets the navigation lock and fades in (150 ms). */
export function enterFade(scene: Phaser.Scene): void {
  scene.data.set('nav', false);
  scene.cameras.main.setBackgroundColor(COLOR.bg);
  scene.cameras.main.fadeIn(150, 0, 0, 0);
}

/** Fade out (150 ms) then start `key`. Returns false when that scene is not registered. Ignores repeat calls. */
export function go(scene: Phaser.Scene, key: string, data?: object): boolean {
  if (!sceneExists(scene, key)) return false;
  if (scene.data.get('nav') === true) return true;
  scene.data.set('nav', true);
  const cam = scene.cameras.main;
  cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
    scene.scene.start(key, data);
  });
  cam.fadeOut(150, 0, 0, 0);
  return true;
}

/** One full-screen dim overlay, built once and reused by every panel. It swallows taps beneath it. */
export class Dim {
  private readonly g: Phaser.GameObjects.Graphics;
  private tap: (() => void) | null = null;

  constructor(scene: Phaser.Scene) {
    this.g = scene.add.graphics();
    this.g.fillStyle(0x000000, 0.62);
    this.g.fillRect(0, 0, GAME_W, GAME_H);
    this.g.setInteractive(new Phaser.Geom.Rectangle(0, 0, GAME_W, GAME_H), Phaser.Geom.Rectangle.Contains);
    this.g.on('pointerup', () => {
      if (this.tap) this.tap();
    });
    this.g.setVisible(false);
  }

  show(depth: number, onTap?: () => void): void {
    this.tap = onTap ?? null;
    this.g.setDepth(depth);
    this.g.setVisible(true);
  }

  hide(): void {
    this.tap = null;
    this.g.setVisible(false);
  }

  destroy(): void {
    this.g.destroy();
  }
}
