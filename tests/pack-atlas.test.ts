import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { groupOf, packDir } from '../scripts/pack-atlas.mjs';

const sha = (dir: string, f: string): string => createHash('sha256').update(readFileSync(join(dir, f))).digest('hex');

describe('pack-atlas', () => {
  it('maps folder names to loader groups', () => {
    expect(groupOf('core')).toBe('core');
    expect(groupOf('room-living')).toBe('room:living');
    expect(groupOf('puzzle-lights')).toBe('puzzle:lights');
  });

  it('is deterministic and stays within 2048x2048', () => {
    const d1 = mkdtempSync(join(tmpdir(), 'atlas-a-'));
    const d2 = mkdtempSync(join(tmpdir(), 'atlas-b-'));
    const a = packDir('house', d1);
    const b = packDir('house', d2);
    expect(b).toEqual(a);
    expect(sha(d2, 'house.png')).toBe(sha(d1, 'house.png'));
    expect(sha(d2, 'house.json')).toBe(sha(d1, 'house.json'));
    expect(a.w).toBeLessThanOrEqual(2048);
    expect(a.h).toBeLessThanOrEqual(2048);
  });
});
