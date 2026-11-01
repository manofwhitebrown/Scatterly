import { describe, expect, it } from 'vitest';
import { decideErrorAction } from '../src/core/errors';

describe('error policy', () => {
  it('is fatal before boot finishes', () => {
    expect(decideErrorAction('boom', false, [], 1000)).toBe('fatal');
  });
  it('returns to menu after boot', () => {
    expect(decideErrorAction('boom', true, [], 1000)).toBe('menu');
  });
  it('ignores ResizeObserver noise', () => {
    expect(decideErrorAction('ResizeObserver loop limit exceeded', true, [], 1)).toBe('ignore');
  });
  it('escalates to fatal when errors loop', () => {
    expect(decideErrorAction('boom', true, [100, 200, 300], 400)).toBe('fatal');
    expect(decideErrorAction('boom', true, [100, 200, 300], 9000)).toBe('menu');
  });
});
