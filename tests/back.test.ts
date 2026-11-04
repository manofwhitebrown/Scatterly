import { describe, expect, it } from 'vitest';
import { BACK_EVENT, ExitGuard, routeBack } from '../src/core/back';
import type { BackCtx } from '../src/core/back';

const scene = (name: string, log: string[], consume: boolean) => ({
  emit(ev: string, ctx: BackCtx): boolean {
    expect(ev).toBe(BACK_EVENT);
    log.push(name);
    if (consume) ctx.handled = true;
    return true;
  },
});

describe('routeBack', () => {
  it('stops at the first scene that consumes Back (top-most first)', () => {
    const log: string[] = [];
    expect(routeBack([scene('puzzle', log, true), scene('home', log, true)])).toBe('handled');
    expect(log).toEqual(['puzzle']);
  });
  it('offers Back down the stack until someone handles it', () => {
    const log: string[] = [];
    expect(routeBack([scene('overlay', log, false), scene('home', log, true)])).toBe('handled');
    expect(log).toEqual(['overlay', 'home']);
  });
  it('reports unhandled when nobody consumes it', () => {
    expect(routeBack([scene('home', [], false)])).toBe('unhandled');
    expect(routeBack([])).toBe('unhandled');
  });
});

describe('ExitGuard', () => {
  it('warns first, exits on a second press inside the window, and re-arms afterwards', () => {
    const g = new ExitGuard(2000);
    expect(g.press(10_000)).toBe('warn');
    expect(g.press(11_500)).toBe('exit');
    expect(g.press(12_000)).toBe('warn');
    expect(g.press(15_000)).toBe('warn');
  });
});
