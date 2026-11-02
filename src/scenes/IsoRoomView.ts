import Phaser from 'phaser';
import { isLowFx } from '../core/perf';
import type { GameSession } from '../logic';
import type { RoomId, Spot, SpotId } from '../shared/types';
import { PressZone } from '../ui/PressZone';
import { isoBox, screenSpots, ROOM_ORIGIN } from '../ui/isoGrid';
import type { ScreenBox } from '../ui/isoGrid';
import { pickSpot } from '../ui/hit';
import { drawBox, drawShell } from './IsoRoomDraw';

interface SpotView { spot: Spot; box: ScreenBox; g: Phaser.GameObjects.Graphics }
interface Layer { box: Phaser.GameObjects.Container; spots: Map<SpotId, SpotView>; list: Spot[]; zone: PressZone }

/** Isometric room (skeleton): one room at a time, layers built lazily, spots depth-sorted once. */
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

  refresh(id: SpotId): void {
    const v = this.find(id);
    if (v) drawBox(v.g, v.spot.room, v.spot.iso, v.box, this.session.isOpened(id), this.isLocked(id));
  }

  playAction(spot: Spot): void {
    const v = this.find(spot.id);
    if (!v) return;
    this.refresh(spot.id);
    if (isLowFx(this.scene.game)) return;
    this.scene.tweens.killTweensOf(v.g);
    v.g.setScale(1);
    this.scene.tweens.add({ targets: v.g, scale: 1.05, duration: 90, yoyo: true, onComplete: () => v.g.setScale(1) });
  }

  queuePulse(id: SpotId): void {
    this.pulseSpot = id;
    const v = this.current !== null ? this.layers.get(this.current)?.spots.get(id) : undefined;
    if (!v) return;
    this.pulseSpot = null;
    if (isLowFx(this.scene.game)) return;
    this.scene.tweens.killTweensOf(v.g);
    this.scene.tweens.add({ targets: v.g, scale: 1.08, duration: 150, yoyo: true, repeat: 2, onComplete: () => v.g.setScale(1) });
  }

  destroy(): void {
    for (const layer of this.layers.values()) {
      for (const v of layer.spots.values()) this.scene.tweens.killTweensOf(v.g);
      layer.zone.destroy();
      layer.box.destroy(true);
    }
    this.layers.clear();
    this.current = null;
  }

  private find(id: SpotId): SpotView | undefined {
    for (const layer of this.layers.values()) {
      const v = layer.spots.get(id);
      if (v) return v;
    }
    return undefined;
  }

  private build(room: RoomId): Layer {
    const box = this.scene.add.container(0, 0).setVisible(false);
    const raw = (this.session.spotsIn(room) ?? []).slice();
    // depth-sort once: back (small gx+gy) to front
    raw.sort((a, b) => a.iso.gx + a.iso.gy + a.iso.d - (b.iso.gx + b.iso.gy + b.iso.d));
    const list = screenSpots(ROOM_ORIGIN, raw);
    const cols = Math.max(6, ...raw.map((s) => s.iso.gx + s.iso.w + 1));
    const rows = Math.max(6, ...raw.map((s) => s.iso.gy + s.iso.d + 1));
    const shell = this.scene.add.graphics();
    drawShell(shell, room, cols, rows);
    box.add(shell);
    const spots = new Map<SpotId, SpotView>();
    for (const [i, spot] of list.entries()) {
      const src = raw[i];
      if (!src) continue;
      const sb = isoBox(ROOM_ORIGIN, src.iso);
      const g = this.scene.add.graphics().setPosition(sb.x + sb.w / 2, sb.y + sb.h / 2);
      drawBox(g, room, src.iso, sb, this.session.isOpened(src.id), this.isLocked(src.id));
      box.add(g);
      spots.set(src.id, { spot, box: sb, g });
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
