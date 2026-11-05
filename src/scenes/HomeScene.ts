import Phaser from 'phaser';
import { flags } from '../core/flags';
import type { WorldRoom } from '../content/world';
import { allSpots } from '../logic';
import { markTried } from './caseProgress';
import { GAME_H, SCENE } from '../shared/types';
import type { RoomId, RoomSceneData, Spot } from '../shared/types';
import { COLOR, DEPTH, isCalm, makeText } from '../ui/theme';
import { HomeMenu } from './HomeMenu';
import { HomeSpots } from './HomeSpots';
import { RoomRun } from './RoomRun';
import type { RunView } from './RoomRun';
import { drawRoomShell, drawUpperShadow, drawUpperSlab } from './homeDraw';
import { drawRoomProps } from './homeProps';
import { buildHomeChrome } from './homeChrome';
import { HomeLight } from './homeLight';
import { shellPart } from '../art/light';
import type { LightTime } from '../art/light';
import { LAYOUT } from '../core/layout';
import { LAYOUT_EVENT } from '../core/screen';
import { hudBoxes } from '../ui/hudLayout';
import { DecorFeel } from './homeDecor';
import { artStats, artStatsText } from './homeArtStats';
import { hasFrame } from '../core/assets';
import { WORLD_ROOMS } from '../content/world';
import { ensureGroup } from '../core/assets';
import { PINCH_OUT, clampCamera, dist, panCamera, pinchCamera } from './homeGesture';
import { frame } from '../art/manifest';
import { addWindowGlow } from './homeGlow';
import { homeBack, listenBack } from './homeBack';
import { HomeActors } from './homeActors';
import { SpotHints } from './homeHints';
import { HomeSky } from './homeSky';
import { bakeYard } from './homeYard';
import { drawStairs, drawStairsArt, stairsTarget } from './homeStairs';
import {
  FLOOR1_RAISE, HOUSE_WORLD, LINKS, project, roomAt, roomBounds, roomPolygon, focusCamera, lerpCamera, overviewCamera, screenToArt,
} from './homeWorld';
import type { CameraState } from './homeWorld';

const TWEEN_MS = 300;
const BTN = 96;
const FOCUS_DIM = 0.72;
const TAP_SLOP = 14;

const LONG_MS = 450;

interface HomeHooks { spots(): Array<{ spotId: string; x: number; y: number }>; hotspots(): Array<{ room: RoomId; x: number; y: number }>; focus(room: RoomId): void; overview(): void; focused(): RoomId | null; hud(): HudRect[]; setLight(t: LightTime): void }
interface HudRect { id: string; x: number; y: number; w: number; h: number }

/**
 * `?view=home` (SCENE.Home): ONE connected house on the global iso grid. Overview shows the whole cutaway; tapping a
 * room zooms in (Focus); the back button or a tap outside returns. Placeholder shells until `shell/<room>` frames land.
 */
export class HomeScene extends Phaser.Scene {
  __e2e?: HomeHooks;
  private world!: Phaser.GameObjects.Container;
  private shells = new Map<RoomId, Phaser.GameObjects.Container>();
  private veil!: Phaser.GameObjects.Graphics;
  private light!: HomeLight;
  private lifted: { room: RoomId; at: number } | null = null;
  private rooms!: Phaser.GameObjects.Container;
  private sky: HomeSky | null = null;
  private hints: SpotHints | null = null;
  private actors: HomeActors | null = null;
  private decor: DecorFeel | null = null;
  private debugText: Phaser.GameObjects.Text | null = null;
  private pinch: { d0: number; cam: CameraState } | null = null;
  private panning = false;
  private cam!: CameraState;
  private baseCam: CameraState = overviewCamera(LAYOUT.w, GAME_H);
  private focusRoom: RoomId | null = null;
  private tween: Phaser.Tweens.Tween | null = null;
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
    this.sky = null;
    this.hints = null;
    this.actors = null;
    this.decor?.destroy();
    this.decor = null;
    this.debugText = null;
    this.doors = [];
    this.focusRoom = null;
    this.tween = null;
    this.menu = null;
    this.__e2e = undefined;
  }

  create(): void {
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
    listenBack(this, () => homeBack({ sheetOpen: this.menuOpen(), focused: !!this.focusRoom, run: this.run ?? null }, { closeSheet: () => this.menu?.closeSheet(), zoomOut: () => this.focusOn(null) }));
    this.cameras.main.setBackgroundColor(COLOR.sky);
    this.sky = new HomeSky(this, isCalm(this));
    this.world = this.add.container(0, 0);
    this.actors = new HomeActors(this, this.world, () => isCalm(this) || this.run?.mode === 'rush' || this.run?.profile.settings.walkAnim === false, 'living', () => isCalm(this));
    this.rooms = this.add.container(0, 0);
    this.world.add(this.rooms);
    this.veil = this.add.graphics().setVisible(false);
    this.veil.fillStyle(COLOR.plateEdge, FOCUS_DIM).fillRect(-5000, -4000, 10000, 8000);
    this.world.add(this.veil);
    this.light = new HomeLight(this, this.world);
    this.actors = new HomeActors(this, this.world, () => isCalm(this) || this.run?.mode === 'rush' || this.run?.profile.settings.walkAnim === false, 'living', () => isCalm(this));
    void Promise.all([ensureGroup(this, 'room:slice'), ensureGroup(this, 'house'), ...WORLD_ROOMS.map((r) => ensureGroup(this, `room:${r}`))]).then(() => { if (this.sys.isActive() && this.rooms.active) this.rebuildRooms(); });
    void ensureGroup(this, 'house').then(() => { if (this.sys.isActive() && this.rooms.active) this.world.addAt(bakeYard(this), 0); });
    for (const s of HOUSE_WORLD) {
      const g = this.add.container(0, 0);
      this.buildRoom(g, s.room);
      this.rooms.add(g);
      this.shells.set(s.room, g);
    }
    if (new URLSearchParams(window.location.search).get('debug') === '1') {
      this.debugText = makeText(this, 12, 8, artStatsText(artStats(hasFrame)), { fontSize: '20px' }).setOrigin(0, 0).setDepth(DEPTH.toast + 5).setScrollFactor(0);
    }
    this.baseCam = overviewCamera(LAYOUT.w, GAME_H);
    this.apply(this.baseCam);
    this.refreshDim();
    this.game.events.on(LAYOUT_EVENT, this.onLayout, this);
    this.input.on('pointerdown', this.onDown, this);
    this.input.on('pointerup', this.onTap, this);
    this.input.on('pointermove', this.onMove, this);
    this.input.addPointer(1);
    if (this.data0) { if (!this.startRun(this.data0)) return; } else this.menu = new HomeMenu(this);
    this.actors?.setRoom(this.focusRoom);
    if (flags().e2e) this.__e2e = this.makeHooks();
  }

  /** (Re)builds one room's static layer: shell, then decor in painter order (baked `prop/<kind>` art where a frame exists, a box otherwise). */
  private buildRoom(c: Phaser.GameObjects.Container, room: RoomId): void {
    c.removeAll(true);
    const upper = HOUSE_WORLD.find((s) => s.room === room)?.floor === 1;
    if (upper) { const sh = this.add.graphics(); drawUpperShadow(sh, room); c.add(sh); }
    const shell = frame(`shell/${room}/${shellPart(this.light.time)}`) ?? frame(`shell/${room}/full`);
    const slot = HOUSE_WORLD.find((s) => s.room === room);
    if (shell && slot) {
      // Baked shell (walls, floor, windows, door) at ROOM_SIZE; pivot is the back corner of the floor diamond.
      const at = project(slot.wx, slot.wy, slot.floor * FLOOR1_RAISE);
      c.add(this.add.image(at.x, at.y, shell.atlas, shell.frame).setOrigin(shell.pivotX / shell.w, shell.pivotY / shell.h));
    } else {
      const g = this.add.graphics();
      drawRoomShell(g, room);
      c.add(g);
    }
    if (upper) { const sl = this.add.graphics(); drawUpperSlab(sl, room); c.add(sl); }
    addWindowGlow(this, c, room as WorldRoom, this.light.time === 'dusk' || this.light.time === 'night');
    // Always draw the props (the Overview needs them too); `decor` only exists during a run, and `a?.f(g())` would skip g().
    const targets = drawRoomProps(this, c, room as WorldRoom);
    this.decor?.setTargets(room, targets);
    if (drawStairsArt(this, c, room as WorldRoom)) return;
    const st = this.add.graphics();
    drawStairs(st, room as WorldRoom);
    c.add(st);
  }

  /** Called when the room art atlas arrives: swaps placeholder boxes for frames. */
  private rebuildRooms(): void {
    for (const [room, c] of this.shells) this.buildRoom(c, room);
    this.spots?.redrawAll();
    if (this.actors && !this.actors.busy) this.actors.setRoom(this.focusRoom); // the cat / avatar art may have arrived after boot
    this.debugText?.setText(artStatsText(artStats(hasFrame)));
  }

  /** A morning inside the house: RoomRun owns the rules, HomeSpots is its view. */
  private startRun(data: RoomSceneData): boolean {
    const run = new RoomRun(this, data);
    if (!run.prepare()) return false;
    this.run = run;
    const spots = new HomeSpots(this, this.world, allSpots(run.profile).filter((sp) => run.rooms.includes(sp.room)), run.session, () => this.cam, { gated: (id) => run.scenario.gates[id] !== undefined, early: () => run.profile.settings.showLockIcons });
    this.spots = spots;
    this.hints = new SpotHints(this, this.world, spots);
    this.light.raise(this.world);
    this.decor = new DecorFeel(this, () => this.hints?.outline(), (a) => this.toScreen(a));
    for (const [r, c] of this.shells) this.buildRoom(c, r);
    const view: RunView = {
      playAction: (sp) => spots.playAction(sp), refresh: (id) => spots.refresh(id), pulse: (id) => spots.pulse(id),
      center: (id) => spots.center(id), zoomTo: (sp, done) => this.zoomToSpot(sp, done), resetZoom: () => this.resetZoom(),
    };
    run.mount(view, { goRoom: (r) => this.focusOn(r), useHouse: true, onHouse: () => { if (!run.modalOpen()) this.focusOn(null); } });
    this.focusRoom = run.start;
    this.apply(focusCamera(run.start, LAYOUT.w, GAME_H));
    this.refreshDim();
    this.buildChrome();
    spots.showRoom(run.start);
    this.actors?.setRoom(run.start);
    run.setCurrent(run.start);
    run.begin();
    return true;
  }

  /** Real on-screen rect of every HUD element (the AI-1 overlap e2e reads this). Test hook only. */
  private hudRects(): HudRect[] {
    const out: HudRect[] = this.run ? this.run.hud.rects() : [];
    if (this.run) out.push({ id: 'strip', ...hudBoxes(LAYOUT.w, LAYOUT.h, 0, 0).strip });
    this.doors.forEach((d, i) => { const b = d.getBounds(); out.push({ id: i === 0 ? 'show' : `nav${i - 1}`, x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) }); });
    return out;
  }

  private makeHooks(): HomeHooks {
    return {
      hotspots: () => HOUSE_WORLD.map((s) => {
        const r = roomBounds(s.room);
        return { room: s.room, x: (r.x + r.w / 2 - this.cam.cx) * this.cam.zoom + LAYOUT.w / 2, y: (r.y + r.h / 2 - this.cam.cy) * this.cam.zoom + GAME_H / 2 };
      }),
      spots: () => this.spots?.list() ?? [],
      focus: (r) => this.focusOn(r),
      overview: () => this.focusOn(null),
      focused: () => this.focusRoom,
      hud: () => this.hudRects(),
      setLight: (t) => { this.light.set(t); this.sky?.setTime(t); this.rebuildRooms(); },
    };
  }

  /** The window shape changed (rotation, resize): refit the camera to the new width. */
  private onLayout(): void {
    this.baseCam = overviewCamera(LAYOUT.w, GAME_H);
    this.tween?.stop();
    this.tween = null;
    this.apply(this.focusRoom ? focusCamera(this.focusRoom, LAYOUT.w, GAME_H) : this.baseCam);
  }

  private apply(c: CameraState): void {
    this.cam = c;
    this.sky?.sync(c, this.baseCam);
    this.world.setScale(c.zoom).setPosition(LAYOUT.w / 2 - c.cx * c.zoom, GAME_H / 2 - c.cy * c.zoom);
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
    return { x: (a.x - this.cam.cx) * this.cam.zoom + LAYOUT.w / 2, y: (a.y - this.cam.cy) * this.cam.zoom + GAME_H / 2 };
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
        this.decor?.piece();
        markTried(run.session, spot.id); this.spots?.touch(spot.id);
        if (this.actors) this.actors.walkTo(spot, () => run.onSpot(spot)); else run.onSpot(spot);
        return;
      }
    }
    const art = screenToArt({ x: p.upX, y: p.upY }, this.cam, LAYOUT.w, GAME_H);
    const room = roomAt(art);
    if (this.focusRoom) {
      const up = stairsTarget(this.focusRoom, art);
      if (up && (!this.run || this.run.rooms.includes(up))) { this.focusOn(up); return; }
      if (this.run) this.decor?.tap(this.focusRoom, art);
    }
    if (!this.focusRoom) { if (room) this.focusOn(room); return; }
    if (!room) this.focusOn(null);
  }

  /** Zoom to a room (or back to the Overview when null) within TWEEN_MS; instant when calm/reduced motion. */
  focusOn(room: RoomId | null): void {
    if (room === this.focusRoom) return;
    this.focusRoom = room;
    const to = room ? focusCamera(room, LAYOUT.w, GAME_H) : overviewCamera(LAYOUT.w, GAME_H);
    this.tween?.stop();
    this.tween = null;
    this.refreshDim();
    this.buildChrome();
    this.menu?.setShown(!room);
    this.spots?.showRoom(room);
    this.actors?.setRoom(room);
    if (room && this.run) this.decor?.firstHint();
    if (room) { this.run?.setCurrent(room); this.run?.feel.roomSwitch(room); }
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
    const base = focusCamera(this.focusRoom, LAYOUT.w, GAME_H);
    this.tweenTo({ zoom: base.zoom * 1.6, cx: c.x, cy: c.y }, 240, done);
  }

  private resetZoom(): void {
    if (this.focusRoom) this.tweenTo(focusCamera(this.focusRoom, LAYOUT.w, GAME_H), 240);
  }

  /**
   * Focus: ONE veil darkens everything alike (all other rooms, their props, the yard, the sky) and the focused room is
   * lifted above it, so nothing from a neighbouring room can show over the focused floor. Overview: no veil, rooms back in order.
   */
  private refreshDim(): void {
    if (this.lifted) { this.rooms.addAt(this.shells.get(this.lifted.room) as Phaser.GameObjects.Container, this.lifted.at); this.lifted = null; }
    const room = this.focusRoom;
    this.veil.setVisible(!!room);
    this.sky?.setDim(!!room, COLOR.plateEdge, FOCUS_DIM);
    const f = room ? this.shells.get(room) : undefined;
    if (!room || !f) return;
    this.lifted = { room, at: this.rooms.getIndex(f) };
    this.rooms.remove(f);
    this.world.addAt(f, this.world.getIndex(this.veil) + 1);
  }

  private buildChrome(): void {
    for (const d of this.doors) d.destroy();
    const room = this.focusRoom;
    const near = room ? LINKS.flatMap(([a, b]) => (a === room ? [b] : b === room ? [a] : [])).filter((r) => !this.run || this.run.rooms.includes(r)) : [];
    this.doors = room ? buildHomeChrome(this, { run: !!this.run, near, onShow: () => this.hints?.outline(), onGo: (r) => this.focusOn(r) }) : [];
  }

  private cleanup(): void {
    this.tween?.stop();
    this.game.events.off(LAYOUT_EVENT, this.onLayout, this);
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
    this.doors = [];
    this.shells.clear();
    this.lifted = null;
    this.__e2e = undefined;
  }
}
