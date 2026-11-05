import Phaser from 'phaser';
import { BACKDROP, LAYOUT } from './core/layout';
import { initLayout, installLayout } from './core/screen';
import { BootScene } from './core/BootScene';
import { installPerf } from './core/perf';
import { attachGame, installErrorHandlers, showFatal } from './core/errors';
import { sfx } from './audio/sfx';
import { gameScenes } from './scenes';
import { puzzleScenes } from './puzzles';
import { organiseScenes } from './organise';
import { setBackground } from './core/lifecycle';
import { installNative } from './core/platform';

installErrorHandlers();
initLayout();

const scenes: Phaser.Types.Scenes.SceneType[] = [BootScene, ...gameScenes, ...puzzleScenes, ...organiseScenes];

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: LAYOUT.w,
  height: LAYOUT.h,
  backgroundColor: BACKDROP,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  render: { antialias: false, powerPreference: 'high-performance', pixelArt: true, roundPixels: true },
  fps: { target: 60, smoothStep: true },
  input: { activePointers: 2, touch: { capture: true } },
  disableContextMenu: true,
  audio: { noAudio: true }, // sound is our own WebAudio synthesis (src/audio/sfx.ts)
  scene: scenes,
};

try {
  const game = new Phaser.Game(config);
  attachGame(game);
  installPerf(game);
  installLayout(game);

  // Stop the loop and audio while hidden (no timer drift); Android's appStateChange calls the same function.
  document.addEventListener('visibilitychange', () => setBackground(game, document.hidden));
  installNative(game);

  // Browsers only allow audio after a user gesture.
  window.addEventListener(
    'pointerdown',
    () => {
      try {
        sfx.unlock();
      } catch {
        // Audio is optional.
      }
    },
    { once: true, passive: true },
  );
} catch (err) {
  showFatal(err instanceof Error ? err.message : String(err));
}
