import { describe, expect, it } from 'vitest';
import { SCENE } from '../src/shared/types';

describe('home scene key', () => {
  it('has its own key distinct from Room and registered by name', () => {
    expect(SCENE.Home).toBe('Home');
    expect(SCENE.Home).not.toBe(SCENE.Room);
  });
});

describe('home scene module', () => {
  it('shell drawing covers every world room with a size', async () => {
    const { HOUSE_WORLD, ROOM_SIZE } = await import('../src/scenes/homeWorld');
    for (const s of HOUSE_WORLD) expect(ROOM_SIZE[s.room]).toBeDefined();
  });
});
