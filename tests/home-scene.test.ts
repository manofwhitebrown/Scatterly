import { describe, expect, it } from 'vitest';
import { SCENE } from '../src/shared/types';

describe('home scene key', () => {
  it('has its own key distinct from Room and registered by name', () => {
    expect(SCENE.Home).toBe('Home');
    expect(SCENE.Home).not.toBe(SCENE.Room);
  });
});
