import Phaser from 'phaser';
import { ISO_DIMS, boxTexture, depthKey, isoToScreen } from '../art/iso';
import { ensureRoomShell, shellSize } from '../art/isoShell';
import { isLowFx } from '../core/perf';
import type { GameSession } from '../logic';
import { tex } from '../shared/types';
import type { RoomId, Spot, SpotId } from '../shared/types';
import { PressZone } from '../ui/PressZone';
import { pickSpot } from '../ui/hit';
import { COLOR } from '../ui/theme';
import { ROOM_ORIGIN, placementOf, project, screenSpots } from '../ui/isoGrid';

interface SpotView { spot: Spot; img: Phaser.GameObjects.Image; lock: Phaser.GameObjects.Graphics | null }
interface Layer { box: Phaser.GameObjects.Container; spots: Map<SpotId, SpotView>; list: Spot[]; zone: PressZone }

/** Small padlock badge, drawn once per gated container; visible from the start so the player can plan. */
function makePadlock(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics().setPosition(x, y);
  g.fillStyle(COLOR.plateEdge, 0.9).fillCircle(0, 0, 20);
  g.fillStyle(COLOR.amber, 1).fillRect(-9, -4, 18, 14);
  g.lineStyle(3, COLOR.amber, 1).strokeCircle(0, -6, 6);
  g.fillStyle(COLOR.ink, 1).fillRect(-2, 1, 4, 5);
  return g;
}

/** Isometric room: baked shell + baked furniture textures, depth-sorted once, one room built at a time. */
export class IsoRoomView {
  private readonly layers = new Map<RoomId, Layer>();
  private current: RoomId | null = null;
  private pulseSpot: SpotId | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly session: GameSession,
    private readonly isLocked: (id: SpotId) => boolean,
    private readonly onTap: (spot: Spot) => void,
    private readonly onLong: (spot: Spot) => void,
  ) {}

  get room(): RoomId | null {
    return this.current;
  }

  /** The iso view switches instantly (cut); the camera zoom arrives with the Dollhouse. */
  get switching(): boolean {
    return false;
  }

  show(room: RoomId, _dir: number): void {
    if (this.current === room) return;
    const next = this.layers.get(room) ?? this.build(room);
    if (this.current !== null) this.layers.get(this.current)?.box.setVisible(false);
    this.current = room;
    next.box.setVisible(true);
    if (this.pulseSpot !== null) this.queuePulse(this.pulseSpot);
  }

  attach(room: RoomId, obj: Phaser.GameObjects.GameObject): void {
    (this.layers.get(room) ?? this.build(room)).box.add(obj);
  }

  /** Spot with its screen-space box (x,y,w,h), as used for hit areas and badges. */
  spotOf(id: SpotId): Spot | undefined {
    return this.find(id)?.spot;
  }

  /** Hotspot centres of the current room, for the e2e bot. */
  hotspots(): Array<{ spotId: string; x: number; y: number }> {
    const layer = this.current !== null ? this.layers.get(this.current) : undefined;
    return layer ? layer.list.map((s) => ({ spotId: s.id, x: s.x + s.w / 2, y: s.y + s.h / 2 })) : [];
  }

  /** Swaps to the open texture and drops the padlock once the session says it was searched. */
  refresh(id: SpotId): void {
    const v = this.find(id);
    if (!v) return;
    const opened = this.session.isOpened(id);
    v.img.setTexture(tex.isoSpot(v.spot.kind, opened));
    v.lock?.setVisible(!opened && this.isLocked(id));
  }

  playAction(spot: Spot): void {
    const v = this.find(spot.id);
    if (!v) return;
    this.refresh(spot.id);
    this.hop(v, 6, 2);
  }

  queuePulse(id: SpotId): void {
    this.pulseSpot = id;
    const v = this.current !== null ? this.layers.get(this.current)?.spots.get(id) : undefined;
    if (!v) return;
    this.pulseSpot = null;
    this.hop(v, 8, 3);
  }

  destroy(): void {
    for (const layer of this.layers.values()) {
      for (const v of layer.spots.values()) this.scene.tweens.killTweensOf(v.img);
      layer.zone.destroy();
      layer.box.destroy(true);
    }
    this.layers.clear();
    this.current = null;
  }

  private hop(v: SpotView, px: number, repeat: number): void {
    if (isLowFx(this.scene.game)) return;
    const y = v.img.y;
    this.scene.tweens.killTweensOf(v.img);
    v.img.setY(y);
    this.scene.tweens.add({ targets: v.img, y: y - px, duration: 90, yoyo: true, repeat: repeat - 1, onComplete: () => v.img.setY(y) });
  }

  private find(id: SpotId): SpotView | undefined {
    for (const layer of this.layers.values()) {
      const v = layer.spots.get(id);
      if (v) return v;
    }
    return undefined;
  }

  private build(room: RoomId): Layer {
    const o = ROOM_ORIGIN;
    const box = this.scene.add.container(0, 0).setVisible(false);
    ensureRoomShell(this.scene, room);
    if (this.scene.textures.exists(tex.isoShell(room))) {
      const s = shellSize();
      box.add(this.scene.add.image(o.x, o.y, tex.isoShell(room)).setOrigin(s.ox / s.w, s.oy / s.h));
    }
    // depth-sort once: back (small key) to front
    const raw = (this.session.spotsIn(room) ?? []).slice();
    raw.sort((a, b) => depthKey(placementOf(a)) - depthKey(placementOf(b)));
    const list = screenSpots(o, raw);
    const spots = new Map<SpotId, SpotView>();
    for (const [i, spot] of list.entries()) {
      const src = raw[i];
      if (!src) continue;
      const dims = ISO_DIMS[src.kind];
      const bt = boxTexture(dims);
      const at = isoToScreen(src.iso.gx, src.iso.gy, src.iso.gz ?? 0);
      const img = this.scene.add
        .image(o.x + at.x, o.y + at.y, tex.isoSpot(src.kind, this.session.isOpened(src.id)))
        .setOrigin(bt.ox / bt.w, bt.oy / bt.h);
      box.add(img);
      let lock: Phaser.GameObjects.Graphics | null = null;
      if (this.isLocked(src.id)) {
        const m = project(o, src.iso.gx + dims.w / 2, src.iso.gy + dims.d / 2, (src.iso.gz ?? 0) + dims.h);
        lock = makePadlock(this.scene, m.x, m.y - 6);
        box.add(lock);
      }
      spots.set(src.id, { spot, img, lock });
    }
    const zone = new PressZone(this.scene, {
      active: () => this.current === room,
      pick: (x, y) => pickSpot(list, x, y),
      onTap: this.onTap,
      onLong: this.onLong,
    });
    box.add(zone.zone);
    const layer: Layer = { box, spots, list, zone };
    this.layers.set(room, layer);
    return layer;
  }
}
