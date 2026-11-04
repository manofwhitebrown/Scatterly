import Phaser from 'phaser';
import { frame } from '../art/manifest';
import { pathTo, standCells } from '../logic/path';
import type { Cell } from '../logic/path';
import type { RoomId, Spot } from '../shared/types';
import { FLOOR1_RAISE, HOUSE_WORLD, ROOM_SIZE, project } from './homeWorld';
import type { Pt } from './homeWorld';
import type { WorldRoom } from '../content/world';
import { catDelay, entryCell, facingOf, walkMs } from './homeWalk';

type Dir = 'se' | 'sw';
const CAT_HIT = 56; // game px

/** Frame list `prefix/0..n` from the manifest (stops at the first missing frame). */
function frames(prefix: string): Array<{ key: string; frame: string }> {
  const out: Array<{ key: string; frame: string }> = [];
  for (let i = 0; ; i++) { const f = frame(`${prefix}/${i}`); if (!f) return out; out.push({ key: f.atlas, frame: f.frame }); }
}

function anim(scene: Phaser.Scene, id: string, prefix: string, rate: number, repeat: number): boolean {
  if (scene.anims.exists(id)) return true;
  const fr = frames(prefix);
  if (fr.length === 0) return false;
  scene.anims.create({ key: id, frames: fr, frameRate: rate, repeat });
  return true;
}

const cellPt = (room: RoomId, c: Cell): Pt => {
  const s = HOUSE_WORLD.find((x) => x.room === room);
  return s ? project(s.wx + c.x + 0.5, s.wy + c.y + 0.5, s.floor * FLOOR1_RAISE) : { x: 0, y: 0 };
};

/**
 * The avatar (walks `pathTo` to the tapped container, at most 600 ms, instant when `instant()`), and the house cat
 * (sleeps, wanders now and then, reacts when tapped). Only the focused room's actors exist on screen; missing frames
 * simply mean no sprite and an instant arrival, never an error.
 */
export class HomeActors {
  private room: RoomId | null = null;
  private cell: Cell = { x: 0, y: 0 };
  private dir: Dir = 'se';
  private avatar: Phaser.GameObjects.Sprite | null = null;
  private cat: Phaser.GameObjects.Sprite | null = null;
  private catCell: Cell = { x: 2, y: 2 };
  private walking = false;
  private catTimer: Phaser.Time.TimerEvent | null = null;

  constructor(private readonly scene: Phaser.Scene, private readonly world: Phaser.GameObjects.Container, private readonly instant: () => boolean, private readonly catRoom: RoomId) {}

  private make(prefix: string, idleAnim: string): Phaser.GameObjects.Sprite | null {
    const f = frame(`${prefix}/0`);
    if (!f) return null;
    const s = this.scene.add.sprite(0, 0, f.atlas, f.frame).setOrigin(f.pivotX / f.w, f.pivotY / f.h);
    this.world.add(s);
    if (!this.instant()) s.play(idleAnim);
    return s;
  }

  setRoom(room: RoomId | null): void {
    this.avatar?.destroy(); this.cat?.destroy(); this.catTimer?.remove(false);
    this.avatar = null; this.cat = null; this.catTimer = null; this.walking = false;
    this.room = room;
    if (!room) return;
    const size = ROOM_SIZE[room as WorldRoom];
    this.cell = entryCell(size.w, size.d);
    anim(this.scene, 'av-se-idle', 'avatar/se/idle', 2, -1); anim(this.scene, 'av-sw-idle', 'avatar/sw/idle', 2, -1);
    anim(this.scene, 'av-se-walk', 'avatar/se/walk', 12, -1); anim(this.scene, 'av-sw-walk', 'avatar/sw/walk', 12, -1);
    anim(this.scene, 'av-se-reach', 'avatar/se/reach', 10, 0); anim(this.scene, 'av-sw-reach', 'avatar/sw/reach', 10, 0);
    this.avatar = this.make('avatar/se/idle', 'av-se-idle');
    this.avatar?.setPosition(...this.xy(this.cell));
    if (room === this.catRoom) this.spawnCat();
  }

  private xy(c: Cell): [number, number] { const p = cellPt(this.room as RoomId, c); return [p.x, p.y]; }

  private spawnCat(): void {
    anim(this.scene, 'cat-sleep', 'pet/cat/sleep', 2, -1); anim(this.scene, 'cat-walk', 'pet/cat/walk', 10, -1);
    anim(this.scene, 'cat-react', 'pet/cat/react', 10, 0); anim(this.scene, 'cat-idle', 'pet/cat/idle', 3, -1);
    this.cat = this.make('pet/cat/sleep', 'cat-sleep');
    this.cat?.setPosition(...this.xy(this.catCell));
    if (!this.instant()) this.catTimer = this.scene.time.delayedCall(catDelay(Math.random()), () => this.wander());
  }

  /** Cat strolls to a nearby free cell, then sleeps again. */
  private wander(): void {
    const room = this.room; const cat = this.cat;
    if (!room || !cat || this.instant()) return;
    const size = ROOM_SIZE[room as WorldRoom];
    const to = { x: Math.floor(Math.random() * size.w), y: Math.floor(Math.random() * size.d) };
    const path = pathTo(room, this.catCell, to);
    if (path.length < 2) { this.catTimer = this.scene.time.delayedCall(catDelay(Math.random()), () => this.wander()); return; }
    cat.play('cat-walk');
    const pts = path.map((c) => cellPt(room, c));
    this.scene.tweens.chain({
      targets: cat,
      tweens: pts.slice(1).map((p, i) => ({ x: p.x, y: p.y, duration: 380, onStart: () => cat.setFlipX(p.x < pts[i].x) })),
      onComplete: () => { this.catCell = path[path.length - 1]; cat.play('cat-sleep'); this.catTimer = this.scene.time.delayedCall(catDelay(Math.random()), () => this.wander()); },
    });
  }

  /** True when a tap at game-px (x, y) hit the cat; plays its reaction. Costs the player nothing. */
  tapCat(x: number, y: number, toScreen: (p: Pt) => Pt): boolean {
    if (!this.cat || this.walking) return false;
    const c = toScreen({ x: this.cat.x, y: this.cat.y - 6 });
    if (Math.hypot(c.x - x, c.y - y) > CAT_HIT) return false;
    if (!this.instant() && this.scene.anims.exists('cat-react')) {
      const cat = this.cat;
      cat.play('cat-react');
      cat.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => cat.play('cat-sleep'));
    }
    return true;
  }

  /** Walks to a cell next to `spot`, then calls `arrive`. Instant when calm / Rush / walkAnim off / no avatar art. */
  walkTo(spot: Spot, arrive: () => void): void {
    const room = this.room;
    const av = this.avatar;
    const stand = room ? standCells(room, spot.id)[0] : undefined;
    const path = room && stand ? pathTo(room, this.cell, stand) : [];
    const ms = walkMs(path.length, this.instant() || !av);
    if (!room || !av || path.length === 0) { arrive(); return; }
    this.cell = path[path.length - 1];
    const pts = path.map((c) => cellPt(room, c));
    if (ms === 0) { av.setPosition(pts[pts.length - 1].x, pts[pts.length - 1].y); arrive(); return; }
    this.walking = true;
    const per = ms / (pts.length - 1);
    this.scene.tweens.chain({
      targets: av,
      tweens: pts.slice(1).map((p, i) => ({
        x: p.x, y: p.y, duration: per,
        onStart: () => { this.dir = facingOf(p.x - pts[i].x, this.dir); av.play(`av-${this.dir}-walk`, true); },
      })),
      onComplete: () => { this.walking = false; av.play(`av-${this.dir}-idle`, true); arrive(); },
    });
  }

  get busy(): boolean { return this.walking; }

  destroy(): void {
    this.catTimer?.remove(false);
    this.avatar?.destroy(); this.cat?.destroy();
    this.avatar = null; this.cat = null;
  }
}
