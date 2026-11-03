import Phaser from 'phaser';
import { dailySeed, generateScenario } from '../logic';
import { SCENE } from '../shared/types';
import type { GameMode, RoomSceneData } from '../shared/types';
import { Button } from '../ui/Button';
import { COLOR, CSS, SIZE, drawPlate, enterFade, getProfile, go, localDateKey, makeText, starText } from '../ui/theme';
import { runScene } from './runScene';

interface CardDef {
  mode: GameMode;
  title: string;
  desc: string;
  note: string;
}

const CARD_W = 360;
const CARD_H = 420;
const CARD_Y = 120;

export class ModeSelectScene extends Phaser.Scene {
  constructor() {
    super(SCENE.ModeSelect);
  }

  create(): void {
    enterFade(this);
    const profile = getProfile(this);
    const today = localDateKey();
    const dailyDone = profile.lastDailyDate === today;

    let dailyBest = '';
    try {
      const id = generateScenario(dailySeed(), 'daily', profile).id;
      const stars = profile.bestStars[id];
      if (stars !== undefined) dailyBest = `Best today: ${starText(stars)}`;
    } catch {
      dailyBest = '';
    }

    makeText(this, 640, 56, 'Choose your morning', { fontSize: `${SIZE.heading}px`, fontStyle: 'bold', color: CSS.amber }).setOrigin(0.5);

    const defs: CardDef[] = [
      { mode: 'rush', title: 'Morning Rush', desc: 'Beat the clock. Find everything before work starts.', note: 'Countdown timer on' },
      { mode: 'relaxed', title: 'Relaxed Morning', desc: 'No timer. Explore and solve at your own pace.', note: 'A fresh puzzle every time' },
      {
        mode: 'daily',
        title: 'Daily Mystery',
        desc: "Today's designed scenario with its own clues.",
        note: dailyDone ? 'Done ✓  Replay earns no coins' : dailyBest || 'Same puzzle for everyone today',
      },
    ];
    defs.forEach((def, i) => this.buildCard(def, 60 + i * (CARD_W + 40)));

    new Button(this, 24 + 80, 664, 160, 'Back', () => go(this, SCENE.Menu));
  }

  private buildCard(def: CardDef, x: number): void {
    const plate = this.add.graphics();
    plate.fillStyle(0x000000, 0.28);
    plate.fillRoundedRect(x + 4, CARD_Y + 8, CARD_W, CARD_H, 24);
    drawPlate(plate, x, CARD_Y, CARD_W, CARD_H, 24, COLOR.plate, COLOR.plateLight);
    const cx = x + CARD_W / 2;
    makeText(this, cx, CARD_Y + 52, def.title, { fontSize: '34px', fontStyle: 'bold', align: 'center', wordWrap: { width: CARD_W - 40 } }).setOrigin(0.5);
    makeText(this, cx, CARD_Y + 104, def.desc, { align: 'center', wordWrap: { width: CARD_W - 56 } }).setOrigin(0.5, 0);
    makeText(this, cx, CARD_Y + 262, def.note, { align: 'center', color: CSS.amber, wordWrap: { width: CARD_W - 56 } }).setOrigin(0.5, 0);
    new Button(this, cx, CARD_Y + CARD_H - 56, CARD_W - 60, 'Start', () => this.start(def.mode), { variant: 'primary' });
  }

  private start(mode: GameMode): void {
    const seed = mode === 'daily' ? dailySeed() : Math.floor(Math.random() * 2147483647);
    const data: RoomSceneData = { mode, seed };
    go(this, runScene(), data);
  }
}
