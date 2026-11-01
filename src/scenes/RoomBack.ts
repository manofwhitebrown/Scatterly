import Phaser from 'phaser';

/** Routes ESC and the browser/Android back gesture (popstate) to one callback instead of leaving the game. */
export class RoomBack {
  private active = false;

  constructor(private readonly scene: Phaser.Scene, private readonly onBack: () => void) {
    scene.input.keyboard?.on('keydown-ESC', this.onKey, this);
    try {
      history.pushState(null, '');
      window.addEventListener('popstate', this.onPop);
      this.active = true;
    } catch {
      // History API unavailable: the on-screen pause button still works.
    }
  }

  destroy(): void {
    this.scene.input.keyboard?.off('keydown-ESC', this.onKey, this);
    if (this.active) window.removeEventListener('popstate', this.onPop);
    this.active = false;
  }

  private readonly onKey = (): void => this.onBack();

  private readonly onPop = (): void => {
    try {
      history.pushState(null, '');
    } catch {
      // ignore
    }
    this.onBack();
  };
}
