import type Phaser from 'phaser';

/** Scene event fired when the player presses Back (Android button/gesture, or the e2e hook). */
export const BACK_EVENT = 'scatterly:back';

/** A scene that consumed Back sets `handled = true`; the first one to do so stops the offer. */
export interface BackCtx { handled: boolean }

interface Emitter { emit(event: string, ctx: BackCtx): unknown }

/** Offers Back to the given emitters in order (top-most scene first). Pure, so it is unit-tested without Phaser. */
export function routeBack(topFirst: readonly Emitter[]): 'handled' | 'unhandled' {
  const ctx: BackCtx = { handled: false };
  for (const e of topFirst) {
    e.emit(BACK_EVENT, ctx);
    if (ctx.handled) return 'handled';
  }
  return 'unhandled';
}

/** Offers Back to every running scene, the one drawn on top first. */
export function gameBack(game: Phaser.Game): 'handled' | 'unhandled' {
  return routeBack(game.scene.getScenes(true).map((s) => s.events).reverse());
}

/** "Press Back again to exit": the first unhandled press only warns, a second within `windowMs` exits. */
export class ExitGuard {
  private last = -Infinity;
  constructor(private readonly windowMs = 2000) {}
  press(now: number): 'warn' | 'exit' {
    const exit = now - this.last <= this.windowMs;
    this.last = exit ? -Infinity : now;
    return exit ? 'exit' : 'warn';
  }
}
