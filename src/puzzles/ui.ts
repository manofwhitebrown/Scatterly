import Phaser from 'phaser';
import { PAL as BASE, hex, rrect, shade } from '../art/palette';
import type { Btn, BtnOpts, G, TextOpts } from '../art/palette';
import { COLOR, FONT } from '../ui/theme';

/**
 * Puzzle UI kit: the same names the puzzle scenes always used (PAL, makeText, makeButton, panelBox), but drawn with
 * the game's pixel font and the teal/amber theme from src/ui/theme.ts instead of the old system-font look.
 * Only the chrome colours are re-mapped; piece colours (red, blue, yellow, green, rose...) stay readable and distinct.
 */
export { circle, line, poly, rotPts, rrect, shade, hex } from '../art/palette';
export type { Btn, G } from '../art/palette';

export const PAL = {
  ...BASE,
  ink: COLOR.ink,
  inkSoft: 0x4d6a6c,
  cream: COLOR.cream,
  panel: COLOR.paper,
  panelEdge: COLOR.plateEdge,
  terracotta: COLOR.amber,
  steel: COLOR.teal,
  sageDark: COLOR.tealLo,
  sage: COLOR.tealHi,
  shadow: 0x0a1518,
} as const;

/** Silkscreen runs wide, so every size is scaled to keep the existing wrap widths and layouts. */
const TEXT_SCALE = 0.8;

export function makeText(scene: Phaser.Scene, x: number, y: number, str: string, size: number, color: number = PAL.ink, o: TextOpts = {}): Phaser.GameObjects.Text {
  const style: Phaser.Types.GameObjects.Text.TextStyle = {
    fontFamily: FONT, fontSize: `${Math.round(size * TEXT_SCALE)}px`, color: hex(color),
    fontStyle: o.bold ? 'bold' : 'normal', align: o.align ?? 'left', resolution: 2,
  };
  if (o.wrap) style.wordWrap = { width: o.wrap };
  if (o.padX || o.padY) style.padding = { x: o.padX ?? 0, y: o.padY ?? 0 };
  const t = new Phaser.GameObjects.Text(scene, x, y, str, style);
  t.setOrigin(o.ox ?? 0, o.oy ?? 0);
  scene.add.existing(t);
  return t;
}

/** Flat pixel-style plate: dark outline, lit top edge, darker underside. Corner radius is capped so big panels stay crisp. */
export function panelBox(g: G, x: number, y: number, w: number, h: number, r: number, fill: number, outline: number = PAL.panelEdge, lw = 4): void {
  const rad = Math.min(r, 14);
  rrect(g, x, y, w, h, rad, outline);
  rrect(g, x + lw, y + lw, w - lw * 2, h - lw * 2, Math.max(0, rad - lw), fill);
  rrect(g, x + lw, y + lw, w - lw * 2, 6, 2, shade(fill, 0.35), 0.9);
  rrect(g, x + lw, y + h - lw - 8, w - lw * 2, 8, 2, shade(fill, -0.22), 0.7);
}

const lum = (c: number): number => (0.299 * ((c >> 16) & 255) + 0.587 * ((c >> 8) & 255) + 0.114 * (c & 255)) / 255;

/** Button with a hit area of at least 96 x 96 game px (48 dp) around its centre, whatever size is drawn. */
export function makeButton(scene: Phaser.Scene, x: number, y: number, w: number, h: number, label: string, onTap: () => void, o: BtnOpts = {}): Btn {
  const fill = o.fill ?? PAL.terracotta;
  const ink = o.color ?? (lum(fill) > 0.55 ? PAL.ink : PAL.cream);
  const glyph = o.glyph ?? 'none';
  const g = scene.add.graphics();
  const text = makeText(scene, x, y, label, o.size ?? 24, ink, { bold: true, ox: 0.5, oy: 0.5, align: 'center' });
  let enabled = true;
  let down = false;
  const draw = (): void => {
    const dy = down ? 4 : 0;
    g.clear();
    g.fillStyle(PAL.shadow, 0.45);
    g.fillRoundedRect(x - w / 2, y - h / 2 + 6, w, h, 10);
    panelBox(g, x - w / 2, y - h / 2 + dy, w, h, 10, fill);
    g.lineStyle(6, ink, 1);
    const k = 12;
    if (glyph === 'close') {
      g.lineBetween(x - k, y - k + dy, x + k, y + k + dy);
      g.lineBetween(x + k, y - k + dy, x - k, y + k + dy);
    } else if (glyph === 'left' || glyph === 'right') {
      const s = glyph === 'left' ? -1 : 1;
      g.fillStyle(ink, 1);
      g.fillTriangle(x - s * 12, y - 14 + dy, x - s * 12, y + 14 + dy, x + s * 12, y + dy);
    }
    text.setY(y + dy);
  };
  draw();
  g.setData('labelText', text); // lets the e2e hook name this button by its label
  const hw = Math.max(96, w);
  const hh = Math.max(96, h);
  g.setInteractive(new Phaser.Geom.Rectangle(x - hw / 2, y - hh / 2, hw, hh), Phaser.Geom.Rectangle.Contains);
  g.on('pointerdown', () => { if (enabled) { down = true; draw(); } });
  g.on('pointerout', () => { if (down) { down = false; draw(); } });
  g.on('pointerup', () => {
    if (!down) return;
    down = false;
    draw();
    if (enabled) onTap();
  });
  return {
    g, label: text,
    setEnabled(on: boolean): void { enabled = on; g.setAlpha(on ? 1 : 0.45); text.setAlpha(on ? 1 : 0.45); },
    setLabel(s: string): void { if (text.text !== s) text.setText(s); },
    setVisible(v: boolean): void { g.setVisible(v); text.setVisible(v); },
    destroy(): void { g.destroy(); text.destroy(); },
  };
}
