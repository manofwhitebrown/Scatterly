import { describe, expect, it, vi } from 'vitest';

vi.mock('phaser', () => ({ default: { Scenes: { Events: { SHUTDOWN: 'shutdown' } } } }));
import { homeBack } from '../src/scenes/homeBack';
import type { BackRun } from '../src/scenes/homeBack';

const mkRun = (o: Partial<{ inspect: boolean; board: boolean; paused: boolean; modal: boolean }> = {}): { run: BackRun; log: string[] } => {
  const log: string[] = [];
  const run: BackRun = {
    inspect: { isOpen: !!o.inspect, close: () => log.push('inspect') },
    board: { isOpen: !!o.board, close: () => log.push('board') },
    flow: { paused: !!o.paused, closePause: () => log.push('resume'), openPause: () => log.push('pause') },
    modalOpen: () => !!o.modal,
  };
  return { run, log };
};
const act = (log: string[]): { closeSheet(): void; zoomOut(): void } => ({ closeSheet: () => log.push('sheet'), zoomOut: () => log.push('zoomOut') });

describe('Home Back order', () => {
  it('closes the Play sheet first', () => {
    const log: string[] = [];
    expect(homeBack({ sheetOpen: true, focused: true, run: null }, act(log))).toBe(true);
    expect(log).toEqual(['sheet']);
  });
  it('closes overlays before zooming out', () => {
    const { run, log } = mkRun({ inspect: true });
    homeBack({ sheetOpen: false, focused: true, run }, act(log));
    expect(log).toEqual(['inspect']);
    const b = mkRun({ paused: true, modal: true });
    homeBack({ sheetOpen: false, focused: true, run: b.run }, act(b.log));
    expect(b.log).toEqual(['resume']);
  });
  it('zooms out of Focus, then opens pause in the Overview during a run, else is unhandled', () => {
    const a = mkRun();
    expect(homeBack({ sheetOpen: false, focused: true, run: a.run }, act(a.log))).toBe(true);
    expect(a.log).toEqual(['zoomOut']);
    const b = mkRun();
    expect(homeBack({ sheetOpen: false, focused: false, run: b.run }, act(b.log))).toBe(true);
    expect(b.log).toEqual(['pause']);
    expect(homeBack({ sheetOpen: false, focused: false, run: null }, act([]))).toBe(false);
  });
  it('swallows Back while a card or puzzle is up', () => {
    const { run, log } = mkRun({ modal: true });
    expect(homeBack({ sheetOpen: false, focused: true, run }, act(log))).toBe(true);
    expect(log).toEqual([]);
  });
});
