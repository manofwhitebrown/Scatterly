import Phaser from 'phaser';
import { GAME_H, GAME_W } from './shared/types';
import { BootScene } from './core/BootScene';
import { installPerf } from './core/perf';
import { attachGame, installErrorHandlers, showFatal } from './core/errors';
import { sfx } from './audio/sfx';
import { gameScenes } from './scenes';
import { puzzleScenes } from './puzzles';
import { organiseScenes } from './organise';

installErrorHandlers();

const scenes: Phaser.Types.Scenes.SceneType[] = [BootScene, ...gameScenes, ...puzzleScenes, ...organiseScenes];

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_W,
  height: GAME_H,
  backgroundColor: '#2b2230',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  render: { antialias: true, powerPreference: 'high-performance', pixelArt: false, roundPixels: true },
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

  // Stop the loop while hidden; wake(true) shifts the clock so no time passes while away (no timer drift).
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) game.loop.sleep();
    else game.loop.wake(true);
  });

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
