import Phaser from 'phaser';
import type { GameSession } from '../logic';
import type { RoomId, Spot, SpotId } from '../shared/types';
import type { RunView } from './RoomRun';
import { FLOOR1_RAISE, HOUSE_WORLD, project } from './homeWorld';
import type { CameraState, Pt } from './homeWorld';
import { CSS, isCalm, makeText } from '../ui/theme';
import { UNIT } from './homeProps';
import { GAME_H, GAME_W } from '../shared/types';
import { wasTried } from './caseProgress';
import { frame } from '../art/manifest';

/** Which pieces carry a padlock icon, and whether the easy-mode setting shows them before the first tap. */
export interface LockRule { gated(id: SpotId): boolean; early(): boolean }

const HIT_R = 56; // game px: 112 px targets, nearest centre wins

const shade = (c: number, k: number): number => {
  const r = Math.min(255, Math.round(((c >> 16) & 255) * k)); const g = Math.min(255, Math.round(((c >> 8) & 255) * k)); const b = Math.min(255, Math.round((c & 255) * k));
  return (r << 16) | (g << 8) | b;
};
const BASE: Partial<Record<string, number>> = { fridge: 0xe8e4da, sofa: 0x7d9b7a, bed: 0xc9a0a8, tv: 0x2f2f38, plant: 0x5e9a5a, rug: 0xb7674b, sink: 0xbfd0d4 };

interface Node { spot: Spot; g: Phaser.GameObjects.Graphics; centre: Pt; img?: Phaser.GameObjects.Image; badge?: Phaser.GameObjects.Text; badgeArt?: Phaser.GameObjects.Image }
const GLYPH = { ruledOut: '✕', hunch: '?' } as const;

/** Placeholder tappable pieces for the Home world (iso boxes) and the RunView the run controller drives. Hit-testing is by nearest centre. */
export class HomeSpots implements RunView {
  private readonly nodes = new Map<SpotId, Node>();
  private shown: RoomId | null = null;
  private readonly off: () => void;
  private readonly world: Phaser.GameObjects.Container;

  constructor(private readonly scene: Phaser.Scene, world: Phaser.GameObjects.Container, spots: Spot[], private readonly session: GameSession, private readonly camera: () => CameraState, private readonly locks?: LockRule) {
    this.world = world;
    this.off = session.on('mark', () => this.syncBadges());
    for (const spot of spots) {
      const slot = HOUSE_WORLD.find((s) => s.room === spot.room);
      if (!slot) continue;
      const g = scene.add.graphics().setVisible(false);
      world.add(g);
      const { gx, gy, w, d, h, gz } = spot.iso;
      const raise = slot.floor * FLOOR1_RAISE + (gz ?? 0) * UNIT;
      const centre = project(slot.wx + gx + w / 2, slot.wy + gy + d / 2, raise + (h * UNIT) / 2);
      this.nodes.set(spot.id, { spot, g, centre });
      this.draw(spot.id);
    }
  }

  private draw(id: SpotId): void {
    const n = this.nodes.get(id);
    const slot = n && HOUSE_WORLD.find((s) => s.room === n.spot.room);
    if (!n || !slot) return;
    const { gx, gy, w, d, h, gz } = n.spot.iso;
    const raise = slot.floor * FLOOR1_RAISE + (gz ?? 0) * UNIT;
    const open = this.session.isOpened(id);
    const base = (BASE[n.spot.kind] ?? 0xb08a5c) * 1;
    const c = open ? shade(base, 0.7) : base;
    const P = (x: number, y: number, z: number): Pt => project(slot.wx + gx + x, slot.wy + gy + y, raise + z * UNIT);
    const g = n.g.clear();
    const art = frame(`spot/${n.spot.kind}/${open ? 'open' : 'closed'}`);
    n.img?.setVisible(false);
    if (art) {
      // Baked piece art replaces the box: ground-anchored at the footprint centre; the padlock still draws on top.
      const at = project(slot.wx + gx + w / 2, slot.wy + gy + d / 2, raise);
      if (!n.img) { n.img = this.scene.add.image(0, 0, art.atlas, art.frame); this.world.addAt(n.img, this.world.getIndex(n.g)); }
      n.img.setTexture(art.atlas, art.frame).setOrigin(art.pivotX / art.w, art.pivotY / art.h).setPosition(at.x, at.y).setVisible(n.spot.room === this.shown);
      this.lock(g, id, slot, n.spot.iso, raise);
      return;
    }
    const face = (col: number, pts: Pt[]): void => { g.fillStyle(col, 1).fillPoints(pts, true); g.lineStyle(1, 0x2a1d14, 0.9).strokePoints(pts, true); };
    face(shade(c, 0.78), [P(0, d, 0), P(w, d, 0), P(w, d, h), P(0, d, h)]);
    face(shade(c, 0.9), [P(w, 0, 0), P(w, d, 0), P(w, d, h), P(w, 0, h)]);
    face(shade(c, 1.12), [P(0, 0, h), P(w, 0, h), P(w, d, h), P(0, d, h)]);
    this.lock(g, id, slot, n.spot.iso, raise);
    if (open) face(0x20150e, [P(0.2 * w, d, 0.3 * h), P(0.8 * w, d, 0.3 * h), P(0.8 * w, d, 0.7 * h), P(0.2 * w, d, 0.7 * h)]);
  }

  private lock(g: Phaser.GameObjects.Graphics, id: SpotId, slot: { wx: number; wy: number }, iso: Spot['iso'], raise: number): void {
    if (this.session.isOpened(id) || !this.showsLock(id)) return;
    const { gx, gy, w, d, h } = iso;
    const c = project(slot.wx + gx + w / 2, slot.wy + gy + d / 2, raise + h * UNIT + 10);
    g.fillStyle(0xf4a93d, 1).fillRect(c.x - 5, c.y - 3, 10, 8).lineStyle(2, 0x16252a, 1).strokeRect(c.x - 5, c.y - 3, 10, 8);
    g.lineStyle(2, 0xfff3dc, 1).strokeRoundedRect(c.x - 3, c.y - 9, 6, 7, 3);
  }

  /** A padlock is drawn only once the piece was tapped (or when the easy-mode setting is on). Never reveals which pieces are decoys. */
  private showsLock(id: SpotId): boolean {
    const r = this.locks;
    return !!r && r.gated(id) && (wasTried(this.session, id) || r.early());
  }

  /** Redraw one piece after its first tap so a padlock can appear. */
  touch(id: SpotId): void { this.draw(id); }

  /** Deduction badges (✕ ruled out, ? hunch): one text per marked piece, kept ~40 game px whatever the zoom. */
  syncBadges(): void {
    const marks = this.session.marks();
    const z = this.camera().zoom;
    for (const [id, n] of this.nodes) {
      const mark = marks.get(id);
      if (!mark) { n.badge?.setVisible(false); n.badgeArt?.setVisible(false); continue; }
      const at = { x: n.centre.x, y: n.centre.y - (n.spot.iso.h * UNIT) / 2 - 4 / z };
      const show = n.spot.room === this.shown;
      const art = frame(mark === 'hunch' ? 'ui/hunch' : 'ui/ruledOut');
      if (art) {
        // Baked badge art (kept ~48 game px whatever the zoom).
        if (!n.badgeArt) { n.badgeArt = this.scene.add.image(0, 0, art.atlas, art.frame).setOrigin(art.pivotX / art.w, 1); this.world.add(n.badgeArt); }
        n.badgeArt.setTexture(art.atlas, art.frame).setScale(48 / art.w / z).setPosition(at.x, at.y).setVisible(show);
        n.badge?.setVisible(false);
        continue;
      }
      if (!n.badge) { n.badge = makeText(this.scene, 0, 0, GLYPH[mark], { fontSize: '40px', fontStyle: 'bold' }).setOrigin(0.5, 1); this.world.add(n.badge); }
      n.badge.setText(GLYPH[mark]).setColor(mark === 'hunch' ? CSS.amber : CSS.red).setScale(1 / z).setPosition(at.x, at.y).setVisible(show);
    }
  }

  /** Pieces of the shown room as art-px centres (for the outline hint). */
  pieces(): Array<{ id: SpotId; centre: Pt }> {
    return [...this.nodes.values()].filter((n) => n.spot.room === this.shown).map((n) => ({ id: n.spot.id, centre: n.centre }));
  }

  /** Unopened pieces of the shown room (shimmer candidates). */
  unopened(): SpotId[] {
    return [...this.nodes.values()].filter((n) => n.spot.room === this.shown && !this.session.isOpened(n.spot.id)).map((n) => n.spot.id);
  }

  /** Only the focused room's pieces are visible and tappable. */
  showRoom(room: RoomId | null): void {
    this.shown = room;
    for (const n of this.nodes.values()) { n.g.setVisible(n.spot.room === room); n.img?.setVisible(n.spot.room === room); }
    this.syncBadges();
  }

  private screen(centre: Pt): Pt {
    const cam = this.camera();
    return { x: (centre.x - cam.cx) * cam.zoom + GAME_W / 2, y: (centre.y - cam.cy) * cam.zoom + GAME_H / 2 };
  }

  /** Nearest piece centre within the hit radius, focused room only. */
  spotAt(p: Pt): Spot | undefined {
    let best: { spot: Spot; d: number } | undefined;
    for (const n of this.nodes.values()) {
      if (n.spot.room !== this.shown) continue;
      const c = this.screen(n.centre);
      const d = Math.hypot(c.x - p.x, c.y - p.y);
      if (d <= HIT_R && (!best || d < best.d)) best = { spot: n.spot, d };
    }
    return best?.spot;
  }

  list(): Array<{ spotId: string; x: number; y: number }> {
    return [...this.nodes.values()].filter((n) => n.spot.room === this.shown).map((n) => ({ spotId: n.spot.id, ...this.screen(n.centre) }));
  }

  playAction(spot: Spot): void {
    const n = this.nodes.get(spot.id);
    if (!n || isCalm(this.scene)) return;
    this.scene.tweens.add({ targets: n.g, y: -3, duration: 70, yoyo: true, onComplete: () => n.g.setY(0) });
    if (n.img) { const y0 = n.img.y; this.scene.tweens.add({ targets: n.img, y: y0 - 3, duration: 70, yoyo: true, onComplete: () => n.img?.setY(y0) }); }
  }

  refresh(id: SpotId): void { this.draw(id); }

  /** Redraw every piece (art atlases arrived after the pieces were built). */
  redrawAll(): void { for (const id of this.nodes.keys()) this.draw(id); }

  pulse(id: SpotId): void {
    const n = this.nodes.get(id);
    if (!n || isCalm(this.scene)) return;
    this.scene.tweens.add({ targets: n.img ? [n.g, n.img] : n.g, alpha: 0.5, duration: 120, yoyo: true, repeat: 1, onComplete: () => { n.g.setAlpha(1); n.img?.setAlpha(1); } });
  }

  artCentre(id: SpotId): Pt | null { return this.nodes.get(id)?.centre ?? null; }

  center(id: SpotId): { x: number; y: number } | null {
    const n = this.nodes.get(id);
    return n ? this.screen(n.centre) : null;
  }

  destroy(): void {
    this.off();
    for (const n of this.nodes.values()) { n.g.destroy(); n.badge?.destroy(); n.badgeArt?.destroy(); }
    this.nodes.clear();
  }
}
