import Phaser from 'phaser';

export const FONT = 'system-ui, "Segoe UI", Roboto, sans-serif';
export const MONO = 'ui-monospace, Menlo, Consolas, "Courier New", monospace';

export const PAL = {
  ink: 0x3b2f2a, inkSoft: 0x7a675b, cream: 0xfff4e0, panel: 0xfff8ea, panelEdge: 0xe2cfaa,
  wood: 0xc99a68, woodDark: 0x946440, woodLight: 0xe0b684,
  terracotta: 0xd8795a, sage: 0x9db88f, sageDark: 0x6f9070, sky: 0xa9d2e8, navy: 0x4a6a8f,
  butter: 0xf4cf6b, rose: 0xe59aa0, teal: 0x5fa8a0, cloud: 0xf6f1e8, steel: 0xaab4bd, charcoal: 0x3d4651,
  gold: 0xe8b84a, red: 0xd9534f, blue: 0x5b8fc7, yellow: 0xf2c04a, green: 0x6bb07a, shadow: 0x2b1d14,
  ok: 0x5aa469, disabled: 0xcfc2ab, white: 0xffffff,
} as const;

export type G = Phaser.GameObjects.Graphics;

export function hex(n: number): string {
  return '#' + (n & 0xffffff).toString(16).padStart(6, '0');
}

/** f > 0 lightens toward white, f < 0 darkens toward black (range -1..1). */
export function shade(c: number, f: number): number {
  const ch = (v: number): number => Math.max(0, Math.min(255, Math.round(f >= 0 ? v + (255 - v) * f : v * (1 + f))));
  return (ch((c >> 16) & 255) << 16) | (ch((c >> 8) & 255) << 8) | ch(c & 255);
}

export function lerpColor(a: number, b: number, t: number): number {
  const m = (x: number, y: number): number => Math.round(x + (y - x) * t);
  return (m((a >> 16) & 255, (b >> 16) & 255) << 16) | (m((a >> 8) & 255, (b >> 8) & 255) << 8) | m(a & 255, b & 255);
}

export function rrect(g: G, x: number, y: number, w: number, h: number, r: number, color: number, alpha = 1): void {
  if (w <= 0 || h <= 0) return;
  g.fillStyle(color, alpha);
  g.fillRoundedRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2)));
}

/** Rounded body with a 1-2px darker outline and a soft top-left highlight. */
export function panelBox(g: G, x: number, y: number, w: number, h: number, r: number, fill: number, outline = shade(fill, -0.38), lw = 2): void {
  rrect(g, x, y, w, h, r, outline);
  rrect(g, x + lw, y + lw, w - lw * 2, h - lw * 2, r - lw, fill);
  rrect(g, x + lw + 3, y + lw + 2, w - lw * 2 - 8, Math.min(6, h / 5), 3, PAL.white, 0.2);
}

export function circle(g: G, cx: number, cy: number, r: number, fill: number, outline = shade(fill, -0.38)): void {
  g.fillStyle(outline, 1);
  g.fillCircle(cx, cy, r);
  g.fillStyle(fill, 1);
  g.fillCircle(cx, cy, Math.max(0, r - 2));
}

export function poly(g: G, pts: number[], fill: number, outline: number | null = shade(fill, -0.38), alpha = 1): void {
  g.fillStyle(fill, alpha);
  g.beginPath();
  g.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
  g.closePath();
  g.fillPath();
  if (outline !== null) {
    g.lineStyle(2, outline, 1);
    g.strokePath();
  }
}

export function rotPts(pts: number[], cx: number, cy: number, ang: number): number[] {
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  const out: number[] = [];
  for (let i = 0; i < pts.length; i += 2) {
    const dx = pts[i] - cx;
    const dy = pts[i + 1] - cy;
    out.push(cx + dx * c - dy * s, cy + dx * s + dy * c);
  }
  return out;
}

export function line(g: G, x1: number, y1: number, x2: number, y2: number, w: number, color: number, alpha = 1): void {
  g.lineStyle(w, color, alpha);
  g.lineBetween(x1, y1, x2, y2);
}

/** Baked soft drop-shadow: three stacked, shrinking ellipses. */
export function softShadow(g: G, cx: number, y: number, w: number, h = 10, alpha = 0.16): void {
  g.fillStyle(PAL.shadow, alpha);
  g.fillEllipse(cx, y, w, h);
  g.fillEllipse(cx, y, w * 0.82, h * 0.72);
  g.fillEllipse(cx, y, w * 0.6, h * 0.5);
}

/** Cheap gradient from stacked opaque bands. */
export function vgrad(g: G, x: number, y: number, w: number, h: number, c1: number, c2: number, steps = 8): void {
  const sh = h / steps;
  for (let i = 0; i < steps; i++) {
    g.fillStyle(lerpColor(c1, c2, steps === 1 ? 0 : i / (steps - 1)), 1);
    g.fillRect(x, y + i * sh, w, Math.ceil(sh) + 1);
  }
}

/** Overlay gradient (alpha ramps a1 -> a2) in a single colour. */
export function vgradA(g: G, x: number, y: number, w: number, h: number, color: number, a1: number, a2: number, steps = 8): void {
  const sh = h / steps;
  for (let i = 0; i < steps; i++) {
    g.fillStyle(color, a1 + (a2 - a1) * (steps === 1 ? 0 : i / (steps - 1)));
    g.fillRect(x, y + i * sh, w, Math.ceil(sh) + 1);
  }
}

/** Draw into an off-screen Graphics and bake it to a texture. Idempotent. */
export function bake(scene: Phaser.Scene, key: string, w: number, h: number, draw: (g: G) => void): void {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  try {
    draw(g);
    g.generateTexture(key, w, h);
  } finally {
    g.destroy();
  }
}

/** Plain placeholder used only if a draw routine throws, so the game never blanks. */
export function bakeFallback(scene: Phaser.Scene, key: string, w: number, h: number): void {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  try {
    panelBox(g, 2, 2, w - 4, h - 4, Math.min(14, w / 4, h / 4), PAL.woodLight);
    g.generateTexture(key, w, h);
  } finally {
    g.destroy();
  }
}

/* ---------- UI helpers (used by puzzles + organise; no dependency on src/ui) ---------- */

export interface TextOpts {
  bold?: boolean; align?: 'left' | 'center' | 'right'; ox?: number; oy?: number;
  wrap?: number; mono?: boolean; padX?: number; padY?: number;
}

export function makeText(scene: Phaser.Scene, x: number, y: number, str: string, size: number, color: number = PAL.ink, o: TextOpts = {}): Phaser.GameObjects.Text {
  const style: Phaser.Types.GameObjects.Text.TextStyle = {
    fontFamily: o.mono ? MONO : FONT, fontSize: `${size}px`, color: hex(color),
    fontStyle: o.bold ? 'bold' : 'normal', align: o.align ?? 'left', resolution: 2,
  };
  if (o.wrap) style.wordWrap = { width: o.wrap };
  if (o.padX || o.padY) style.padding = { x: o.padX ?? 0, y: o.padY ?? 0 };
  const t = new Phaser.GameObjects.Text(scene, x, y, str, style);
  t.setOrigin(o.ox ?? 0, o.oy ?? 0);
  scene.add.existing(t);
  return t;
}

export type BtnGlyph = 'none' | 'close' | 'left' | 'right';

export interface Btn {
  g: G;
  label: Phaser.GameObjects.Text;
  setEnabled(on: boolean): void;
  setLabel(s: string): void;
  setVisible(v: boolean): void;
  destroy(): void;
}

export interface BtnOpts { fill?: number; color?: number; size?: number; glyph?: BtnGlyph }

/** Rounded button: Graphics (hit area = rect) + centred label. Fires on pointer-up. */
export function makeButton(scene: Phaser.Scene, x: number, y: number, w: number, h: number, label: string, onTap: () => void, o: BtnOpts = {}): Btn {
  const fill = o.fill ?? PAL.terracotta;
  const glyph = o.glyph ?? 'none';
  const g = scene.add.graphics();
  const text = makeText(scene, x, y, label, o.size ?? 24, o.color ?? PAL.white, { bold: true, ox: 0.5, oy: 0.5, align: 'center' });
  let enabled = true;
  let down = false;
  const draw = (): void => {
    const dy = down ? 2 : 0;
    g.clear();
    g.fillStyle(PAL.shadow, 0.2);
    g.fillRoundedRect(x - w / 2, y - h / 2 + 4, w, h, 14);
    panelBox(g, x - w / 2, y - h / 2 + dy, w, h, 14, fill);
    if (glyph === 'close') {
      line(g, x - 11, y - 11 + dy, x + 11, y + 11 + dy, 5, PAL.white);
      line(g, x + 11, y - 11 + dy, x - 11, y + 11 + dy, 5, PAL.white);
    } else if (glyph === 'left') {
      g.fillStyle(PAL.white, 1);
      g.fillTriangle(x + 8, y - 13 + dy, x + 8, y + 13 + dy, x - 12, y + dy);
    } else if (glyph === 'right') {
      g.fillStyle(PAL.white, 1);
      g.fillTriangle(x - 8, y - 13 + dy, x - 8, y + 13 + dy, x + 12, y + dy);
    }
    text.setY(y + dy);
  };
  draw();
  g.setInteractive(new Phaser.Geom.Rectangle(x - w / 2, y - h / 2, w, h), Phaser.Geom.Rectangle.Contains);
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
