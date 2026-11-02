import { anySpot } from '../content/decor';
import type { ClueDef } from '../content/templateKit';
import type { Template } from '../content/templateKit';
import { expand, whereText } from './evening';
import type { SlotMap } from './evening';
import { FACT_KINDS } from '../content/facts';
import type { Rng } from './rng';
import type { Clue, ClueFact, ClueLink, ItemId, SpotId } from '../shared/types';

const HABIT_TEXT: Record<ItemId, string> = {
  keys: 'Sticky note in your hand: "Keys go {w}. Always."',
  wallet: 'Sticky note: "Wallet lives {w}. Stop wandering."',
  phone: 'Sticky note: "Phone sleeps {w}."',
  officeId: 'Sticky note: "Office ID goes {w}."',
  shoes: 'Sticky note: "Work shoes belong {w}."',
  glasses: 'Sticky note: "Glasses rest {w}."',
  earbuds: 'Sticky note: "Earbuds: {w}."',
  bag: 'Sticky note: "Work bag hangs {w}."',
};

function buildLinks(def: ClueDef, slots: SlotMap, targets: ItemId[], habit: Map<ItemId, SpotId>): ClueLink[] {
  const out: ClueLink[] = [];
  for (const l of def.links) {
    if (l.item && (!targets.includes(l.item) || habit.has(l.item))) continue;
    const link: ClueLink = { strength: l.s };
    if (l.item) link.item = l.item;
    if (l.slot) link.spotId = slots[l.slot];
    if (l.roomOf) {
      const id = slots[l.roomOf];
      const sp = id ? anySpot(id) : undefined;
      if (sp) link.room = sp.room;
    }
    if (l.room) link.room = l.room;
    out.push(link);
  }
  return out;
}

/** Derives clues from the simulated evening plus, for tidy homes, a strong habit note. */
export function buildClues(
  t: Template, slots: SlotMap, targets: ItemId[], habit: Map<ItemId, SpotId>, difficulty: number, rng?: Rng,
): Clue[] {
  const clues: Clue[] = [];
  for (const def of t.clues) {
    const links = buildLinks(def, slots, targets, habit);
    if (def.links.length > 0 && links.length === 0) continue;
    const spotId = slots[def.slot];
    if (!spotId) continue;
    const facts: ClueFact[] = [];
    let text = def.text;
    for (const key of def.facts ?? []) {
      const k = FACT_KINDS[key];
      const value = rng ? rng.int(k.lo, k.hi) : Math.round((k.lo + k.hi) / 2);
      facts.push({ key, label: k.label, value });
      text = text.replace(`{fact:${key}}`, String(value));
    }
    const clue: Clue = { id: `c${clues.length + 1}`, spotId, title: def.title, icon: def.icon, links, text: expand(text, slots, difficulty) };
    if (facts.length > 0) clue.facts = facts;
    clues.push(clue);
  }
  const entrySpot = slots.e1;
  if (entrySpot) {
    for (const [item, homeId] of habit) {
      const home = anySpot(homeId);
      if (!home || !targets.includes(item)) continue;
      clues.push({
        id: `habit-${item}`, spotId: entrySpot, title: 'Sticky note', icon: 'note',
        text: HABIT_TEXT[item].replace('{w}', whereText(home, difficulty)),
        links: [{ spotId: homeId, item, strength: 'strong' }],
      });
    }
  }
  return clues;
}
