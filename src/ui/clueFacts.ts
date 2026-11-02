import type { Clue } from '../shared/types';

export interface FactChip { key: string; text: string }

const MAX_CHIPS = 2;
const MAX_CHARS = 16;

/** `label: value`, with the label shortened so the chip stays readable at 26 px in half a card. */
function chipText(label: string, value: number): string {
  const room = Math.max(3, MAX_CHARS - String(value).length - 2);
  const l = label.length > room ? `${label.slice(0, room - 1)}…` : label;
  return `${l}: ${value}`;
}

/** Key of one pinned fact: clue id + fact key. */
export function pinKey(clueId: string, factKey: string): string {
  return `${clueId}:${factKey}`;
}

/** The numeric facts of a clue as tappable chips (at most 2). Empty for clues with no facts. */
export function factChips(clue: Clue): FactChip[] {
  return (clue.facts ?? []).slice(0, MAX_CHIPS).map((f) => ({ key: f.key, text: chipText(f.label, f.value) }));
}

/**
 * Notes for a puzzle's drawer: every discovered clue, with clues the player pinned a fact of moved to the
 * end (the drawer shows the most recent notes), otherwise in discovery order. Never reveals anything new.
 */
export function orderNotes(clues: readonly Clue[], pinned: ReadonlySet<string>): Clue[] {
  const isPinned = (c: Clue): boolean => (c.facts ?? []).some((f) => pinned.has(pinKey(c.id, f.key)));
  return [...clues.filter((c) => !isPinned(c)), ...clues.filter(isPinned)];
}
