import Phaser from 'phaser';
import { sfx } from '../audio/sfx';
import { commitProfile, defaultProfile } from '../core/save';
import { SCENE } from '../shared/types';
import type { PlayerProfile } from '../shared/types';
import { Button } from '../ui/Button';
import { Toast } from '../ui/Toast';
import { CSS, SIZE, buzz, enterFade, getProfile, go, makeText } from '../ui/theme';
import { COLUMNS, applyRow, rowActive, rowLabel } from './settingsModel';
import type { Row, Settings } from './settingsModel';

const COL_X = [40, 680] as const;
const ROW_Y0 = 140;
const ROW_STEP = 80;
const CTRL_DX = 470;
const CTRL_W = 220;

/** Pushes every audio setting to the mixer. Shared with the Menu's first-tap unlock. */
export function applyAudioSettings(s: Settings): void {
  sfx.setEnabled(s.sfx, s.music);
  sfx.setVolumes({ music: s.musicVol, sfx: s.sfxVol, ambience: s.ambienceVol });
}

export class SettingsScene extends Phaser.Scene {
  private controls = new Map<Row, Button>();
  private resetBtn!: Button;
  private resetArmed = false;
  private resetTimer: Phaser.Time.TimerEvent | null = null;
  private toast!: Toast;

  constructor() {
    super(SCENE.Settings);
  }

  create(): void {
    enterFade(this);
    this.controls = new Map();
    this.resetArmed = false;
    this.resetTimer = null;
    this.toast = new Toast(this, 600);
    makeText(this, 640, 64, 'Settings', { fontSize: `${SIZE.title}px`, fontStyle: 'bold', color: CSS.amber }).setOrigin(0.5);
    const s = getProfile(this).settings;
    COLUMNS.forEach((rows, c) => {
      rows.forEach((row, i) => {
        const y = ROW_Y0 + i * ROW_STEP;
        const x0 = COL_X[c] as number;
        makeText(this, x0, y, row.label, { fontSize: `${SIZE.label}px` }).setOrigin(0, 0.5);
        const btn = new Button(this, x0 + CTRL_DX, y, CTRL_W, rowLabel(s, row), () => this.change(row), {
          variant: rowActive(s, row) ? 'primary' : 'plain',
        });
        this.controls.set(row, btn);
      });
    });
    this.resetBtn = new Button(this, 640, 636, 420, 'Reset progress', () => this.onReset(), { variant: 'danger' });
    new Button(this, 24 + 80, 664, 160, 'Back', () => go(this, SCENE.Menu));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.resetTimer?.remove(false);
      this.tweens.killAll();
    });
  }

  private refresh(s: Settings): void {
    this.controls.forEach((btn, row) => btn.setLabel(rowLabel(s, row)).setVariant(rowActive(s, row) ? 'primary' : 'plain'));
  }

  private change(row: Row): void {
    const p: PlayerProfile = getProfile(this);
    const settings = applyRow(p.settings, row);
    commitProfile(this.game, { ...p, settings });
    applyAudioSettings(settings);
    if (row.kind === 'toggle' && row.key === 'music') {
      if (settings.music) sfx.startMusic();
      else sfx.stopMusic();
    }
    if (row.kind === 'toggle' && row.key === 'vibration' && settings.vibration) buzz(this, 30);
    this.refresh(settings);
  }

  private onReset(): void {
    if (!this.resetArmed) {
      this.resetArmed = true;
      this.resetBtn.setLabel('Tap again to confirm');
      this.resetTimer = this.time.delayedCall(3000, () => this.disarm());
      return;
    }
    this.resetTimer?.remove(false);
    this.disarm();
    const fresh = defaultProfile();
    commitProfile(this.game, fresh);
    applyAudioSettings(fresh.settings);
    this.refresh(fresh.settings);
    this.toast.show('Progress reset.');
  }

  private disarm(): void {
    this.resetArmed = false;
    this.resetBtn.setLabel('Reset progress');
  }
}
