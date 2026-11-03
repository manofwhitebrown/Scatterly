import Phaser from 'phaser';
import { sfx } from '../audio/sfx';
import { commitProfile } from '../core/save';
import { SCENE } from '../shared/types';
import { Button } from '../ui/Button';
import { Toast } from '../ui/Toast';
import { COLOR, CSS, SIZE, enterFade, fmtClock, getProfile, go, isCalm, makeText } from '../ui/theme';
import { AMBIENCES, SLEEP_STEPS, breath, focusState, isAmbience, sleepLabel, wholeMinutes } from './chillModel';
import { nextInRing } from './settingsModel';

/** Chill: no score, no fail state. Ambience, paced breathing, focus 25/5, sleep timer. */
export class ChillScene extends Phaser.Scene {
  private amb: string | null = null;
  private ambBtns = new Map<string, Button>();
  private circle!: Phaser.GameObjects.Arc;
  private breathText!: Phaser.GameObjects.Text;
  private focusBtn!: Button;
  private focusText!: Phaser.GameObjects.Text;
  private sleepBtn!: Button;
  private toast!: Toast;
  private focusStart: number | null = null;
  private lastPhase = '';
  private sleepMin = 0;
  private sleepEnd: number | null = null;
  private born = 0;
  private lastCircle = -1;

  constructor() {
    super(SCENE.Chill);
  }

  create(): void {
    enterFade(this);
    this.ambBtns = new Map();
    this.focusStart = null;
    this.lastPhase = '';
    this.sleepMin = 0;
    this.sleepEnd = null;
    this.lastCircle = -1;
    this.born = this.time.now;
    this.toast = new Toast(this, 600);
    const saved = getProfile(this).settings.ambience;
    this.amb = isAmbience(saved) ? saved : null;
    makeText(this, 640, 56, 'Chill', { fontSize: `${SIZE.title}px`, fontStyle: 'bold', color: CSS.amber }).setOrigin(0.5);
    makeText(this, 640, 112, 'No score. No timer that matters.', { fontSize: '24px', color: CSS.muted }).setOrigin(0.5);

    AMBIENCES.forEach((a, i) => {
      const b = new Button(this, 190 + i * 300, 190, 260, a.label, () => this.pick(a.id), { variant: this.amb === a.id ? 'primary' : 'plain', height: 96 });
      this.ambBtns.set(a.id, b);
    });

    this.circle = this.add.circle(640, 390, 110, COLOR.amber, 0.35).setStrokeStyle(4, COLOR.amber);
    this.breathText = makeText(this, 640, 390, '', { fontSize: `${SIZE.label}px`, color: CSS.cream }).setOrigin(0.5);

    this.focusText = makeText(this, 150, 560, 'Focus 25 / Break 5', { fontSize: `${SIZE.label}px` }).setOrigin(0, 0.5);
    this.focusBtn = new Button(this, 540, 560, 260, 'Start', () => this.toggleFocus(), { variant: 'primary', height: 96 });
    makeText(this, 760, 560, 'Sleep timer', { fontSize: `${SIZE.label}px` }).setOrigin(0, 0.5);
    this.sleepBtn = new Button(this, 1130, 560, 200, sleepLabel(0), () => this.cycleSleep(), { height: 96 });
    new Button(this, 24 + 80, 664, 160, 'Back', () => go(this, SCENE.Menu));

    this.apply();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.leave());
  }

  update(time: number): void {
    const calm = isCalm(this);
    const b = breath(time - this.born);
    const text = calm ? 'Breathe slowly' : b.label;
    if (this.breathText.text !== text) this.breathText.setText(text);
    const scale = calm ? 0.75 : 0.5 + 0.5 * b.k;
    const step = Math.round(scale * 50);
    if (step !== this.lastCircle) {
      this.lastCircle = step;
      this.circle.setScale(scale);
    }
    if (this.focusStart !== null) this.tickFocus(time);
    if (this.sleepEnd !== null && time >= this.sleepEnd) this.fallAsleep();
  }

  private pick(id: string): void {
    this.amb = this.amb === id ? null : id;
    const p = getProfile(this);
    commitProfile(this.game, { ...p, settings: { ...p.settings, ambience: this.amb ?? '' } });
    this.apply();
  }

  private apply(): void {
    sfx.setRoomAmbience(this.amb);
    this.ambBtns.forEach((b, id) => b.setVariant(this.amb === id ? 'primary' : 'plain'));
  }

  private toggleFocus(): void {
    if (this.focusStart === null) {
      this.focusStart = this.time.now;
      this.lastPhase = 'focus';
      this.focusBtn.setLabel('Stop').setVariant('plain');
      this.tickFocus(this.time.now);
    } else {
      this.focusStart = null;
      this.focusBtn.setLabel('Start').setVariant('primary');
      this.focusText.setText('Focus 25 / Break 5');
    }
  }

  private tickFocus(now: number): void {
    const s = focusState((now - (this.focusStart ?? now)) / 1000);
    const line = `${s.phase === 'focus' ? 'Focus' : 'Break'} ${fmtClock(Math.ceil(s.remainingSec))}`;
    if (this.focusText.text !== line) this.focusText.setText(line);
    if (s.phase !== this.lastPhase) {
      this.lastPhase = s.phase;
      sfx.play('bell');
      this.toast.show(s.phase === 'break' ? 'Nice work. Take a short break.' : 'Break over. Ready when you are.');
    }
  }

  private cycleSleep(): void {
    this.sleepMin = nextInRing(SLEEP_STEPS, this.sleepMin as (typeof SLEEP_STEPS)[number]);
    this.sleepEnd = this.sleepMin === 0 ? null : this.time.now + this.sleepMin * 60000;
    this.sleepBtn.setLabel(sleepLabel(this.sleepMin));
  }

  private fallAsleep(): void {
    this.sleepEnd = null;
    this.sleepMin = 0;
    this.sleepBtn.setLabel(sleepLabel(0));
    sfx.stopMusic();
    sfx.setRoomAmbience(null);
    this.toast.show('Sweet dreams.');
  }

  /** Quiet exit: the ambience stops and the minutes spent are added to the profile (whole minutes only). */
  private leave(): void {
    sfx.setRoomAmbience(null);
    const mins = wholeMinutes(this.time.now - this.born);
    if (mins < 1) return;
    const p = getProfile(this);
    commitProfile(this.game, { ...p, chill: { minutes: p.chill.minutes + mins, sessions: p.chill.sessions + 1 } });
  }
}
