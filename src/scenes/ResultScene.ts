import Phaser from 'phaser';
import { sfx } from '../audio/sfx';
import { GAME_H, GAME_W, SCENE, tex } from '../shared/types';
import type { EveningStep, ItemId, ResultSceneData } from '../shared/types';
import { Button } from '../ui/Button';
import { ScrollArea } from '../ui/ScrollArea';
import { COLOR, CSS, SIZE, enterFade, fmtClock, go, isCalm, makeText } from '../ui/theme';
import { REPLAY_KEY } from './ReplayScene';
import { STAR_FIRST_MS, STAR_STEP_MS, habitLine, revealStepMs } from './resultStory';

const RIGHT_X = 580;
const VIEW_TOP = 150;
const VIEW_BOTTOM = 600;
const CLOCK_W = 110;
const COIN_MS = 700;

export class ResultScene extends Phaser.Scene {
  private scroll: ScrollArea | null = null;
  private starObjs: Phaser.GameObjects.Text[] = [];
  private coinText: Phaser.GameObjects.Text | null = null;
  private coinTotal = 0;
  private lineObjs: Phaser.GameObjects.Text[] = [];
  private story: Phaser.Tweens.Tween[] = [];

  constructor() {
    super(SCENE.Result);
  }

  create(data: ResultSceneData): void {
    enterFade(this);
    const { result, scenario } = data;
    const calm = isCalm(this);
    const allFound = result.found.length >= result.targets.length;

    // Timeline layer first, so the cover plates drawn after it hide any overflow.
    const layer = this.add.container(0, 0);
    const zone = this.add.zone(RIGHT_X - 20, VIEW_TOP, GAME_W - RIGHT_X + 20, VIEW_BOTTOM - VIEW_TOP).setOrigin(0, 0);
    const contentH = this.buildTimeline(layer, scenario.evening, calm);

    const cover = this.add.graphics();
    cover.fillStyle(COLOR.bg, 1);
    cover.fillRect(RIGHT_X - 30, 0, GAME_W - RIGHT_X + 30, VIEW_TOP);
    cover.fillRect(0, VIEW_BOTTOM, GAME_W, GAME_H - VIEW_BOTTOM);
    cover.fillStyle(COLOR.plateEdge, 1);
    cover.fillRect(RIGHT_X - 32, 20, 3, VIEW_BOTTOM - 40);

    makeText(this, 60, 40, result.timedOut ? "Time's up!" : allFound ? 'Morning sorted!' : 'Morning over', {
      fontSize: `${SIZE.title}px`,
      fontStyle: 'bold',
      color: CSS.amber,
    });
    makeText(this, 60, 108, result.timedOut ? 'So close! Here is how last night went.' : scenario.title, {
      color: CSS.muted,
      wordWrap: { width: 480 },
    });
    makeText(this, RIGHT_X, 56, 'What happened last night', { fontSize: `${SIZE.heading}px`, fontStyle: 'bold' });

    this.buildStars(result.stars, calm);
    this.buildCoins(result.coinsEarned, calm);
    const habit = habitLine(result.habitHits);
    if (habit) makeText(this, RIGHT_X, 104, habit, { fontSize: '26px', color: CSS.green, wordWrap: { width: GAME_W - RIGHT_X - 40 }, maxLines: 1 });
    makeText(this, 60, 330,
      `Time: ${fmtClock(result.timeMs / 1000)}\nSearches: ${result.searches} (par ${scenario.parSearches})\nHints used: ${result.hintsUsed}\nFound: ${result.found.length} of ${result.targets.length}`,
      { fontSize: `${SIZE.label}px`, lineSpacing: 8 },
    );
    this.buildTargets(result.targets, result.found);

    new Button(this, 160, 662, 280, 'Last night', () => go(this, REPLAY_KEY, data));
    new Button(this, 460, 662, 280, 'Organise', () => go(this, SCENE.Organise));
    new Button(this, 760, 662, 280, 'Next morning', () => go(this, SCENE.ModeSelect), { variant: 'primary' });
    new Button(this, 1060, 662, 280, 'Menu', () => go(this, SCENE.Menu));

    this.scroll = new ScrollArea(this, layer, zone, { viewHeight: VIEW_BOTTOM - VIEW_TOP });
    this.scroll.setContentHeight(contentH - VIEW_TOP);
    this.scroll.attach();
    // Tap anywhere to jump to the end of the story (the buttons still work: they navigate away anyway).
    if (!calm) this.input.once('pointerdown', () => this.showAll());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scroll?.detach();
      this.scroll = null;
      this.tweens.killAll();
      this.starObjs = [];
      this.lineObjs = [];
      this.story = [];
      this.coinText = null;
    });
  }

  /** Final state of the whole story: stars stamped, coins counted, every evening line visible. */
  private showAll(): void {
    for (const t of this.story) t.stop();
    this.story = [];
    for (const s of this.starObjs) s.setScale(1);
    this.coinText?.setText(`+${this.coinTotal} coins`);
    for (const o of this.lineObjs) o.setAlpha(1);
  }

  /** Lays the evening out from VIEW_TOP downward; returns the bottom edge of the content. */
  private buildTimeline(layer: Phaser.GameObjects.Container, steps: EveningStep[], calm: boolean): number {
    let y = VIEW_TOP + 8;
    const base = STAR_FIRST_MS + 3 * STAR_STEP_MS + COIN_MS;
    const gap = revealStepMs(steps.length);
    for (const step of steps) {
      const clock = makeText(this, RIGHT_X, y, step.clock, { fontSize: `${SIZE.label}px`, fontStyle: 'bold', color: CSS.amber });
      const note = makeText(this, RIGHT_X + CLOCK_W, y + 2, step.note, { wordWrap: { width: GAME_W - RIGHT_X - CLOCK_W - 40 } });
      layer.add([clock, note]);
      if (!calm) {
        clock.setAlpha(0);
        note.setAlpha(0);
        this.lineObjs.push(clock, note);
        this.story.push(this.tweens.add({ targets: [clock, note], alpha: 1, duration: 200, delay: base + steps.indexOf(step) * gap }));
      }
      y += Math.max(note.height, 34) + 16;
    }
    return y + 8;
  }

  private buildStars(stars: number, calm: boolean): void {
    for (let i = 0; i < 3; i++) {
      const earned = i < stars;
      const star = makeText(this, 100 + i * 110, 215, '★', {
        fontSize: '96px',
        color: earned ? CSS.amber : '#5a4634',
      }).setOrigin(0.5);
      if (!earned || calm) continue;
      star.setScale(0);
      this.starObjs.push(star);
      this.story.push(
        this.tweens.add({ targets: star, scale: 1, duration: 240, delay: STAR_FIRST_MS + i * STAR_STEP_MS, ease: 'Back.easeOut', onStart: () => sfx.play('pop', { step: i }) }),
      );
    }
  }

  private buildCoins(coins: number, calm: boolean): void {
    if (coins <= 0) {
      makeText(this, 60, 282, 'No coins this time', { fontSize: `${SIZE.label}px`, color: CSS.muted });
      return;
    }
    const text = makeText(this, 60, 276, '+0 coins', { fontSize: '36px', fontStyle: 'bold', color: CSS.amber });
    this.coinText = text;
    this.coinTotal = coins;
    if (calm) {
      text.setText(`+${coins} coins`);
      return;
    }
    const counter = { v: 0 };
    let shown = 0;
    this.story.push(this.tweens.add({
      targets: counter,
      v: coins,
      duration: COIN_MS,
      delay: STAR_FIRST_MS + 3 * STAR_STEP_MS,
      onStart: () => sfx.play('coin'),
      ease: 'Cubic.easeOut',
      onUpdate: () => {
        const n = Math.round(counter.v);
        if (n === shown) return;
        shown = n;
        text.setText(`+${n} coins`);
      },
      onComplete: () => text.setText(`+${coins} coins`),
    }));
  }

  private buildTargets(targets: ItemId[], found: ItemId[]): void {
    targets.forEach((id, i) => {
      const img = this.add.image(90 + i * 84, 548, tex.item(id)).setDisplaySize(60, 60);
      if (!found.includes(id)) {
        img.setTintFill(0x000000);
        img.setAlpha(0.5);
      }
    });
  }
}
