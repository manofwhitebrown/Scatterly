import Phaser from 'phaser';
import { GAME_H, GAME_W } from './shared/types';
import { BootScene } from './core/BootScene';
import { installPerf } from './core/perf';
import { sfx } from './audio/sfx';
import { gameScenes } from './scenes';
import { puzzleScenes } from './puzzles';
import { organiseScenes } from './organise';

let fatalShown = false;

/** Plain-HTML fallback (shown at most once) so a crash never leaves a blank screen. */
function showFatal(message: string): void {
  if (fatalShown) return;
  fatalShown = true;
  document.getElementById('splash')?.remove();
  const box = document.createElement('div');
  box.setAttribute('role', 'alert');
  box.style.cssText =
    'position:fixed;inset:0;z-index:20;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;' +
    'padding:24px;box-sizing:border-box;background:#2b2230;color:#f6e7cf;text-align:center;font:18px system-ui,"Segoe UI",Roboto,sans-serif';
  const title = document.createElement('h2');
  title.textContent = 'Scatterly hit a snag';
  title.style.margin = '0';
  const text = document.createElement('p');
  text.textContent = message.slice(0, 200);
  text.style.cssText = 'margin:0;max-width:640px;opacity:.8';
  const btn = document.createElement('button');
  btn.textContent = 'Reload';
  btn.style.cssText = 'min-height:56px;padding:0 36px;border:0;border-radius:14px;background:#e0955a;color:#2b2230;font:700 20px inherit;cursor:pointer';
  btn.onclick = () => window.location.reload();
  box.append(title, text, btn);
  document.body.appendChild(box);
}

window.onerror = (message, _src, _line, _col, error): void => {
  const text = error?.message ?? String(message);
  if (text.includes('ResizeObserver')) return; // benign browser notice
  showFatal(text);
};

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
