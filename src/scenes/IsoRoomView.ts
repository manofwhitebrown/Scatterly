import Phaser from 'phaser';
import { ISO_DIMS, boxTexture, depthKey, isoToScreen } from '../art/iso';
import { ISO_BADGE } from '../art/isoBadges';
import { propSpriteInfo } from '../art/isoProps';
import { ensureRoomShell, shellSize } from '../art/isoShell';
import { specFor } from '../art/isoTheme';
import { LAYOUTS, PROPS } from '../content/layout';
import type { Prop } from '../content/layout';
import { isLowFx } from '../core/perf';
import type { GameSession } from '../logic';
import { tex } from '../shared/types';
import type { RoomId, Spot, SpotId } from '../shared/types';
import { PressZone } from '../ui/PressZone';
import { pickSpot } from '../ui/hit';
import { COLOR, isCalm } from '../ui/theme';
import { ROOM_ORIGIN, nearestUnsearched, placementOf, project, screenSpots } from '../ui/isoGrid';

interface SpotView { spot: Spot; img: Phaser.GameObjects.Image; lock: Phaser.GameObjects.Image | null; check: Phaser.GameObjects.Image | null }
interface DoorView { to: RoomId; x: number; y: number; arrow: Phaser.GameObjects.Graphics }
interface Layer { box: Phaser.GameObjects.Container; spots: Map<SpotId, SpotView>; list: Spot[]; zone: PressZone; doors: DoorView[] }

/** Badge image from AI-4's baked badge textures (padlock on gated containers, check on searched ones). */
function badge(scene: Phaser.Scene, key: string, x: number, y: number): Phaser.GameObjects.Image {
  return scene.add.image(x, y, key);
}

/** Door arrow badge; a 96x96 zone sits over it so it is easy to hit. */
function makeArrow(scene: Phaser.Scene, x: number, y: number, wall: 'left' | 'right'): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics().setPosition(x, y);
  const dir = wall === 'left' ? -1 : 1;
  g.fillStyle(COLOR.plateEdge, 0.9).fillCircle(0, 0, 28);
  g.fillStyle(COLOR.cream, 1).fillTriangle(-12 * dir, -14, -12 * dir, 14, 14 * dir, 0);
  return g;
}

/** Isometric room: baked shell + baked furniture textures, depth-sorted once, one room built at a time. */
export class IsoRoomView {
  private readonly layers = new Map<RoomId, Layer>();
  private current: RoomId | null = null;
  private pulseSpot: SpotId | null = null;
  private idleSec = 0;
  private lastTouch = { x: 640, y: 360 };
  private readonly idleTimer: Phaser.Time.TimerEvent;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly session: GameSession,
    private readonly isLocked: (id: SpotId) => boolean,
    private readonly onTap: (spot: Spot) => void,
    private readonly onLong: (spot: Spot) => void,
    private readonly onDoor: (to: RoomId) => void,
    private readonly canIdle: () => boolean,
  ) {
    this.idleTimer = scene.time.addEvent({ delay: 1000, loop: true, callback: this.idleTick, callbackScope: this });
    scene.input.on('pointerdown', this.touch, this);
  }

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

  /** Door arrow centres of the current room (G11 navigation tests). */
  doors(): Array<{ to: RoomId; x: number; y: number }> {
    const layer = this.current !== null ? this.layers.get(this.current) : undefined;
    return layer ? layer.doors.map((d) => ({ to: d.to, x: d.x, y: d.y })) : [];
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
    if (opened && !v.check) {
      v.check = badge(this.scene, ISO_BADGE.check, v.spot.x + v.spot.w - 26, v.spot.y + 22);
      this.layers.get(v.spot.room)?.box.add(v.check);
    }
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

  /** Zoom the room (not the HUD) onto a lock, <= 250 ms, then call done. resetZoom undoes it. */
  zoomTo(spot: Spot, done: () => void): void {
    const box = this.current !== null ? this.layers.get(this.current)?.box : undefined;
    if (!box || isLowFx(this.scene.game)) {
      done();
      return;
    }
    const k = 1.5;
    this.scene.tweens.add({
      targets: box,
      scaleX: k,
      scaleY: k,
      x: 640 - k * (spot.x + spot.w / 2),
      y: 360 - k * (spot.y + spot.h / 2),
      duration: 220,
      ease: 'Sine.easeIn',
      onComplete: done,
    });
  }

  resetZoom(): void {
    for (const layer of this.layers.values()) {
      this.scene.tweens.killTweensOf(layer.box);
      layer.box.setPosition(0, 0).setScale(1);
    }
  }

  destroy(): void {
    this.idleTimer.remove(false);
    this.scene.input.off('pointerdown', this.touch, this);
    for (const layer of this.layers.values()) {
      for (const v of layer.spots.values()) this.scene.tweens.killTweensOf(v.img);
      for (const d of layer.doors) this.scene.tweens.killTweensOf(d.arrow);
      layer.zone.destroy();
      layer.box.destroy(true);
    }
    this.layers.clear();
    this.current = null;
  }

  private touch(p: Phaser.Input.Pointer): void {
    this.idleSec = 0;
    this.lastTouch = { x: p.x, y: p.y };
  }

  /** 1 Hz: after 10 s without input, shimmer the nearest unsearched container (never a hint, contents are not looked at). */
  private idleTick(): void {
    const layer = this.current !== null ? this.layers.get(this.current) : undefined;
    if (!layer || isCalm(this.scene) || !this.canIdle()) {
      this.idleSec = 0;
      return;
    }
    if (++this.idleSec < 10) return;
    this.idleSec = 0;
    const spot = nearestUnsearched(layer.list, (id) => this.session.isOpened(id), this.lastTouch);
    const v = spot ? layer.spots.get(spot.id) : undefined;
    if (!v) return;
    this.hop(v, 4, 2);
    v.img.setTint(0xfff0b0);
    this.scene.time.delayedCall(280, () => v.img.clearTint());
  }

  private flashArrow(g: Phaser.GameObjects.Graphics): void {
    if (isLowFx(this.scene.game)) return;
    this.scene.tweens.killTweensOf(g);
    g.setAlpha(0.5);
    this.scene.tweens.add({ targets: g, alpha: 1, duration: 120 });
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
      const spec = specFor(room);
      const s = shellSize(spec.cols, spec.rows);
      box.add(this.scene.add.image(o.x, o.y, tex.isoShell(room)).setOrigin(s.ox / s.w, s.oy / s.h));
    }
    // depth-sort once, props and furniture together: back (small key) to front
    const raw = (this.session.spotsIn(room) ?? []).slice();
    raw.sort((a, b) => depthKey(placementOf(a)) - depthKey(placementOf(b)));
    const list = screenSpots(o, raw);
    const order: Array<{ key: number; prop?: Prop; i?: number }> = [
      ...(PROPS[room] ?? []).map((prop) => ({ key: depthKey(prop.iso), prop })),
      ...raw.map((src, i) => ({ key: depthKey(placementOf(src)), i })),
    ].sort((a, b) => a.key - b.key);
    const spots = new Map<SpotId, SpotView>();
    for (const it of order) {
      if (it.prop) {
        const info = propSpriteInfo(it.prop);
        if (!this.scene.textures.exists(info.key)) continue;
        const at = isoToScreen(it.prop.iso.gx, it.prop.iso.gy, it.prop.iso.gz ?? 0);
        box.add(this.scene.add.image(o.x + at.x, o.y + at.y, info.key).setOrigin(info.originX, info.originY).setFlipX(info.flip));
        continue;
      }
      const src = it.i !== undefined ? raw[it.i] : undefined;
      const spot = it.i !== undefined ? list[it.i] : undefined;
      if (!src || !spot) continue;
      const bt = boxTexture(ISO_DIMS[src.kind]);
      const at = isoToScreen(src.iso.gx, src.iso.gy, src.iso.gz ?? 0);
      const img = this.scene.add
        .image(o.x + at.x, o.y + at.y, tex.isoSpot(src.kind, this.session.isOpened(src.id)))
        .setOrigin(bt.ox / bt.w, bt.oy / bt.h);
      box.add(img);
      spots.set(src.id, { spot, img, lock: null, check: null });
    }
    // padlock badges last, so no piece of furniture can cover them
    for (const v of spots.values()) {
      if (!this.isLocked(v.spot.id)) continue;
      const dims = ISO_DIMS[v.spot.kind];
      const iso = v.spot.iso;
      const m = project(o, iso.gx + dims.w / 2, iso.gy + dims.d / 2, (iso.gz ?? 0) + dims.h);
      v.lock = badge(this.scene, ISO_BADGE.padlock, m.x, m.y - 6);
      box.add(v.lock);
    }
    const zone = new PressZone(this.scene, {
      active: () => this.current === room,
      pick: (x, y) => pickSpot(list, x, y),
      onTap: this.onTap,
      onLong: this.onLong,
    });
    box.add(zone.zone);
    const doors: DoorView[] = [];
    for (const d of LAYOUTS[room].doors) {
      const p = d.wall === 'right' ? project(o, d.at + 0.5, 0, 2) : project(o, 0, d.at + 0.5, 2);
      const arrow = makeArrow(this.scene, p.x, p.y, d.wall);
      const hit = this.scene.add.zone(p.x, p.y, 96, 96).setInteractive({ useHandCursor: true });
      hit.on('pointerup', (pointer: Phaser.Input.Pointer) => {
        if (this.current !== room || pointer.getDistance() > 16) return;
        this.flashArrow(arrow);
        this.onDoor(d.to);
      });
      box.add([arrow, hit]);
      doors.push({ to: d.to, x: p.x, y: p.y, arrow });
    }
    const layer: Layer = { box, spots, list, zone, doors };
    this.layers.set(room, layer);
    return layer;
  }
}
