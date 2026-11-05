import Phaser from 'phaser';
import { ensureRoomTexture } from '../art';
import { isLowFx } from '../core/perf';
import { DECOR, GameSession } from '../logic';
import { tex } from '../shared/types';
import { pickSpot } from '../ui/hit';
import type { PlayerProfile, RoomId, Spot, SpotId } from '../shared/types';

interface SpotView {
  spot: Spot;
  img: Phaser.GameObjects.Image;
}

interface RoomLayer {
  box: Phaser.GameObjects.Container;
  spots: Map<SpotId, SpotView>;
}

const SLIDE = 60;
const LONG_MS = 400;
const SLIDE_MS = 180;

/** Renders one room at a time. Room layers are built lazily, cached by room id and reused. */
export class RoomView {
  private readonly layers = new Map<RoomId, RoomLayer>();
  private current: RoomId | null = null;
  private busy = false;
  private pulseSpot: SpotId | null = null;
  private pressTimer: Phaser.Time.TimerEvent | null = null;
  private longFired = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly session: GameSession,
    private readonly profile: PlayerProfile,
    private readonly onTap: (spot: Spot) => void,
    private readonly onLong: (spot: Spot) => void = () => undefined,
  ) {}

  get room(): RoomId | null {
    return this.current;
  }

  get switching(): boolean {
    return this.busy;
  }

  show(room: RoomId, dir: number): void {
    if (this.current === room) return;
    const next = this.layers.get(room) ?? this.build(room);
    const prev = this.current !== null ? this.layers.get(this.current) : undefined;
    this.current = room;
    if (!prev || dir === 0 || isLowFx(this.scene.game)) {
      if (prev) prev.box.setVisible(false);
      next.box.setPosition(0, 0).setAlpha(1).setVisible(true);
      this.afterShow(room);
      return;
    }
    this.busy = true;
    this.scene.tweens.killTweensOf([prev.box, next.box]);
    this.scene.tweens.add({
      targets: prev.box,
      x: -dir * SLIDE,
      alpha: 0,
      duration: SLIDE_MS,
      onComplete: () => prev.box.setVisible(false).setPosition(0, 0).setAlpha(1),
    });
    next.box.setPosition(dir * SLIDE, 0).setAlpha(0).setVisible(true);
    this.scene.tweens.add({
      targets: next.box,
      x: 0,
      alpha: 1,
      duration: SLIDE_MS,
      onComplete: () => {
        this.busy = false;
        this.afterShow(room);
      },
    });
  }

  /** Adds an overlay object (e.g. a mark badge) to a room layer so it hides and shows with the room. */
  attach(room: RoomId, obj: Phaser.GameObjects.GameObject): void {
    const layer = this.layers.get(room) ?? this.build(room);
    layer.box.add(obj);
  }

  spotOf(spotId: SpotId): Spot | undefined {
    return this.find(spotId)?.spot;
  }

  /** Swaps a spot to its opened texture when the session says it was searched. */
  refresh(spotId: SpotId): void {
    const view = this.find(spotId);
    if (view) view.img.setTexture(tex.spot(view.spot.kind, this.session.isOpened(spotId)));
  }

  /** Tap feedback by spot.action; the texture is swapped first. */
  playAction(spot: Spot): void {
    const view = this.find(spot.id);
    if (!view) return;
    this.refresh(spot.id);
    if (isLowFx(this.scene.game)) return;
    const img = view.img;
    this.scene.tweens.killTweensOf(img);
    img.setPosition(spot.x, spot.y).setScale(1).setAngle(0);
    const reset = (): void => {
      img.setPosition(spot.x, spot.y).setScale(1).setAngle(0);
    };
    switch (spot.action) {
      case 'open':
        this.scene.tweens.add({ targets: img, x: spot.x + 4, duration: 40, yoyo: true, repeat: 2, onComplete: reset });
        break;
      case 'lift':
        this.scene.tweens.add({ targets: img, y: spot.y - 14, duration: 120, yoyo: true, onComplete: reset });
        break;
      case 'search':
        this.scene.tweens.add({ targets: img, angle: 1.2, duration: 60, yoyo: true, repeat: 2, onComplete: reset });
        break;
      case 'peek':
        this.scene.tweens.add({ targets: img, scale: 1.04, duration: 110, yoyo: true, onComplete: reset });
        break;
    }
  }

  /** Pulses a spot now if it is on screen, otherwise the next time its room is shown. */
  queuePulse(spotId: SpotId): void {
    this.pulseSpot = spotId;
    if (this.current !== null && !this.busy) this.afterShow(this.current);
  }

  destroy(): void {
    this.pressTimer?.remove(false);
    this.pressTimer = null;
    for (const layer of this.layers.values()) {
      for (const view of layer.spots.values()) this.scene.tweens.killTweensOf(view.img);
      this.scene.tweens.killTweensOf(layer.box);
      layer.box.destroy(true);
    }
    this.layers.clear();
  }

  private find(spotId: SpotId): SpotView | undefined {
    for (const layer of this.layers.values()) {
      const view = layer.spots.get(spotId);
      if (view) return view;
    }
    return undefined;
  }

  private afterShow(room: RoomId): void {
    const id = this.pulseSpot;
    if (id === null) return;
    const view = this.layers.get(room)?.spots.get(id);
    if (!view) return;
    this.pulseSpot = null;
    if (isLowFx(this.scene.game)) return;
    const img = view.img;
    this.scene.tweens.killTweensOf(img);
    this.scene.tweens.add({
      targets: img,
      scale: 1.06,
      duration: 150,
      yoyo: true,
      repeat: 2,
      onComplete: () => img.setScale(1),
    });
  }

  private build(room: RoomId): RoomLayer {
    const box = this.scene.add.container(0, 0).setVisible(false);
    ensureRoomTexture(this.scene, room);
    box.add(this.scene.add.image(0, 0, tex.room(room)).setOrigin(0, 0));

    for (const d of DECOR) {
      if (d.kind !== 'cosmetic' || d.room !== room || !this.profile.owned.includes(d.id)) continue;
      box.add(this.scene.add.image(d.x, d.y, tex.decor(d.id)).setOrigin(0, 0));
    }

    const spots = new Map<SpotId, SpotView>();
    const list = (this.session.spotsIn(room) ?? []).slice().sort((a, b) => a.y + a.h - (b.y + b.h));
    for (const spot of list) {
      const img = this.scene.add.image(spot.x, spot.y, tex.spot(spot.kind, this.session.isOpened(spot.id)));
      img.setOrigin(0, 0);
      box.add(img);
      spots.set(spot.id, { spot, img });
    }
    const zone = this.scene.add.zone(0, 0, 1280, 720).setOrigin(0, 0).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.longFired = false;
      this.pressTimer?.remove(false);
      this.pressTimer = this.scene.time.delayedCall(LONG_MS, () => {
        if (this.busy || this.current !== room || pointer.getDistance() > 16) return;
        const hit = pickSpot(list, pointer.x, pointer.y);
        if (!hit) return;
        this.longFired = true;
        this.onLong(hit);
      });
    });
    zone.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      this.pressTimer?.remove(false);
      this.pressTimer = null;
      if (this.longFired) {
        this.longFired = false;
        return;
      }
      if (this.busy || this.current !== room || pointer.getDistance() > 16) return;
      const hit = pickSpot(list, pointer.x, pointer.y);
      if (hit) this.onTap(hit);
    });
    box.add(zone);
    const layer: RoomLayer = { box, spots };
    this.layers.set(room, layer);
    return layer;
  }
}
