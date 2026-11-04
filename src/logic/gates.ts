import { WORD_GATES } from '../content/phrases';
import type { Difficulty, Gate, PlayerProfile, PuzzleKind, Scenario, Spot, SpotId, SpotKind } from '../shared/types';
import { PUZZLES, codeFeasible } from './puzzles';
import type { Fact } from './puzzles';
import type { Rng } from './rng';
import { gateBudget } from './gateBudget';
import { gateCosts } from './validator';

export { gateBudget };

/** Old kinds keep a flavour restriction (on lockable spots only); all newer kinds fit any lockable container. */
const FLAVOUR: Partial<Record<PuzzleKind, SpotKind[]>> = {
  untangle: ['drawer', 'bagSpot', 'basket'],
  sort: ['drawer', 'cabinet', 'basket', 'bin', 'wardrobe'],
  word: ['drawer', 'cabinet', 'wardrobe', 'fridge'],
};

const CONTEXT: Partial<Record<PuzzleKind, readonly string[]>> = {
  code: ['A keypad lock. The numbers are on the notes you found.'],
  target: ['The dial wants an exact number.'],
  sequence: ['A pattern is scratched on the lid. One number is missing.'],
  lights: ['A panel of lamps. Switch them all off.'],
  slide: ['A sliding tile panel is jammed.'],
  pipes: ['A pipe puzzle. Connect the water.'],
  mastermind: ['A symbol lock. It hints when you are close.'],
  memory: ['Repeat the pattern that flashes.'],
};

export interface GateOptions {
  enabled: readonly PuzzleKind[];
  profile: PlayerProfile;
  big: boolean;
  /** Spots in play (unlocked rooms + owned storage). */
  spots: readonly Spot[];
  /** Case builder: padlock budget (decoys included) instead of the day schedule. */
  budget?: number;
  /** Case builder: the last reachable target gets a compound finale gate (code lock from several clues, then a second stage). */
  finale?: boolean;
  /** Case builder: how many gates in total (finale included) become compound. */
  chains?: number;
  /** Extra stages per compound gate / on the finale (default 1). */
  chainDepth?: 1 | 2;
  finaleDepth?: 1 | 2;
}

/** Kinds that can be a second stage: no payload needed and not the clue-driven code lock. */
export const CHAIN_STAGES: readonly PuzzleKind[] = ['sequence', 'lights', 'slide', 'pipes', 'mastermind', 'memory', 'target'];
const chainStages = (o: GateOptions): PuzzleKind[] =>
  CHAIN_STAGES.filter((k) => o.enabled.includes(k) && k in PUZZLES && PUZZLES[k as keyof typeof PUZZLES].unlockDay <= o.profile.day);

function kindWeight(kind: PuzzleKind, profile: PlayerProfile): number {
  const boost = kind === 'code' ? 3 : 1; // the signature mechanic: favour it whenever the clues allow
  const st = profile.puzzles[kind];
  if (!st) return boost;
  const total = st.solved + st.skipped;
  return boost * (total < 3 ? 1 : Math.max(0.15, 1 - (st.skipped / total) * 0.85));
}

function makeGate(kind: PuzzleKind, difficulty: Difficulty, rng: Rng): Gate {
  if (kind === 'word') {
    const [word, hint] = rng.pick(WORD_GATES);
    return { kind, difficulty, payload: word, context: hint };
  }
  if (kind === 'untangle') return { kind, difficulty, payload: 'cables', context: 'A knot of cords blocks the way.' };
  if (kind === 'sort') return { kind, difficulty, payload: 'colour', context: 'It is crammed with odds and ends.' };
  const ctx = CONTEXT[kind];
  return ctx ? { kind, difficulty, context: rng.pick(ctx) } : { kind, difficulty };
}

/** Picks the fact-carrying clues a code lock should use (clue ids), or null if the scenario cannot support it. */
function codeNeeds(s: Scenario, spotId: SpotId, d: Difficulty, rng: Rng): string[] | null {
  const cost = gateCosts(s);
  const pool: Array<{ clueId: string; fact: Fact }> = [];
  for (const c of s.clues) {
    if (c.spotId === spotId || s.gates[c.spotId] || cost.get(c.spotId) !== 0) continue;
    for (const f of c.facts ?? []) pool.push({ clueId: c.id, fact: f });
  }
  const want = d === 3 ? 3 : 2;
  if (pool.length < want) return null;
  for (let t = 0; t < 12; t++) {
    const picks = rng.shuffle(pool).slice(0, want);
    if (new Set(picks.map((p) => p.fact.key)).size !== want) continue;
    if (!codeFeasible(picks.map((p) => p.fact), d)) continue;
    return [...new Set(picks.map((p) => p.clueId))];
  }
  return null;
}

/** Cheap fairness test used while placing gates (the full validator still runs afterwards). */
export function gatesFair(s: Scenario): boolean {
  const cost = gateCosts(s);
  for (const t of s.targets) {
    const p = s.placement[t];
    if (p !== undefined && (cost.get(p) ?? 99) > 1) return false;
  }
  const entryOk = s.clues.some((c) => cost.get(c.spotId) === 0 && !s.gates[c.spotId]);
  if (!entryOk) return false;
  for (const g of Object.values(s.gates)) {
    for (const id of g.needs ?? []) {
      const c = s.clues.find((x) => x.id === id);
      if (!c || cost.get(c.spotId) !== 0 || s.gates[c.spotId]) return false;
    }
  }
  return true;
}

/** `depth` distinct second-stage kinds, in a random order. */
function pickStages(rng: Rng, from: readonly PuzzleKind[], depth: number): PuzzleKind[] {
  return rng.shuffle(from).slice(0, Math.min(depth, from.length));
}

/** Like codeNeeds, but the facts must come from distinct clues, in two rooms when the case allows (a code you assemble across the house). */
function finaleNeeds(s: Scenario, spotId: SpotId, d: Difficulty, rng: Rng, roomOf: (id: SpotId) => string | undefined): string[] | null {
  const cost = gateCosts(s);
  const pool: Array<{ clueId: string; fact: Fact; room: string | undefined }> = [];
  for (const c of s.clues) {
    if (c.spotId === spotId || s.gates[c.spotId] || cost.get(c.spotId) !== 0) continue;
    for (const f of c.facts ?? []) pool.push({ clueId: c.id, fact: f, room: roomOf(c.spotId) });
  }
  const want = d === 3 ? 3 : 2;
  for (let t = 0; t < 30; t++) {
    const picks = rng.shuffle(pool).slice(0, want);
    if (picks.length < want || new Set(picks.map((p) => p.fact.key)).size !== want) continue;
    if (new Set(picks.map((p) => p.clueId)).size !== want) continue;
    if (t < 20 && new Set(picks.map((p) => p.room)).size < 2) continue; // prefer facts from two rooms
    if (!codeFeasible(picks.map((p) => p.fact), d)) continue;
    return picks.map((p) => p.clueId);
  }
  return null;
}

/** Places the compound finale on the last target whose holder is a lockable container (a difficulty-3 code lock when allowed, else difficulty 2). Returns the difficulty used. */
function addFinale(s: Scenario, rng: Rng, o: GateOptions): Difficulty | undefined {
  const tiers: Difficulty[] = o.profile.day >= 8 && s.difficulty === 3 ? [3, 2] : [2];
  const byId = new Map(o.spots.map((sp) => [sp.id, sp] as const));
  const stages = chainStages(o);
  for (const d of tiers) {
    for (const t of [...s.targets].reverse()) {
      const id = s.placement[t];
      const sp = id ? byId.get(id) : undefined;
      if (!sp || !sp.lockable || s.gates[sp.id]) continue;
      const needs = finaleNeeds(s, sp.id, d, rng, (cid) => byId.get(cid)?.room);
      if (!needs) continue;
      const gate: Gate = { kind: 'code', difficulty: d, context: 'A keypad lock. The numbers are on the notes you found.', needs };
      if (stages.length > 0) gate.chain = pickStages(rng, stages, o.finaleDepth ?? 1);
      s.gates[sp.id] = gate;
      if (gatesFair(s)) return d;
      delete s.gates[sp.id];
    }
  }
  return undefined;
}

/** Turns `count` more gates into compound ones (a second stage), path gates first. */
function addChains(s: Scenario, rng: Rng, o: GateOptions, count: number, holders: ReadonlySet<SpotId>): void {
  const stages = chainStages(o);
  if (stages.length === 0 || count <= 0) return;
  const cand = rng.shuffle(Object.entries(s.gates).filter(([, g]) => g.kind !== 'code' && !g.chain));
  cand.sort((a, b) => Number(holders.has(b[0])) - Number(holders.has(a[0])));
  for (const [, g] of cand.slice(0, count)) {
    const options = stages.filter((k) => k !== g.kind);
    if (options.length > 0) g.chain = pickStages(rng, options, o.chainDepth ?? 1);
  }
}

/**
 * v3 gates: lockable containers only, budget by day, about half on the path and half decoys,
 * kind variety, at most one difficulty-3 gate (from day 8), code locks wired to clue facts via `needs`.
 */
export function addGatesV3(s: Scenario, rng: Rng, o: GateOptions): void {
  const day = o.profile.day;
  const budget = o.budget ?? gateBudget(day, o.big);
  const kinds = o.enabled.filter((k) => k in PUZZLES && PUZZLES[k as keyof typeof PUZZLES].unlockDay <= day);
  if (kinds.length === 0) return;
  const holders = new Set<SpotId>();
  for (const t of s.targets) { const p = s.placement[t]; if (p) holders.add(p); }
  for (const c of s.clues) holders.add(c.spotId);
  const lockable = o.spots.filter((sp) => sp.lockable);
  const onPath = rng.shuffle(lockable.filter((sp) => holders.has(sp.id)));
  const decoys = rng.shuffle(lockable.filter((sp) => !holders.has(sp.id)));
  // Alternate path / decoy spots so about half the gates are decoys.
  const order: Spot[] = [];
  for (let i = 0; i < Math.max(onPath.length, decoys.length); i++) {
    const a = onPath[i], b = decoys[i];
    if (a) order.push(a);
    if (b) order.push(b);
  }
  const used = new Set<PuzzleKind>();
  const finaleDiff = o.finale ? addFinale(s, rng, o) : undefined;
  let d3Left = day >= 8 && s.difficulty === 3 && finaleDiff !== 3 ? 1 : 0;
  for (const sp of order) {
    if (Object.keys(s.gates).length >= budget) break;
    if (s.gates[sp.id]) continue; // the finale already sits here
    const gateDiff: Difficulty = d3Left > 0 ? 3 : (Math.min(s.difficulty, 2) as Difficulty);
    let fit = kinds.filter((k) => !FLAVOUR[k] || FLAVOUR[k]?.includes(sp.kind));
    const fresh = fit.filter((k) => !used.has(k));
    if (fresh.length > 0) fit = fresh;
    const weighted = fit.map((k) => [k, kindWeight(k, o.profile)] as const);
    for (let tries = 0; tries < 3 && weighted.length > 0; tries++) {
      const kind = rng.weighted(weighted);
      const gate = makeGate(kind, gateDiff, rng);
      if (kind === 'code') {
        const needs = codeNeeds(s, sp.id, gateDiff, rng);
        if (!needs) { weighted.splice(weighted.findIndex((w) => w[0] === kind), 1); continue; }
        gate.needs = needs;
      }
      s.gates[sp.id] = gate;
      if (gatesFair(s)) { used.add(kind); if (gateDiff === 3) d3Left--; break; }
      delete s.gates[sp.id];
      weighted.splice(weighted.findIndex((w) => w[0] === kind), 1);
    }
  }
  const finaleChained = Object.values(s.gates).filter((g) => g.kind === 'code' && g.chain).length;
  addChains(s, rng, o, (o.chains ?? 0) - finaleChained, holders);
}
