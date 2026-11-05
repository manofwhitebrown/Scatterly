import { prefetchGroups } from './assets';
import { firstScene, flags } from './flags';
import Phaser from 'phaser';
import { SCENE } from '../shared/types';
import { BACKDROP, LAYOUT } from './layout';
import { generateAllTextures } from '../art';
import { sfx } from '../audio/sfx';
import { loadProfile } from './save';
import { markBooted } from './errors';

const FONT = 'system-ui, "Segoe UI", Roboto, sans-serif';
const BAR_W = 520;
const BAR_H = 18;
const BAR_Y = LAYOUT.h / 2 + 8;
const LOADING_TEXT = 'Tidying up the house…';

export class BootScene extends Phaser.Scene {
  private bar!: Phaser.GameObjects.Graphics;
  private status!: Phaser.GameObjects.Text;
  private retry!: Phaser.GameObjects.Text;
  private lastStep = -1;
  private running = false;

  constructor() {
    super(SCENE.Boot);
  }

  create(): void {
    document.getElementById('splash')?.remove();
    this.cameras.main.setBackgroundColor(BACKDROP);
    this.add
      .text(LAYOUT.w / 2, LAYOUT.h / 2 - 90, 'Scatterly', { fontFamily: FONT, fontSize: '68px', fontStyle: 'bold', color: '#f6e7cf' })
      .setOrigin(0.5);
    this.bar = this.add.graphics();
    this.status = this.add
      .text(LAYOUT.w / 2, BAR_Y + 62, LOADING_TEXT, { fontFamily: FONT, fontSize: '24px', color: '#cdb8a0', align: 'center', wordWrap: { width: 900 } })
      .setOrigin(0.5);
    this.retry = this.add
      .text(LAYOUT.w / 2, BAR_Y + 150, 'Retry', { fontFamily: FONT, fontSize: '30px', fontStyle: 'bold', color: '#2b2230', backgroundColor: '#e0955a', padding: { x: 36, y: 16 } })
      .setOrigin(0.5)
      .setVisible(false)
      .setInteractive({ useHandCursor: true });
    this.retry.on('pointerup', () => {
      void this.run();
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.retry.off('pointerup');
    });
    void this.run();
  }

  private drawBar(p: number): void {
    const barX = (LAYOUT.w - BAR_W) / 2;
    const step = Math.round(Phaser.Math.Clamp(p, 0, 1) * 100);
    if (step === this.lastStep) return;
    this.lastStep = step;
    this.bar.clear();
    this.bar.fillStyle(0x4a3d52, 1).fillRoundedRect(barX, BAR_Y, BAR_W, BAR_H, BAR_H / 2);
    const w = (BAR_W * step) / 100;
    if (w >= 2) this.bar.fillStyle(0xe0955a, 1).fillRoundedRect(barX, BAR_Y, w, BAR_H, Math.min(BAR_H / 2, w / 2));
  }

  private async run(): Promise<void> {
    if (this.running) return;
    this.running = true;
    this.retry.setVisible(false);
    this.status.setText(LOADING_TEXT).setColor('#cdb8a0');
    this.lastStep = -1;
    this.drawBar(0);
    try {
      await generateAllTextures(this, (p) => this.drawBar(p));
      const profile = loadProfile();
      this.registry.set('profile', profile);
      try {
        sfx.setEnabled(profile.settings.sfx, profile.settings.music);
        if (profile.settings.music) sfx.startMusic();
      } catch {
        // Audio is optional: a failure here must never block the game.
      }
      this.running = false;
      markBooted();
      prefetchGroups(this, ['core']); // background: the menu never waits for atlases
      this.scene.start(firstScene(flags()) === 'Home' ? SCENE.Home : SCENE.Menu);
    } catch (err) {
      this.running = false;
      this.showError(err);
    }
  }

  private showError(err: unknown): void {
    if (!this.status.active) return;
    const detail = err instanceof Error ? err.message : String(err);
    this.status.setText(`Something went wrong while loading.\n${detail.slice(0, 140)}`).setColor('#ff9c8a');
    this.retry.setVisible(true);
  }
}
