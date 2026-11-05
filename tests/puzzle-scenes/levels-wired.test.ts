import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * Scenes import Phaser, which cannot load in node, so this guard reads the source: the three scenes that used to build
 * their own puzzle must call the shared generator with the effective level (1-5), never `req.difficulty` (1-3 only).
 */
const scene = (name: string): string => readFileSync(`src/puzzles/${name}Scene.ts`, 'utf8');

describe('puzzle scenes play the shared generators at the request level', () => {
  for (const kind of ['sort', 'word', 'untangle'] as const) {
    const name = kind[0].toUpperCase() + kind.slice(1);
    it(`${name}Scene calls PUZZLES.${kind}.generate with this.level`, () => {
      const src = scene(name);
      expect(src).toMatch(new RegExp(`PUZZLES\\.${kind}\\.generate\\(this\\.req\\.seed, this\\.level`));
      expect(src).not.toMatch(/this\.req\.difficulty/);
    });
  }
});

describe('scenes expose the hint ladder and the test-bot solve', () => {
  for (const name of ['Sort', 'Word', 'Untangle']) {
    it(`${name}Scene has hintLine and e2eSolve`, () => {
      const src = scene(name);
      expect(src).toMatch(/protected hintLine\(\)/);
      expect(src).toMatch(/protected e2eSolve\(\)/);
      expect(src).toMatch(/\.hint\(this\.spec, \.\.\.this\.hintArgs\(\)\)/);
    });
  }
});
