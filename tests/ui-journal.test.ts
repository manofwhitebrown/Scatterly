import { describe, expect, it } from 'vitest';
import { ITEM_LABEL, PUZZLE_KINDS } from '../src/shared/types';
import type { ItemId } from '../src/shared/types';
import { PUZZLE_NAME, bookEntries } from '../src/scenes/puzzleBook';
import { habitLine, revealStepMs } from '../src/scenes/resultStory';

describe('Puzzle Book', () => {
  it('has a named card for every puzzle kind', () => {
    const entries = bookEntries({}, []);
    expect(entries.map((e) => e.kind)).toEqual([...PUZZLE_KINDS]);
    for (const k of PUZZLE_KINDS) expect(PUZZLE_NAME[k].length).toBeGreaterThan(2);
  });

  it('locks kinds that are neither enabled nor played, unlocks played ones', () => {
    const e = bookEntries({ sudoku: { solved: 1, skipped: 0, bestMs: 61000 } }, ['sort']);
    const by = (k: string) => e.find((x) => x.kind === k);
    expect(by('sort')?.unlocked).toBe(true);
    expect(by('sudoku')?.unlocked).toBe(true);
    expect(by('pipes')?.unlocked).toBe(false);
    expect(by('pipes')?.skipPct).toBeNull();
  });

  it('computes solved count, best time and skip rate', () => {
    const e = bookEntries({ word: { solved: 3, skipped: 1, bestMs: 42000 } }, ['word']).find((x) => x.kind === 'word');
    expect(e).toMatchObject({ solved: 3, skipped: 1, bestMs: 42000, skipPct: 25 });
  });
});

describe('Result story', () => {
  it('writes one habit line or nothing', () => {
    expect(habitLine([])).toBeNull();
    const ids = Object.keys(ITEM_LABEL) as ItemId[];
    const first = ids[0] as ItemId;
    expect(habitLine([first])).toBe(`Habit hit: ${ITEM_LABEL[first].toLowerCase()} in the usual spot`);
    expect(habitLine(ids.slice(0, 4))).toMatch(/\+1 in the usual spot$/);
  });

  it('reveals the evening in about 3 s, between 120 and 380 ms per line', () => {
    expect(revealStepMs(0)).toBe(0);
    expect(revealStepMs(4)).toBe(380);
    expect(revealStepMs(10)).toBe(300);
    expect(revealStepMs(100)).toBe(120);
  });
});

describe('Achievement book', () => {
  it('lists every achievement with names and flags earned ones', async () => {
    const { achievementRows, achievementCount } = await import('../src/scenes/achievementBook');
    const rows = achievementRows(['first-morning', 'not-a-real-id']);
    expect(rows.length).toBeGreaterThanOrEqual(15);
    expect(rows.find((r) => r.id === 'first-morning')).toMatchObject({ name: 'First Morning', earned: true });
    expect(rows.filter((r) => r.earned)).toHaveLength(1);
    expect(achievementCount(['first-morning'])).toEqual({ earned: 1, total: rows.length });
  });
});
