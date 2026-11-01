import Phaser from 'phaser';
import { sfx } from '../audio/sfx';
import { isLowFx } from '../core/perf';
import { GAME_H, GAME_W, SCENE, tex } from '../shared/types';
import type { EveningStep, ItemId, ResultSceneData } from '../shared/types';
import { Button } from '../ui/Button';
import { ScrollArea } from '../ui/ScrollArea';
import { COLOR, CSS, SIZE, enterFade, fmtClock, go, makeText } from '../ui/theme';

const RIGHT_X = 580;
const VIEW_TOP = 150;
const VIEW_BOTTOM = 600;
const CLOCK_W = 110;

export class ResultScene extends Phaser.Scene {
  private scroll: ScrollArea | null = null;

  constructor() {
    super(SCENE.Result);
  }

  create(data: ResultSceneData): void {
    enterFade(this);
    const { result, scenario } = data;
    const low = isLowFx(this.game);
    const allFound = result.found.length >= result.targets.length;

    // Timeline layer first, so the cover plates drawn after it hide any overflow.
    const layer = this.add.container(0, 0);
    const zone = this.add.zone(RIGHT_X - 20, VIEW_TOP, GAME_W - RIGHT_X + 20, VIEW_BOTTOM - VIEW_TOP).setOrigin(0, 0);
    const contentH = this.buildTimeline(layer, scenario.evening);

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

    this.buildStars(result.stars, low);
    this.buildCoins(result.coinsEarned, low);
    makeText(this, 60, 330,
      `Time: ${fmtClock(result.timeMs / 1000)}\nSearches: ${result.searches} (par ${scenario.parSearches})\nHints used: ${result.hintsUsed}\nFound: ${result.found.length} of ${result.targets.length}`,
      { fontSize: `${SIZE.label}px`, lineSpacing: 8 },
    );
    this.buildTargets(result.targets, result.found);

    new Button(this, 250, 662, 300, 'Organise', () => go(this, SCENE.Organise));
    new Button(this, 640, 662, 300, 'Next morning', () => go(this, SCENE.ModeSelect), { variant: 'primary' });
    new Button(this, 1030, 662, 300, 'Menu', () => go(this, SCENE.Menu));

    this.scroll = new ScrollArea(this, layer, zone, { viewHeight: VIEW_BOTTOM - VIEW_TOP });
    this.scroll.setContentHeight(contentH - VIEW_TOP);
    this.scroll.attach();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scroll?.detach();
      this.scroll = null;
      this.tweens.killAll();
    });
  }

  /** Lays the evening out from VIEW_TOP downward; returns the bottom edge of the content. */
  private buildTimeline(layer: Phaser.GameObjects.Container, steps: EveningStep[]): number {
    let y = VIEW_TOP + 8;
    for (const step of steps) {
      const clock = makeText(this, RIGHT_X, y, step.clock, { fontSize: `${SIZE.label}px`, fontStyle: 'bold', color: CSS.amber });
      const note = makeText(this, RIGHT_X + CLOCK_W, y + 2, step.note, { wordWrap: { width: GAME_W - RIGHT_X - CLOCK_W - 40 } });
      layer.add([clock, note]);
      y += Math.max(note.height, 34) + 16;
    }
    return y + 8;
  }

  private buildStars(stars: number, low: boolean): void {
    for (let i = 0; i < 3; i++) {
      const earned = i < stars;
      const star = makeText(this, 100 + i * 110, 215, '★', {
        fontSize: '96px',
        color: earned ? CSS.amber : '#5a4634',
      }).setOrigin(0.5);
      if (!earned || low) continue;
      star.setScale(0);
      this.tweens.add({ targets: star, scale: 1, duration: 240, delay: 150 + i * 240, ease: 'Back.easeOut' });
    }
  }

  private buildCoins(coins: number, low: boolean): void {
    if (coins <= 0) {
      makeText(this, 60, 282, 'No coins this time', { fontSize: `${SIZE.label}px`, color: CSS.muted });
      return;
    }
    const text = makeText(this, 60, 276, '+0 coins', { fontSize: '36px', fontStyle: 'bold', color: CSS.amber });
    if (low) {
      text.setText(`+${coins} coins`);
      return;
    }
    sfx.play('coin');
    const counter = { v: 0 };
    let shown = 0;
    this.tweens.add({
      targets: counter,
      v: coins,
      duration: 700,
      ease: 'Cubic.easeOut',
      onUpdate: () => {
        const n = Math.round(counter.v);
        if (n === shown) return;
        shown = n;
        text.setText(`+${n} coins`);
      },
      onComplete: () => text.setText(`+${coins} coins`),
    });
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
