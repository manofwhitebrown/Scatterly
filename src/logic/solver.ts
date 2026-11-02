import { anySpot } from '../content/decor';
import { ROOM_ORDER } from '../shared/types';
import { PUZZLES } from './puzzles';
import type { ItemId, RoomId, Scenario, Spot, SpotAction, SpotId } from '../shared/types';
import { scenarioSpots } from './validator';

const ACT_RANK: Record<SpotAction, number> = { peek: 0, lift: 1, search: 2, open: 3 };

export interface SolveResult { searches: number; ok: boolean; /** Par seconds of every gate the ideal player opens. */ seconds: number }

/**
 * Simulates an ideal deducing player: follow strong spot links, then strong room links,
 * then weak ones, and otherwise sweep the start room (easy surfaces first), then other rooms.
 */
export function solveScenario(s: Scenario): SolveResult {
  const spots = scenarioSpots(s);
  const referenced = new Set<RoomId>(['entrance', 'living', 'kitchen', 'bedroom', s.startRoom]);
  for (const id of Object.values(s.placement)) {
    const sp = id ? anySpot(id) : undefined;
    if (sp) referenced.add(sp.room);
  }
  for (const c of s.clues) {
    const sp = anySpot(c.spotId);
    if (sp) referenced.add(sp.room);
  }
  const pool = spots.filter((x) => referenced.has(x.room));
  const byId = new Map(pool.map((x) => [x.id, x]));
  const opened = new Set<SpotId>();
  const found = new Set<ItemId>();
  const discovered: Scenario['clues'] = [];
  let searches = 0;
  let seconds = 0;

  const remaining = (): ItemId[] => s.targets.filter((t) => !found.has(t));
  const wanted = (item: ItemId | undefined): boolean => !item || !found.has(item);
  const rank = (sp: Spot, rem: ItemId[]): number =>
    ACT_RANK[sp.action] - rem.filter((i) => sp.plausible.includes(i)).length * 10;

  const needsFirst = (sp: Spot | undefined): Spot | undefined => {
    if (!sp) return sp;
    for (const cid of s.gates[sp.id]?.needs ?? []) {
      const c = s.clues.find((x) => x.id === cid);
      if (c && !discovered.includes(c)) { const cs = byId.get(c.spotId); if (cs && !opened.has(cs.id)) return cs; }
    }
    return sp;
  };

  const nextSpot = (): Spot | undefined => needsFirst(nextRaw());

  const nextRaw = (): Spot | undefined => {
    const rem = remaining();
    const pick = (list: Spot[]): Spot | undefined =>
      list.filter((x) => !opened.has(x.id)).sort((a, b) => rank(a, rem) - rank(b, rem) || a.id.localeCompare(b.id))[0];
    for (const strength of ['strong', 'weak'] as const) {
      for (const c of discovered) {
        for (const l of c.links) {
          if (l.strength !== strength || !wanted(l.item) || !l.spotId) continue;
          const sp = byId.get(l.spotId);
          if (sp && !opened.has(sp.id)) return sp;
        }
      }
      for (const c of discovered) {
        for (const l of c.links) {
          if (l.strength !== strength || !wanted(l.item) || !l.room) continue;
          const sp = pick(pool.filter((x) => x.room === l.room));
          if (sp) return sp;
        }
      }
    }
    const start = pick(pool.filter((x) => x.room === s.startRoom));
    if (start) return start;
    for (const r of ROOM_ORDER) {
      const sp = pick(pool.filter((x) => x.room === r));
      if (sp) return sp;
    }
    return undefined;
  };

  while (remaining().length > 0) {
    const sp = nextSpot();
    if (!sp) break;
    opened.add(sp.id);
    searches++;
    const g = s.gates[sp.id];
    if (g) seconds += g.kind in PUZZLES ? PUZZLES[g.kind as keyof typeof PUZZLES].parSeconds(g.difficulty) : 30;
    for (const c of s.clues) if (c.spotId === sp.id && !discovered.includes(c)) discovered.push(c);
    for (const t of s.targets) if (s.placement[t] === sp.id) found.add(t);
  }
  const ok = remaining().length === 0 && searches <= s.parSearches * 2;
  return { searches, ok, seconds };
}
