import Phaser from 'phaser';
import { BACK_EVENT } from '../core/back';
import type { BackCtx } from '../core/back';

/** The overlays of a run that Back can close, top-most first: inspect panel, clue board, pause card. */
export interface BackRun {
  inspect: { isOpen: boolean; close(): void };
  board: { isOpen: boolean; close(): void };
  flow: { paused: boolean; closePause(): void; openPause(): void };
  modalOpen(): boolean;
}

/** Closes the top-most open overlay; true if one was closed. */
export function closeTopModal(run: BackRun): boolean {
  if (run.inspect.isOpen) { run.inspect.close(); return true; }
  if (run.board.isOpen) { run.board.close(); return true; }
  if (run.flow.paused) { run.flow.closePause(); return true; }
  return false;
}

export interface HomeBackState { sheetOpen: boolean; focused: boolean; run: BackRun | null }

/** Home's Back order: Play sheet, then an open overlay, then Focus to Overview, then pause during a run; else unhandled. */
export function homeBack(st: HomeBackState, act: { closeSheet(): void; zoomOut(): void }): boolean {
  if (st.sheetOpen) { act.closeSheet(); return true; }
  if (st.run && closeTopModal(st.run)) return true;
  if (st.run?.modalOpen()) return true; // a card, intro or puzzle is up: swallow Back so the app does not exit mid-morning
  if (st.focused) { act.zoomOut(); return true; }
  if (st.run) { st.run.flow.openPause(); return true; }
  return false;
}

/** Listens for Back on a scene for its whole life; `fn` returns true when it consumed the press. */
export function listenBack(scene: Phaser.Scene, fn: () => boolean): void {
  const h = (ctx: BackCtx): void => { if (!ctx.handled && fn()) ctx.handled = true; };
  scene.events.on(BACK_EVENT, h);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.events.off(BACK_EVENT, h));
}
