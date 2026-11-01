import Phaser from 'phaser';
import { sfx } from '../audio/sfx';
import { isLowFx } from '../core/perf';
import { SCENE, tex } from '../shared/types';
import { Button } from '../ui/Button';
import { Toast } from '../ui/Toast';
import { CSS, SIZE, enterFade, getProfile, go, makeText } from '../ui/theme';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super(SCENE.Menu);
  }

  create(): void {
    enterFade(this);
    const profile = getProfile(this);
    const toast = new Toast(this, 640);

    makeText(this, 640, 128, 'Scatterly', { fontSize: `${SIZE.title}px`, fontStyle: 'bold', color: CSS.amber }).setOrigin(0.5);
    makeText(this, 640, 204, 'Every morning, your house gives you a new puzzle.', {
      fontSize: `${SIZE.label}px`,
      align: 'center',
      wordWrap: { width: 900 },
    }).setOrigin(0.5);
    makeText(this, 640, 262, `Day ${profile.day}   ·   Coins ${profile.coins}   ·   Streak ${profile.streak}`, {
      color: CSS.muted,
    }).setOrigin(0.5);

    const open = (key: string): void => {
      if (!go(this, key)) toast.show('That screen is not available yet.', 'warn');
    };
    new Button(this, 640, 330, 380, 'Play', () => open(SCENE.ModeSelect), { variant: 'primary' });
    new Button(this, 640, 410, 380, 'Organise', () => open(SCENE.Organise));
    new Button(this, 640, 490, 380, 'Journal', () => open(SCENE.Journal));
    new Button(this, 640, 570, 380, 'Settings', () => open(SCENE.Settings));

    const key = this.add.image(1020, 420, tex.item('keys')).setDisplaySize(170, 170);
    if (!isLowFx(this.game)) {
      this.tweens.add({ targets: key, y: 400, angle: 6, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    this.input.once('pointerdown', () => {
      sfx.unlock();
      const s = getProfile(this).settings;
      sfx.setEnabled(s.sfx, s.music);
      sfx.startMusic();
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.tweens.killAll();
    });
  }
}
