import { describe, expect, it } from 'vitest';
import type { Clue } from '../src/shared/types';
import { factChips, orderNotes, pinKey } from '../src/ui/clueFacts';

function clue(id: string, facts?: Array<[string, string, number]>): Clue {
  return {
    id, spotId: 's' as Clue['spotId'], title: id, text: 'text', icon: 'note', links: [],
    ...(facts ? { facts: facts.map(([key, label, value]) => ({ key, label, value })) } : {}),
  };
}

describe('notebook facts', () => {
  it('turns facts into at most two short chips and nothing for plain clues', () => {
    expect(factChips(clue('a'))).toEqual([]);
    const chips = factChips(clue('b', [['k1', 'Shoes', 4], ['k2', 'Mugs', 7], ['k3', 'Extra', 9]]));
    expect(chips.map((c) => c.text)).toEqual(['Shoes: 4', 'Mugs: 7']);
    const long = factChips(clue('c', [['k', 'Pairs of winter boots', 12]]))[0];
    expect((long?.text ?? '').length).toBeLessThanOrEqual(16);
    expect(long?.text.endsWith(': 12')).toBe(true);
  });

  it('puts clues with a pinned fact last, keeps order otherwise, and adds nothing new', () => {
    const a = clue('a', [['x', 'A', 1]]);
    const b = clue('b');
    const c = clue('c', [['y', 'C', 3]]);
    const input = [a, b, c];
    const out = orderNotes(input, new Set([pinKey('a', 'x')]));
    expect(out.map((n) => n.id)).toEqual(['b', 'c', 'a']);
    expect(input.map((n) => n.id)).toEqual(['a', 'b', 'c']); // input untouched
    expect(orderNotes(input, new Set()).map((n) => n.id)).toEqual(['a', 'b', 'c']);
    expect(new Set(out)).toEqual(new Set(input));
  });
});
