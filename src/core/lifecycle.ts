import type Phaser from 'phaser';
import { resumeCtx, suspendCtx } from '../audio/engine';

let background = false;

/**
 * One place for "the app went to the background / came back": the loop sleeps (wake(true) shifts the clock so no
 * time passes while away) and audio is suspended. Idempotent, so visibilitychange and Android appStateChange can both call it.
 */
export function setBackground(game: Phaser.Game, hidden: boolean): void {
  if (hidden === background) return;
  background = hidden;
  try {
    if (hidden) {
      game.loop.sleep();
      suspendCtx();
    } else {
      game.loop.wake(true);
      resumeCtx();
    }
  } catch {
    // Audio is optional; the loop state above is what matters.
  }
}

export const isBackground = (): boolean => background;
