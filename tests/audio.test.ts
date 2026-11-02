import { describe, expect, it } from 'vitest';
import { VOICE_BUDGET, VoiceBook } from '../src/audio/voices';
import { tempoFactor } from '../src/audio/music';
import { RECIPES, SUCCESS_VARIANTS } from '../src/audio/recipes';
import { sfx } from '../src/audio/sfx';

describe('VoiceBook', () => {
  it('steals the oldest voice when full and prunes finished ones', () => {
    const killed: number[] = [];
    const vb = new VoiceBook(2);
    vb.add(0, 10, () => killed.push(1));
    vb.add(0, 10, () => killed.push(2));
    expect(vb.add(1, 10, () => killed.push(3))).toBe(1);
    expect(killed).toEqual([1]);
    expect(vb.count(1)).toBe(2);
    expect(vb.count(11)).toBe(0);
  });
  it('keeps the total design budget at 12 voices', () => {
    expect(VOICE_BUDGET.music + VOICE_BUDGET.ambience + VOICE_BUDGET.sfx).toBeLessThanOrEqual(12);
  });
});

describe('music + recipes', () => {
  it('adds about 8% tempo at full intensity and clamps', () => {
    expect(tempoFactor(0)).toBe(1);
    expect(tempoFactor(1)).toBeCloseTo(1.08, 5);
    expect(tempoFactor(5)).toBeCloseTo(1.08, 5);
  });
  it('has puzzle sounds and three success variants', () => {
    for (const n of ['tick', 'click', 'error', 'success', 'unlock'] as const) expect(RECIPES[n].blips.length + (RECIPES[n].noise ? 1 : 0)).toBeGreaterThan(0);
    expect(SUCCESS_VARIANTS.length).toBe(3);
  });
});

describe('sfx before the first gesture', () => {
  it('never throws when there is no AudioContext', () => {
    expect(() => {
      sfx.play('tap');
      sfx.play('success', { step: 3 });
      sfx.setIntensity(NaN);
      sfx.setRoomAmbience('kitchen');
      sfx.setEnabled(true, true);
      sfx.stopMusic();
    }).not.toThrow();
  });
});
