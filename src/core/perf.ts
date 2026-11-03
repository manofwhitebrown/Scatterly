import Phaser from 'phaser';
import { SCENE } from '../shared/types';
import type { PlayerProfile } from '../shared/types';
import { commitProfile } from './save';
import { FrameStats } from './frameStats';
import { formatMetrics, readMetrics } from './metrics';
import { installE2e } from './e2e';

const SAMPLE_WINDOW_MS = 4000;
const SAMPLE_EVERY_MS = 250;
const MIN_SAMPLES = 8;
const SLOW_FPS = 45;

const query = new URLSearchParams(window.location.search);
const debugOn = query.get('debug') === '1';
const e2eOn = query.get('e2e') === '1';

function profileOf(game: Phaser.Game): PlayerProfile | undefined {
  return game.registry.get('profile') as PlayerProfile | undefined;
}

/** True if the player chose low effects OR the device was auto-detected as slow. Pure read, no cost. */
export function isLowFx(game: Phaser.Game): boolean {
  return profileOf(game)?.settings.lowFx === true;
}

function logDebug(msg: string): void {
  if (debugOn) console.log(`[scatterly] ${msg}`);
}

/** Auto-detect: average fps over the first 4 s after the first Room scene starts. Runs once per session. */
function sampleFirstRoom(game: Phaser.Game): void {
  if (isLowFx(game)) return; // already low-fx: nothing to detect
  const startedAt = performance.now();
  let sum = 0;
  let count = 0;
  const id = window.setInterval(() => {
    if (!document.hidden) {
      sum += game.loop.actualFps;
      count++;
    }
    if (performance.now() - startedAt < SAMPLE_WINDOW_MS) return;
    window.clearInterval(id);
    if (count < MIN_SAMPLES) return;
    const avg = sum / count;
    logDebug(`avg fps over first room: ${avg.toFixed(1)}`);
    const p = profileOf(game);
    if (avg < SLOW_FPS && p && !p.settings.lowFx) {
      commitProfile(game, { ...p, settings: { ...p.settings, lowFx: true } });
    }
  }, SAMPLE_EVERY_MS);
}

function attachRoomHook(game: Phaser.Game): void {
  // HOOK: the Room scene's own 'start' event (Phaser.Scenes.Events.START). Fires the first time
  // Room starts; later restarts are ignored so the sampler never runs twice.
  const room = game.scene.getScene(SCENE.Room) ?? game.scene.getScene(SCENE.Home);
  if (!room) {
    logDebug('Room scene not found; fps auto-detect disabled');
    return;
  }
  room.events.once(Phaser.Scenes.Events.START, () => sampleFirstRoom(game));
}

function showOverlay(game: Phaser.Game, stats: FrameStats): void {
  const el = document.createElement('div');
  el.style.cssText =
    'position:fixed;top:4px;left:4px;z-index:9;padding:2px 6px;border-radius:4px;background:rgba(0,0,0,.6);' +
    'color:#9f9;font:11px/1.3 monospace;white-space:pre;pointer-events:none';
  document.body.appendChild(el);
  let last = '';
  window.setInterval(() => {
    const text = formatMetrics(readMetrics(game, stats));
    if (text !== last) {
      last = text;
      el.textContent = text;
    }
  }, 500);
}

/** Call once right after `new Phaser.Game`. Costs nothing unless ?debug=1 (overlay) or until Room starts (sampler). */
export function installPerf(game: Phaser.Game): void {
  game.events.once(Phaser.Core.Events.READY, () => {
    attachRoomHook(game);
    if (!debugOn && !e2eOn) return;
    const stats = new FrameStats(game);
    game.scene.getScene(SCENE.Menu)?.events.once(Phaser.Scenes.Events.START, () => stats.reset());
    if (debugOn) showOverlay(game, stats);
    if (e2eOn) installE2e(game, stats);
  });
}
