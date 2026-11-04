import Phaser from 'phaser';
import { flags } from '../core/flags';
import type { WorldRoom } from '../content/world';
import { allSpots } from '../logic';
import { markTried } from './caseProgress';
import { GAME_H, GAME_W, SCENE } from '../shared/types';
import type { RoomId, RoomSceneData, Spot } from '../shared/types';
import { COLOR, DEPTH, ROOM_LABEL, SAFE, drawPlate, isCalm, makeText } from '../ui/theme';
import { HomeMenu } from './HomeMenu';
import { HomeSpots } from './HomeSpots';
import { RoomRun } from './RoomRun';
import type { RunView } from './RoomRun';
import { drawRoomShell } from './homeDraw';
import { drawRoomProps } from './homeProps';
import { ensureGroup } from '../core/assets';
import { PINCH_OUT, clampCamera, dist, panCamera, pinchCamera } from './homeGesture';
import { HomeActors } from './homeActors';
import { SpotHints } from './homeHints';
import { HomeSky } from './homeSky';
import { bakeYard } from './homeYard';
import { drawStairs, drawStairsArt, stairsTarget } from './homeStairs';
import {
  HOUSE_WORLD, LINKS, roomAt, roomBounds, roomPolygon, focusCamera, lerpCamera, overviewCamera, screenToArt,
} from './homeWorld';
import type { CameraState } from './homeWorld';

const TWEEN_MS = 300;
const BTN = 96;
const TAP_SLOP = 14;

const LONG_MS = 450;

interface HomeHooks { spots(): Array<{ spotId: string; x: number; y: number }>; hotspots(): Array<{ room: RoomId; x: number; y: number }>; focus(room: RoomId): void; overview(): void; focused(): RoomId | null }

/**
 * `?view=home` (SCENE.Home): ONE connected house on the global iso grid. Overview shows the whole cutaway; tapping a
 * room zooms in (Focus); the back button or a tap outside returns. Placeholder shells until `shell/<room>` frames land.
 */
export class HomeScene extends Phaser.Scene {
  __e2e?: HomeHooks;
  private world!: Phaser.GameObjects.Container;
  private shells = new Map<RoomId, Phaser.GameObjects.Container>();
  private dimmers = new Map<RoomId, Phaser.GameObjects.Graphics>();
  private rooms!: Phaser.GameObjects.Container;
  private sky: HomeSky | null = null;
  private hints: SpotHints | null = null;
  private actors: HomeActors | null = null;
  private pinch: { d0: number; cam: CameraState } | null = null;
  private panning = false;
  private cam!: CameraState;
  private readonly baseCam: CameraState = overviewCamera(GAME_W, GAME_H);
  private focusRoom: RoomId | null = null;
  private tween: Phaser.Tweens.Tween | null = null;
  private back: Phaser.GameObjects.Container | null = null;
  private doors: Phaser.GameObjects.Container[] = [];
  private menu: HomeMenu | null = null;
  private data0: RoomSceneData | null = null;
  private run: RoomRun | null = null;
  private spots: HomeSpots | null = null;
  private longTimer: Phaser.Time.TimerEvent | null = null;
  private longFired = false;

  constructor() {
    super(SCENE.Home);
  }

  init(data?: RoomSceneData): void {
    this.data0 = data && data.mode ? data : null;
    this.run = null;
    this.spots = null;
    this.longTimer = null;
    this.longFired = false;
    this.shells.clear();
    this.dimmers.clear();
    this.sky = null;
    this.hints = null;
    this.actors = null;
    this.doors = [];
    this.focusRoom = null;
    this.tween = null;
    this.back = null;
    this.menu = null;
    this.__e2e = undefined;
  }

  create(): void {
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
    this.cameras.main.setBackgroundColor(COLOR.sky);
    this.sky = new HomeSky(this, isCalm(this));
    this.world = this.add.container(0, 0);
    this.rooms = this.add.container(0, 0);
    this.world.add(this.rooms);
    void Promise.all([ensureGroup(this, 'room:slice'), ensureGroup(this, 'house')]).then(() => { if (this.sys.isActive() && this.rooms.active) this.rebuildRooms(); });
    void ensureGroup(this, 'house').then(() => { if (this.sys.isActive() && this.rooms.active) this.world.addAt(bakeYard(this), 0); });
    for (const s of HOUSE_WORLD) {
      const g = this.add.container(0, 0);
      this.buildRoom(g, s.room);
      const dim = this.add.graphics().setVisible(false);
      dim.fillStyle(COLOR.plateEdge, 0.75).fillPoints(roomPolygon(s.room), true);
      this.rooms.add([g, dim]);
      this.shells.set(s.room, g);
      this.dimmers.set(s.room, dim);
    }
    this.apply(overviewCamera(GAME_W, GAME_H));
    this.refreshDim();
    this.input.on('pointerdown', this.onDown, this);
    this.input.on('pointerup', this.onTap, this);
    this.input.on('pointermove', this.onMove, this);
    this.input.addPointer(1);
    if (this.data0) { if (!this.startRun(this.data0)) return; } else this.menu = new HomeMenu(this);
    if (flags().e2e) this.__e2e = this.makeHooks();
  }

  /** (Re)builds one room's static layer: shell, then decor in painter order (baked `prop/<kind>` art where a frame exists, a box otherwise). */
  private buildRoom(c: Phaser.GameObjects.Container, room: RoomId): void {
    c.removeAll(true);
    const g = this.add.graphics();
    drawRoomShell(g, room);
    c.add(g);
    drawRoomProps(this, c, room as WorldRoom);
    if (drawStairsArt(this, c, room as WorldRoom)) return;
    const st = this.add.graphics();
    drawStairs(st, room as WorldRoom);
    c.add(st);
  }

  /** Called when the room art atlas arrives: swaps placeholder boxes for frames. */
  private rebuildRooms(): void {
    for (const [room, c] of this.shells) this.buildRoom(c, room);
  }

  /** A morning inside the house: RoomRun owns the rules, HomeSpots is its view. */
  private startRun(data: RoomSceneData): boolean {
    const run = new RoomRun(this, data);
    if (!run.prepare()) return false;
    this.run = run;
    const spots = new HomeSpots(this, this.world, allSpots(run.profile).filter((sp) => run.rooms.includes(sp.room)), run.session, () => this.cam, { gated: (id) => run.scenario.gates[id] !== undefined, early: () => run.profile.settings.showLockIcons });
    this.spots = spots;
    this.hints = new SpotHints(this, this.world, spots);
    this.actors = new HomeActors(this, this.world, () => isCalm(this) || run.mode === 'rush' || !run.profile.settings.walkAnim, 'living');
    const view: RunView = {
      playAction: (sp) => spots.playAction(sp), refresh: (id) => spots.refresh(id), pulse: (id) => spots.pulse(id),
      center: (id) => spots.center(id), zoomTo: (sp, done) => this.zoomToSpot(sp, done), resetZoom: () => this.resetZoom(),
    };
    run.mount(view, { goRoom: (r) => this.focusOn(r), useHouse: true, onHouse: () => { if (!run.modalOpen()) this.focusOn(null); } });
    this.focusRoom = run.start;
    this.apply(focusCamera(run.start, GAME_W, GAME_H));
    this.refreshDim();
    this.buildChrome();
    spots.showRoom(run.start);
    this.actors?.setRoom(run.start);
    run.setCurrent(run.start);
    run.begin();
    return true;
  }

  private makeHooks(): HomeHooks {
    return {
      hotspots: () => HOUSE_WORLD.map((s) => {
        const r = roomBounds(s.room);
        return { room: s.room, x: (r.x + r.w / 2 - this.cam.cx) * this.cam.zoom + GAME_W / 2, y: (r.y + r.h / 2 - this.cam.cy) * this.cam.zoom + GAME_H / 2 };
      }),
      spots: () => this.spots?.list() ?? [],
      focus: (r) => this.focusOn(r),
      overview: () => this.focusOn(null),
      focused: () => this.focusRoom,
    };
  }

  private apply(c: CameraState): void {
    this.cam = c;
    this.sky?.sync(c, this.baseCam);
    this.world.setScale(c.zoom).setPosition(GAME_W / 2 - c.cx * c.zoom, GAME_H / 2 - c.cy * c.zoom);
    this.spots?.syncBadges();
  }

  private onDown(p: Phaser.Input.Pointer): void {
    this.hints?.touch();
    this.longFired = false;
    this.longTimer?.remove();
    const spot = this.run && this.focusRoom ? this.spots?.spotAt({ x: p.x, y: p.y }) : undefined;
    if (!spot || !this.run) return;
    this.longTimer = this.time.delayedCall(LONG_MS, () => { this.longFired = true; this.run?.onLong(spot); });
  }

  /** Overview: one finger drags the house, two fingers pinch-zoom. Focus: pinching out returns to the Overview. */
  private onMove(p: Phaser.Input.Pointer): void {
    if (this.run?.modalOpen() || this.tween) return;
    const a = this.input.pointer1; const b = this.input.pointer2;
    if (a.isDown && b.isDown) {
      const d = dist({ x: a.x, y: a.y }, { x: b.x, y: b.y });
      if (!this.pinch) { this.pinch = { d0: d, cam: this.cam }; this.panning = true; return; }
      const ratio = d / Math.max(1, this.pinch.d0);
      if (this.focusRoom) { if (ratio < PINCH_OUT) { this.pinch = null; this.focusOn(null); } return; }
      this.apply(pinchCamera(this.pinch.cam, ratio, this.baseCam));
      return;
    }
    this.pinch = null;
    if (this.focusRoom || !p.isDown || this.menuOpen()) return;
    if (!this.panning && Phaser.Math.Distance.Between(p.downX, p.downY, p.x, p.y) <= TAP_SLOP) return;
    this.panning = true;
    this.apply(clampCamera(panCamera(this.cam, p.x - p.prevPosition.x, p.y - p.prevPosition.y)));
  }

  private toScreen(a: { x: number; y: number }): { x: number; y: number } {
    return { x: (a.x - this.cam.cx) * this.cam.zoom + GAME_W / 2, y: (a.y - this.cam.cy) * this.cam.zoom + GAME_H / 2 };
  }

  private menuOpen(): boolean { return this.menu?.sheetOpen() ?? false; }

  private onTap(p: Phaser.Input.Pointer): void {
    const dragged = this.panning;
    this.panning = false;
    this.pinch = null;
    if (dragged) return;
    this.longTimer?.remove();
    if (this.longFired) return;
    if (Phaser.Math.Distance.Between(p.downX, p.downY, p.upX, p.upY) > TAP_SLOP) return;
    if (this.run && this.run.modalOpen()) return;
    if (this.run && this.focusRoom) {
      const spot: Spot | undefined = this.spots?.spotAt({ x: p.upX, y: p.upY });
      if (this.actors?.busy) return;
      if (!spot && this.actors?.tapCat(p.upX, p.upY, (a) => this.toScreen(a))) return;
      if (spot) {
        const run = this.run;
        markTried(run.session, spot.id); this.spots?.touch(spot.id);
        if (this.actors) this.actors.walkTo(spot, () => run.onSpot(spot)); else run.onSpot(spot);
        return;
      }
    }
    const art = screenToArt({ x: p.upX, y: p.upY }, this.cam, GAME_W, GAME_H);
    const room = roomAt(art);
    if (this.focusRoom) {
      const up = stairsTarget(this.focusRoom, art);
      if (up && (!this.run || this.run.rooms.includes(up))) { this.focusOn(up); return; }
    }
    if (!this.focusRoom) { if (room) this.focusOn(room); return; }
    if (!room) this.focusOn(null);
  }

  /** Zoom to a room (or back to the Overview when null) within TWEEN_MS; instant when calm/reduced motion. */
  focusOn(room: RoomId | null): void {
    if (room === this.focusRoom) return;
    this.focusRoom = room;
    const to = room ? focusCamera(room, GAME_W, GAME_H) : overviewCamera(GAME_W, GAME_H);
    this.tween?.stop();
    this.tween = null;
    this.refreshDim();
    this.buildChrome();
    this.menu?.setShown(!room);
    this.spots?.showRoom(room);
    this.actors?.setRoom(room);
    if (room) this.run?.setCurrent(room);
    this.tweenTo(to);
  }

  private tweenTo(to: CameraState, ms = TWEEN_MS, done?: () => void): void {
    this.tween?.stop();
    this.tween = null;
    if (isCalm(this)) { this.apply(to); done?.(); return; }
    const from = this.cam;
    const state = { t: 0 };
    this.tween = this.tweens.add({
      targets: state, t: 1, duration: ms, ease: 'Cubic.easeOut',
      onUpdate: () => this.apply(lerpCamera(from, to, state.t)),
      onComplete: () => { this.apply(to); this.tween = null; done?.(); },
    });
  }

  /** Before a lock's puzzle opens: push the camera onto the piece, then call done. */
  private zoomToSpot(spot: Spot, done: () => void): void {
    const c = this.spots?.artCentre(spot.id);
    if (!c || !this.focusRoom) { done(); return; }
    const base = focusCamera(this.focusRoom, GAME_W, GAME_H);
    this.tweenTo({ zoom: base.zoom * 1.6, cx: c.x, cy: c.y }, 240, done);
  }

  private resetZoom(): void {
    if (this.focusRoom) this.tweenTo(focusCamera(this.focusRoom, GAME_W, GAME_H), 240);
  }

  private refreshDim(): void {
    // Neighbours stay opaque but darkened (~25% brightness) and sit BEHIND the focused room, never over it.
    for (const [room, dim] of this.dimmers) dim.setVisible(!!this.focusRoom && room !== this.focusRoom);
    const f = this.focusRoom ? this.shells.get(this.focusRoom) : undefined;
    if (f) this.rooms.bringToTop(f);
  }

  private chip(x: number, y: number, label: string, cb: () => void): Phaser.GameObjects.Container {
    const c = this.add.container(x, y).setDepth(DEPTH.hud);
    const w = Math.max(BTN, label.length * 20 + 40);
    const plate = this.add.graphics();
    drawPlate(plate, -w / 2, -BTN / 2, w, BTN, 0, COLOR.plateLight, COLOR.plateEdge);
    const t = makeText(this, 0, 0, label).setOrigin(0.5);
    c.add([plate, t]).setSize(w, BTN).setInteractive({ useHandCursor: true });
    c.on('pointerup', cb);
    return c;
  }

  private buildChrome(): void {
    this.back?.destroy();
    for (const d of this.doors) d.destroy();
    this.doors = [];
    const room = this.focusRoom;
    this.back = room ? this.chip(SAFE + BTN / 2 + 24, SAFE + BTN / 2, '< House', () => this.focusOn(null)) : null;
    if (!room) return;
    if (this.run) this.doors.push(this.chip(SAFE + 130, GAME_H - SAFE - BTN / 2, 'Show tappables', () => this.hints?.outline()));
    const near = LINKS.flatMap(([a, b]) => (a === room ? [b] : b === room ? [a] : [])).filter((r) => !this.run || this.run.rooms.includes(r));
    near.forEach((to, i) => {
      this.doors.push(this.chip(GAME_W - SAFE - 140, SAFE + BTN / 2 + i * (BTN + 12), ROOM_LABEL[to], () => this.focusOn(to)));
    });
  }

  private cleanup(): void {
    this.tween?.stop();
    this.longTimer?.remove();
    this.input.off('pointerdown', this.onDown, this);
    this.input.off('pointerup', this.onTap, this);
    this.input.off('pointermove', this.onMove, this);
    this.run?.destroy();
    this.spots?.destroy();
    this.run = null;
    this.spots = null;
    this.tween = null;
    this.menu?.destroy();
    this.menu = null;
    this.sky?.destroy();
    this.sky = null;
    this.hints?.destroy();
    this.hints = null;
    this.actors?.destroy();
    this.actors = null;
    this.back = null;
    this.doors = [];
    this.shells.clear();
    this.dimmers.clear();
    this.__e2e = undefined;
  }
}
