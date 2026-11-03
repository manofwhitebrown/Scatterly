import Phaser from 'phaser';
import { sfx } from '../audio/sfx';
import { HOUSE_MAP } from '../content/layout';
import { replayScript } from '../logic/replay';
import { GAME_W, SCENE, tex } from '../shared/types';
import type { ResultSceneData, RoomId } from '../shared/types';
import { Button } from '../ui/Button';
import { COLOR, CSS, DEPTH, SIZE, enterFade, go, isCalm, makeText } from '../ui/theme';
import { buildHouseTiles } from './houseTiles';
import { foundBeats, planBeats } from './replayPlan';
import type { Beat, Pt } from './replayPlan';

export const REPLAY_KEY = 'Replay';
const ALL_ROOMS: RoomId[] = HOUSE_MAP.map((s) => s.room);

/** Evening Replay: the avatar walks last night's steps through the cutaway house. Skippable; calm shows the end state. */
export class ReplayScene extends Phaser.Scene {
  private avatar: Phaser.GameObjects.Container | null = null;
  private caption: Phaser.GameObjects.Text | null = null;
  private bubble: Phaser.GameObjects.Image | null = null;
  private beats: Beat[] = [];
  private stamped = new Set<number>();
  private timers: Phaser.Time.TimerEvent[] = [];
  private data0!: ResultSceneData;

  constructor() {
    super(REPLAY_KEY);
  }

  create(data: ResultSceneData): void {
    enterFade(this);
    this.data0 = data;
    this.stamped = new Set();
    this.timers = [];
    const tiles = buildHouseTiles(this, ALL_ROOMS);
    const centre = {} as Record<RoomId, Pt>;
    for (const t of tiles) centre[t.room] = { x: t.x, y: t.y };
    this.beats = planBeats(replayScript(data.scenario, data.result), centre);

    makeText(this, GAME_W / 2, 36, 'Last night', { fontSize: `${SIZE.heading}px`, fontStyle: 'bold', color: CSS.amber }).setOrigin(0.5, 0);
    this.caption = makeText(this, GAME_W / 2, 600, '', { fontSize: `${SIZE.label}px`, wordWrap: { width: GAME_W - 160 }, align: 'center', maxLines: 2 }).setOrigin(0.5, 0);
    const g = this.add.graphics({ x: 0, y: 0 });
    g.fillStyle(COLOR.amber, 1).fillCircle(0, -34, 14).fillRoundedRect(-14, -20, 28, 36, 8);
    this.avatar = this.add.container(0, 0, [g]).setDepth(DEPTH.hud).setVisible(false);

    new Button(this, GAME_W - 160, 70, 240, 'Skip', () => this.showFinal());
    new Button(this, 160, 662, 240, 'Back', () => go(this, SCENE.Result, this.data0), { variant: 'primary' });

    if (isCalm(this) || this.beats.length === 0) {
      this.showFinal();
    } else {
      for (const b of this.beats) this.timers.push(this.time.delayedCall(b.atMs, () => this.play(b)));
      this.timers.push(this.time.delayedCall(this.beats[this.beats.length - 1]!.atMs + 1500, () => this.showFinal()));
    }
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.tweens.killAll();
      this.timers.forEach((t) => t.remove(false));
      this.timers = [];
      this.avatar = this.caption = this.bubble = null;
    });
  }

  private play(b: Beat): void {
    const av = this.avatar;
    if (!av) return;
    av.setVisible(true);
    this.caption?.setText(this.note(b));
    const land = (): void => {
      this.setBubble(b);
      if (b.step.found) this.stamp(b);
    };
    if (b.from === null) av.setPosition(b.to.x, b.to.y);
    if (b.walkMs === 0) {
      land();
      return;
    }
    this.bubble?.setVisible(false);
    this.tweens.add({ targets: av, x: b.to.x, y: b.to.y, duration: b.walkMs, ease: 'Sine.easeInOut', onComplete: land });
  }

  private note(b: Beat): string {
    const n = this.data0.scenario.evening[this.beats.indexOf(b)];
    return n ? `${n.clock}  ${n.note}` : '';
  }

  private setBubble(b: Beat): void {
    this.bubble?.destroy();
    this.bubble = null;
    const id = b.step.itemId;
    if (!id || !this.textures.exists(tex.item(id))) return;
    this.bubble = this.add.image(b.to.x, b.to.y - 100, tex.item(id)).setDisplaySize(56, 56).setDepth(DEPTH.hud + 1);
  }

  /** A found item stays on its tile with a green ring: what you recovered this morning. */
  private stamp(b: Beat): void {
    if (this.stamped.has(b.atMs)) return;
    this.stamped.add(b.atMs);
    const id = b.step.itemId;
    if (!id || !this.textures.exists(tex.item(id))) return;
    const k = this.stamped.size;
    this.add.image(b.to.x - 90 + k * 36, b.to.y + 60, tex.item(id)).setDisplaySize(44, 44).setDepth(DEPTH.hud);
    this.add.circle(b.to.x - 90 + k * 36, b.to.y + 60, 26).setStrokeStyle(3, COLOR.green).setDepth(DEPTH.hud);
    sfx.play('pop', { step: Math.min(k, 6) });
  }

  /** Final state: avatar at the last room, every recovered item stamped, no motion. */
  private showFinal(): void {
    this.timers.forEach((t) => t.remove(false));
    this.timers = [];
    this.tweens.killAll();
    const last = this.beats[this.beats.length - 1];
    if (!last) return;
    this.avatar?.setVisible(true).setPosition(last.to.x, last.to.y);
    this.caption?.setText(this.note(last));
    this.setBubble(last);
    for (const b of foundBeats(this.beats)) this.stamp(b);
  }
}
