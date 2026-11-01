import Phaser from 'phaser';
import { sfx } from '../audio/sfx';
import { commitProfile, defaultProfile } from '../core/save';
import { SCENE } from '../shared/types';
import type { PlayerProfile } from '../shared/types';
import { Button } from '../ui/Button';
import { Toast } from '../ui/Toast';
import { CSS, SIZE, buzz, enterFade, getProfile, go, makeText } from '../ui/theme';

type SettingKey = keyof PlayerProfile['settings'];

const ROWS: Array<{ key: SettingKey; label: string }> = [
  { key: 'sfx', label: 'Sound effects' },
  { key: 'music', label: 'Music' },
  { key: 'vibration', label: 'Vibration' },
  { key: 'lowFx', label: 'Low effects (smoother on slow phones)' },
  { key: 'reducedMotion', label: 'Reduced motion' },
];

export class SettingsScene extends Phaser.Scene {
  private toggles = new Map<SettingKey, Button>();
  private resetBtn!: Button;
  private resetArmed = false;
  private resetTimer: Phaser.Time.TimerEvent | null = null;
  private toast!: Toast;

  constructor() {
    super(SCENE.Settings);
  }

  create(): void {
    enterFade(this);
    this.toggles = new Map();
    this.resetArmed = false;
    this.resetTimer = null;
    this.toast = new Toast(this, 600);
    makeText(this, 640, 70, 'Settings', { fontSize: `${SIZE.title}px`, fontStyle: 'bold', color: CSS.amber }).setOrigin(0.5);

    ROWS.forEach((row, i) => {
      const y = 150 + i * 74;
      makeText(this, 160, y, row.label, { fontSize: `${SIZE.label}px` }).setOrigin(0, 0.5);
      const on = getProfile(this).settings[row.key];
      const btn = new Button(this, 1040, y, 200, on ? 'On' : 'Off', () => this.toggle(row.key), {
        variant: on ? 'primary' : 'plain',
      });
      this.toggles.set(row.key, btn);
    });

    this.resetBtn = new Button(this, 640, 560, 420, 'Reset progress', () => this.onReset(), { variant: 'danger' });
    makeText(this, 640, 636, 'Tip: long-press a spot to mark it ✕ ruled out or ? hunch.', {
      fontSize: `${SIZE.body}px`,
      color: CSS.muted,
      align: 'center',
    }).setOrigin(0.5);
    new Button(this, 24 + 80, 664, 160, 'Back', () => go(this, SCENE.Menu));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.resetTimer?.remove(false);
      this.tweens.killAll();
    });
  }

  private toggle(key: SettingKey): void {
    const p = getProfile(this);
    const settings = { ...p.settings, [key]: !p.settings[key] };
    commitProfile(this.game, { ...p, settings });
    sfx.setEnabled(settings.sfx, settings.music);
    if (key === 'music') {
      if (settings.music) sfx.startMusic();
      else sfx.stopMusic();
    }
    if (key === 'vibration' && settings.vibration) buzz(this, 30);
    const btn = this.toggles.get(key);
    const on = settings[key];
    btn?.setLabel(on ? 'On' : 'Off').setVariant(on ? 'primary' : 'plain');
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
    sfx.setEnabled(fresh.settings.sfx, fresh.settings.music);
    this.toggles.forEach((btn, key) => {
      const on = fresh.settings[key];
      btn.setLabel(on ? 'On' : 'Off').setVariant(on ? 'primary' : 'plain');
    });
    this.toast.show('Progress reset.');
  }

  private disarm(): void {
    this.resetArmed = false;
    this.resetBtn.setLabel('Reset progress');
  }
}
