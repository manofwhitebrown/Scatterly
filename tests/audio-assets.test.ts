import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { AUDIO_LIMIT_BYTES, ALL_SFX, AMBIENCE_LOOPS, DUCKS, MUSIC_TRACKS, ROOM_AMBIENCE, SFX_GROUPS, UI_NAMES, VARIANTS, allFiles, groupOf } from '../src/audio/manifest';

const DIR = 'public/audio';

describe('audio files match the manifest', () => {
  it('every manifest file exists, is Ogg, and nothing else is shipped', () => {
    const want = new Set(allFiles().map((f) => `${f}.ogg`));
    const have = readdirSync(DIR).filter((f) => f.endsWith('.ogg'));
    expect(have.filter((f) => !want.has(f))).toEqual([]);
    for (const f of want) {
      expect(existsSync(`${DIR}/${f}`), f).toBe(true);
      expect(readFileSync(`${DIR}/${f}`).subarray(0, 4).toString('latin1'), f).toBe('OggS');
    }
  });
  it('ships at most 8 MB and at least 40 distinct sfx with 3 variants each', () => {
    const total = readdirSync(DIR).reduce((n, f) => n + statSync(`${DIR}/${f}`).size, 0);
    expect(total).toBeLessThanOrEqual(AUDIO_LIMIT_BYTES);
    expect(ALL_SFX.length).toBeGreaterThanOrEqual(40);
    expect(new Set(ALL_SFX).size).toBe(ALL_SFX.length);
    expect(VARIANTS).toBe(3);
  });
  it('has the music set: 5 tracks + tension layer + sting, and 6 ambience loops', () => {
    expect(MUSIC_TRACKS.length).toBe(5);
    expect(AMBIENCE_LOOPS.length).toBe(6);
    expect(allFiles()).toContain('music_rush_tension');
    expect(allFiles()).toContain('music_result_sting');
  });
  it('every sfx belongs to exactly one group and the group helper agrees', () => {
    const seen = new Set<string>();
    for (const [g, names] of Object.entries(SFX_GROUPS)) for (const n of names) {
      expect(seen.has(n), n).toBe(false);
      seen.add(n);
      expect(groupOf(n)).toBe(g);
    }
  });
  it('rooms use at most two loops, all of which exist; duck and ui names are real sounds', () => {
    for (const loops of Object.values(ROOM_AMBIENCE)) {
      expect(loops.length).toBeLessThanOrEqual(2);
      for (const l of loops) expect(AMBIENCE_LOOPS).toContain(l);
    }
    for (const n of Object.keys(DUCKS)) expect(ALL_SFX, n).toContain(n);
    for (const n of UI_NAMES) expect(ALL_SFX, n).toContain(n);
  });
  it('the render report shows every loop with a seam under 4 and nothing above -1 dBFS', () => {
    const rep = JSON.parse(readFileSync('docs/art/evidence/audio-report.json', 'utf8')) as Array<{ file: string; seam: number; peak_db: number; seconds: number }>;
    for (const r of rep) {
      expect(r.peak_db, r.file).toBeLessThanOrEqual(-1);
      if (r.seconds > 5 && !r.file.includes('sting')) expect(r.seam, r.file).toBeLessThan(4);
    }
  });
});
