import type Phaser from 'phaser';
import { BACKDROP, FULL_WIDTH_SCENES, LAYOUT, applyLayout } from './layout';

/** Emitted on `game.events` after the logical width changed. Scenes that opt out of the centring listen for it. */
export const LAYOUT_EVENT = 'scatterly-layout';

/** Size of the box the canvas lives in (CSS px): `#game` is already inset by the safe areas. */
export function hostSize(): { w: number; h: number } {
  const el = document.getElementById('game');
  const r = el?.getBoundingClientRect();
  if (r && r.width > 0 && r.height > 0) return { w: r.width, h: r.height };
  return { w: window.innerWidth, h: window.innerHeight };
}

/** Compute LAYOUT from the page before the game is created. */
export function initLayout(): void {
  const s = hostSize();
  applyLayout(s.w, s.h);
}

function centre(scene: Phaser.Scene): void {
  const cam = scene.cameras?.main;
  if (!cam) return;
  const off = FULL_WIDTH_SCENES.has(scene.scene.key) ? 0 : LAYOUT.safeX;
  cam.setScroll(-off, cam.scrollY);
  cam.setBackgroundColor(BACKDROP);
}

/**
 * Keeps the logical width in step with the window, and centres every 1280-wide scene by `safeX`.
 * Full-width scenes (see FULL_WIDTH_SCENES) keep scroll 0 and read LAYOUT.w themselves.
 */
export function installLayout(game: Phaser.Game): void {
  const hooked = new WeakSet<Phaser.Scene>();
  const hook = (): void => {
    for (const sc of game.scene.getScenes(false)) {
      if (hooked.has(sc)) continue;
      hooked.add(sc);
      for (const ev of ['create', 'wake', 'resume']) sc.events.on(ev, () => centre(sc));
    }
  };
  hook();

  let pending = 0;
  const refit = (): void => {
    pending = 0;
    const s = hostSize();
    if (!applyLayout(s.w, s.h)) return;
    game.scale.setGameSize(LAYOUT.w, LAYOUT.h);
    game.scale.refresh();
    for (const sc of game.scene.getScenes(true)) centre(sc);
    game.events.emit(LAYOUT_EVENT, LAYOUT);
  };
  const schedule = (): void => {
    if (pending) window.clearTimeout(pending);
    pending = window.setTimeout(refit, 60); // orientationchange reports the new size a moment late
  };
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('orientationchange', schedule, { passive: true });
}
