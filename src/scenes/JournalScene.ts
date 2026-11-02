import Phaser from 'phaser';
import { PUZZLE_KINDS, SCENE } from '../shared/types';
import type { PuzzleStat } from '../shared/types';
import { bookEntries } from './puzzleBook';
import { Button } from '../ui/Button';
import { ScrollArea } from '../ui/ScrollArea';
import { COLOR, CSS, SIZE, drawPlate, enterFade, fmtClock, getProfile, go, makeText } from '../ui/theme';

const VIEW_TOP = 110;
const VIEW_H = 500;
const BOX_W = 150;
const BOX_GAP = 10;

/** Week board, streak, lifetime stats and earned achievements. Built once, scrolled by moving one layer. */
export class JournalScene extends Phaser.Scene {
  private scroll: ScrollArea | null = null;

  constructor() {
    super(SCENE.Journal);
  }

  create(): void {
    enterFade(this);
    const p = getProfile(this);
    const layer = this.add.container(0, 0);
    let y = VIEW_TOP + 24;

    layer.add(makeText(this, 80, y, `Streak ${p.streak}   ·   Best ${p.stats.bestStreak}   ·   Stars this week ${p.weekStars}`, {
      fontSize: `${SIZE.label}px`,
      color: CSS.amber,
      fontStyle: 'bold',
    }).setOrigin(0, 0));
    y += 56;

    const board = this.add.graphics();
    const week = Math.min(6, Math.max(0, p.weekMorning));
    for (let i = 0; i < 7; i++) {
      const bx = 80 + i * (BOX_W + BOX_GAP);
      const done = i < week;
      const today = i === week;
      drawPlate(board, bx, y, BOX_W, 100, 16, done ? COLOR.plateLight : COLOR.plate, today ? COLOR.amber : COLOR.plateEdge);
      layer.add(makeText(this, bx + BOX_W / 2, y + 30, `Day ${i + 1}`, { fontSize: `${SIZE.body}px`, color: today ? CSS.amber : CSS.cream }).setOrigin(0.5));
      layer.add(makeText(this, bx + BOX_W / 2, y + 68, done ? '✓' : today ? 'Today' : '·', { fontSize: `${SIZE.body}px`, color: done ? CSS.green : CSS.muted }).setOrigin(0.5));
    }
    y += 140;

    const s = p.stats;
    const lines = [
      `Mornings played: ${s.mornings}`,
      `Perfect mornings: ${s.perfect}`,
      `Items found: ${s.itemsFound}`,
      `Puzzles solved: ${s.puzzlesSolved}`,
      `Hints used: ${s.hintsUsed}`,
      `Fastest morning: ${s.fastestMs === null ? '-' : fmtClock(Math.round(s.fastestMs / 1000))}`,
    ];
    for (const line of lines) {
      layer.add(makeText(this, 80, y, line, { fontSize: `${SIZE.body}px` }).setOrigin(0, 0));
      y += 44;
    }
    y += 20;
    y = this.buildBook(layer, board, p.puzzles, y);
    layer.addAt(board, 0);
    layer.add(makeText(this, 80, y, 'Achievements', { fontSize: `${SIZE.heading}px`, fontStyle: 'bold', color: CSS.amber }).setOrigin(0, 0));
    y += 60;
    if (p.achievements.length === 0) {
      layer.add(makeText(this, 80, y, 'Play a morning to earn your first one.', { fontSize: `${SIZE.body}px`, color: CSS.muted }).setOrigin(0, 0));
      y += 44;
    }
    for (const id of p.achievements) {
      layer.add(makeText(this, 80, y, `★ ${id}`, { fontSize: `${SIZE.body}px` }).setOrigin(0, 0));
      y += 44;
    }

    // Opaque header and footer cover the scrolled layer's overflow (no masks).
    const frame = this.add.graphics().setDepth(10);
    frame.fillStyle(COLOR.bg, 1);
    frame.fillRect(0, 0, 1280, VIEW_TOP);
    frame.fillRect(0, VIEW_TOP + VIEW_H, 1280, 720 - VIEW_TOP - VIEW_H);
    makeText(this, 640, 56, 'Journal', { fontSize: `${SIZE.title}px`, fontStyle: 'bold', color: CSS.amber }).setOrigin(0.5).setDepth(11);
    new Button(this, 104, 664, 160, 'Back', () => go(this, SCENE.Menu)).setDepth(11);

    const zone = this.add.zone(0, VIEW_TOP, 1280, VIEW_H).setOrigin(0, 0);
    this.scroll = new ScrollArea(this, layer, zone, { viewHeight: VIEW_H });
    this.scroll.setContentHeight(y - VIEW_TOP + 20);
    this.scroll.attach();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scroll?.detach();
      this.scroll = null;
      this.tweens.killAll();
    });
  }

  /** Puzzle Book: one card per puzzle kind (locked/unlocked, solved, best time, skip rate). Returns the next y. */
  private buildBook(layer: Phaser.GameObjects.Container, board: Phaser.GameObjects.Graphics, stats: Record<string, PuzzleStat>, top: number): number {
    layer.add(makeText(this, 80, top, 'Puzzle Book', { fontSize: `${SIZE.heading}px`, fontStyle: 'bold', color: CSS.amber }).setOrigin(0, 0));
    const y = top + 60;
    bookEntries(stats).forEach((e, i) => {
      const x = 80 + (i % 2) * 560;
      const cy = y + Math.floor(i / 2) * 112;
      drawPlate(board, x, cy, 540, 100, 14, e.unlocked ? COLOR.plateLight : COLOR.plate, e.unlocked ? COLOR.amber : COLOR.plateEdge);
      layer.add(makeText(this, x + 20, cy + 14, e.unlocked ? e.name : `${e.name} (locked)`, { fontSize: `${SIZE.body}px`, fontStyle: 'bold', color: e.unlocked ? CSS.cream : CSS.muted }).setOrigin(0, 0));
      const detail = !e.unlocked
        ? 'Not unlocked yet'
        : e.solved + e.skipped === 0
          ? 'Not played yet'
          : `Solved ${e.solved}  ·  Best ${e.bestMs === null ? '-' : fmtClock(Math.round(e.bestMs / 1000))}  ·  Skipped ${e.skipPct ?? 0}%`;
      layer.add(makeText(this, x + 20, cy + 54, detail, { fontSize: '26px', color: CSS.muted }).setOrigin(0, 0));
    });
    return y + Math.ceil(PUZZLE_KINDS.length / 2) * 112 + 24;
  }
}
