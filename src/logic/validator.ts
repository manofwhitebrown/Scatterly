import { STORAGE_SPOTS, anySpot } from '../content/decor';
import { HOUSE } from '../content/house';
import { PUZZLE_KINDS } from '../shared/types';
import type { PlayerProfile, Scenario, Spot, SpotId } from '../shared/types';
import { codeFeasible } from './puzzles';
import { gateBudget } from './gateBudget';

/** Spots relevant to a scenario: the whole house plus any storage decor it mentions. */
export function scenarioSpots(s: Scenario): Spot[] {
  const out = HOUSE.slice();
  const ids = new Set<SpotId>();
  for (const id of Object.values(s.placement)) if (id) ids.add(id);
  for (const c of s.clues) {
    ids.add(c.spotId);
    for (const l of c.links) if (l.spotId) ids.add(l.spotId);
  }
  for (const id of Object.keys(s.gates)) ids.add(id);
  for (const sp of STORAGE_SPOTS) if (ids.has(sp.id)) out.push(sp);
  return out;
}

/** Minimum number of gates that must be solved to inspect each reachable spot. */
export function gateCosts(s: Scenario): Map<SpotId, number> {
  const spots = scenarioSpots(s);
  const gated = (id: SpotId): number => (s.gates[id] ? 1 : 0);
  const cost = new Map<SpotId, number>();
  for (const sp of spots) if (sp.room === s.startRoom) cost.set(sp.id, gated(sp.id));
  let changed = true;
  while (changed) {
    changed = false;
    for (const c of s.clues) {
      const base = cost.get(c.spotId);
      if (base === undefined) continue;
      for (const l of c.links) {
        const dests = l.spotId ? spots.filter((x) => x.id === l.spotId) : l.room ? spots.filter((x) => x.room === l.room) : [];
        for (const d of dests) {
          const next = base + gated(d.id);
          const cur = cost.get(d.id);
          if (cur === undefined || next < cur) {
            cost.set(d.id, next);
            changed = true;
          }
        }
      }
    }
  }
  return cost;
}

/** Searches an all-knowing player needs: the union of the shortest clue chains to every target. */
export function idealSearchCount(s: Scenario): number {
  const spots = scenarioSpots(s);
  const interesting = new Set<SpotId>(s.clues.map((c) => c.spotId));
  for (const t of s.targets) {
    const p = s.placement[t];
    if (p) interesting.add(p);
  }
  const room = (id: SpotId): string | undefined => spots.find((x) => x.id === id)?.room;
  const parent = new Map<SpotId, SpotId | null>();
  let queue: SpotId[] = [];
  for (const id of interesting) {
    if (room(id) === s.startRoom) {
      parent.set(id, null);
      queue.push(id);
    }
  }
  while (queue.length > 0) {
    const next: SpotId[] = [];
    for (const cur of queue) {
      for (const c of s.clues) {
        if (c.spotId !== cur) continue;
        for (const l of c.links) {
          for (const id of interesting) {
            if (parent.has(id)) continue;
            if (l.spotId === id || (l.room && room(id) === l.room)) {
              parent.set(id, cur);
              next.push(id);
            }
          }
        }
      }
    }
    queue = next;
  }
  const used = new Set<SpotId>();
  const chain = (start: SpotId | undefined): void => {
    let p: SpotId | null | undefined = start;
    if (!p) return;
    if (!parent.has(p)) { used.add(p); return; }
    while (p) { used.add(p); p = parent.get(p); }
  };
  for (const t of s.targets) chain(s.placement[t]);
  // A code lock on the path also needs the clues that carry its numbers.
  for (const [gid, g] of Object.entries(s.gates)) {
    if (!used.has(gid)) continue;
    for (const cid of g.needs ?? []) chain(s.clues.find((c) => c.id === cid)?.spotId);
  }
  return used.size;
}

const MAX_TEXT = 90;

export function validateScenario(s: Scenario, profile?: PlayerProfile): string[] {
  const errs: string[] = [];
  const spots = scenarioSpots(s);
  const get = (id: SpotId): Spot | undefined => anySpot(id);
  const unlocked = profile ? new Set(profile.unlockedRooms) : null;

  if (s.targets.length < 2 || s.targets.length > 5) errs.push('target count out of range');
  if (new Set(s.targets).size !== s.targets.length) errs.push('duplicate targets');

  const load = new Map<SpotId, number>();
  for (const [item, id] of Object.entries(s.placement)) {
    const sp = id ? get(id) : undefined;
    if (!id || !sp) { errs.push(`${item}: unknown spot ${String(id)}`); continue; }
    if (!(sp.plausible as string[]).includes(item)) errs.push(`${item} not plausible at ${id}`);
    if (unlocked && !unlocked.has(sp.room)) errs.push(`${item} placed in locked room ${sp.room}`);
    if (profile && STORAGE_SPOTS.some((x) => x.id === id) && !profile.owned.some((o) => `${sp.room}.${o}` === id)) {
      errs.push(`${id} is not owned`);
    }
    load.set(id, (load.get(id) ?? 0) + 1);
  }
  for (const t of s.targets) if (!s.placement[t]) errs.push(`target ${t} has no placement`);
  for (const [id, n] of load) {
    const sp = get(id);
    if (sp && n > sp.capacity) errs.push(`${id} over capacity`);
  }

  // Evening integrity: clocks ascend and final locations derive from the last step per item.
  let prev = '';
  const last = new Map<string, SpotId | undefined>();
  const visited = new Set<SpotId>();
  s.evening.forEach((st, i) => {
    if (st.n !== i + 1) errs.push('evening numbering');
    if (st.clock <= prev) errs.push(`clock not ascending at step ${st.n}`);
    if (!st.note) errs.push('empty note');
    prev = st.clock;
    if (st.itemId) last.set(st.itemId, st.spotId);
    if (st.spotId) visited.add(st.spotId);
  });
  if (s.evening.length < 5) errs.push('evening too short');
  for (const [item, id] of Object.entries(s.placement)) {
    if (last.get(item) !== id) errs.push(`${item} placement not derived from evening`);
  }

  // Clues.
  const seen = new Set<string>();
  const ids = new Set<string>();
  for (const c of s.clues) {
    if (ids.has(c.id)) errs.push(`duplicate clue id ${c.id}`);
    ids.add(c.id);
    const key = c.text.toLowerCase();
    if (seen.has(key)) errs.push(`duplicate clue text ${c.id}`);
    seen.add(key);
    if (c.text.length > MAX_TEXT) errs.push(`clue ${c.id} too long`);
    if (!c.title) errs.push(`clue ${c.id} has no title`);
    const cs = get(c.spotId);
    if (!cs) { errs.push(`clue ${c.id} at unknown spot`); continue; }
    if (!visited.has(c.spotId)) errs.push(`clue ${c.id} not at a visited spot`);
    if (unlocked && !unlocked.has(cs.room)) errs.push(`clue ${c.id} in locked room`);
    if (s.difficulty >= 2) {
      for (const l of c.links) {
        const ls = l.spotId ? get(l.spotId) : undefined;
        if (ls && c.text.toLowerCase().includes(ls.label.toLowerCase())) errs.push(`clue ${c.id} names ${ls.label}`);
      }
    }
  }

  // Gates.
  const gateIds = Object.keys(s.gates);
  if (gateIds.length > (profile ? Math.max(gateBudget(profile.day), 6) : 6)) errs.push('too many gates');
  let d3 = 0;
  for (const id of gateIds) {
    const sp = get(id);
    const g = s.gates[id];
    if (!sp || !g) { errs.push(`gate on unknown spot ${id}`); continue; }
    if (!sp.lockable) errs.push(`gate on non-lockable spot ${id}`);
    if (!(PUZZLE_KINDS as readonly string[]).includes(g.kind)) errs.push(`gate ${id} has unknown kind`);
    if (g.difficulty === 3) d3++;
    if (g.kind !== 'code' && g.needs) errs.push(`gate ${id} has needs but is not a code lock`);
    if (g.kind === 'code') {
      const facts = [];
      const needs = g.needs ?? [];
      if (needs.length < 1 || needs.length > 3) errs.push(`code gate ${id} needs ${needs.length} clues`);
      for (const cid of needs) {
        const c = s.clues.find((x) => x.id === cid);
        if (!c || !c.facts || c.facts.length === 0) { errs.push(`code gate ${id} needs missing clue ${cid}`); continue; }
        if (c.spotId === id || s.gates[c.spotId]) errs.push(`code gate ${id} needs a clue behind a gate`);
        facts.push(...c.facts);
      }
      const want = g.difficulty === 3 ? 3 : 2;
      if (new Set(facts.map((f) => f.key)).size < want || !codeFeasible(facts, g.difficulty)) errs.push(`code gate ${id} facts cannot make a code`);
    }
  }
  if (d3 > 1) errs.push('more than one difficulty-3 gate');
  if (d3 > 0 && profile && profile.day < 8) errs.push('difficulty-3 gate before day 8');

  // Fairness: every target must be reachable through a clue chain with at most one gate.
  const cost = gateCosts(s);
  const entryOk = s.clues.some((c) => cost.get(c.spotId) === 0 && get(c.spotId)?.room === s.startRoom && !s.gates[c.spotId]);
  let needsEntry = false;
  for (const t of s.targets) {
    const pid = s.placement[t];
    const p = pid ? get(pid) : undefined;
    if (!pid || !p) continue;
    const c = cost.get(pid);
    if (c === undefined) { errs.push(`${t} unreachable`); continue; }
    if (c > 1) errs.push(`${t} chain needs ${c} gates`);
    if (p.room === s.startRoom) continue;
    needsEntry = true;
    const covered = s.clues.some((cl) => cost.has(cl.spotId) && cl.links.some((l) =>
      l.item === t && (l.spotId === pid || l.room === p.room)));
    if (!covered) errs.push(`${t} has no reachable clue`);
  }
  if (needsEntry && !entryOk) errs.push('no ungated entry clue in the start room');
  if (spots.length === 0) errs.push('no spots');
  return errs;
}
