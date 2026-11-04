import Phaser from 'phaser';
import type { RoomId } from '../shared/types';
import { sfx } from '../audio/sfx';
import { playFx } from '../fx';
import { Toast } from '../ui/Toast';
import { isCalm } from '../ui/theme';
import { needsHint } from './homeArtStats';
import type { PropTarget } from './homeProps';
import { roomAt } from './homeWorld';
import type { Pt } from './homeWorld';

const HINT_KEY = 'scatterly.hint.tap.v1';
const NEAR = 26; // art px

/** Decor feels alive (bounce + soft tick, never a cost) and teaches "tap furniture" once. */
export class DecorFeel {
  private readonly targets = new Map<RoomId, PropTarget[]>();
  private taps = 0;
  private outlineShown = false;
  private toast: Toast | null = null;

  constructor(private readonly scene: Phaser.Scene, private readonly outline: () => void, private readonly toScreen: (p: Pt) => Pt) {}

  setTargets(room: RoomId, t: PropTarget[]): void { this.targets.set(room, t); }

  /** A piece was opened or inspected: the "3 taps in a row" count restarts. */
  piece(): void { this.taps = 0; }

  get outlineDone(): boolean { return this.outlineShown; }

  /** A tap that hit no piece: nearest prop bounces and ticks; the 3rd in a row (no piece between) shows the outline once. */
  tap(room: RoomId, art: Pt): void {
    if (roomAt(art) !== room) return;
    let best: PropTarget | undefined; let bd = NEAR;
    for (const t of this.targets.get(room) ?? []) { const d = Math.hypot(t.pt.x - art.x, t.pt.y - art.y); if (d < bd) { bd = d; best = t; } }
    if (!best) return;
    sfx.play('tick');
    const at = this.toScreen(best.pt);
    playFx(this.scene, 'tap', at.x, at.y);
    const img = best.img;
    if (img && !isCalm(this.scene)) { const y0 = img.y; this.scene.tweens.add({ targets: img, y: y0 - 3, duration: 80, yoyo: true, onComplete: () => img.setY(y0) }); }
    this.taps++;
    if (needsHint(this.taps, this.outlineShown)) { this.outlineShown = true; this.outline(); }
  }

  /** One gentle hint on the very first morning (stored once), never again. */
  firstHint(): void {
    try {
      if (window.localStorage.getItem(HINT_KEY)) return;
      window.localStorage.setItem(HINT_KEY, '1');
    } catch { return; }
    this.toast ??= new Toast(this.scene, 140);
    this.toast.show('Tap furniture to look inside', 'info', 4500);
  }

  destroy(): void { this.targets.clear(); this.toast = null; }
}
