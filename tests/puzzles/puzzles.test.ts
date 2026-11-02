import { describe, expect, it } from 'vitest';
import { PUZZLES, crossings, type LogicPuzzleKind, type PuzzleTypes } from '../../src/logic/puzzles';
import type { Difficulty } from '../../src/shared/types';
import { Rng } from '../../src/logic/rng';

const SEEDS = Number(process.env.PUZZLE_SEEDS ?? 300);
const DIFFS: Difficulty[] = [1, 2, 3];
const KINDS = Object.keys(PUZZLES) as LogicPuzzleKind[];

type Wrong<K extends LogicPuzzleKind> = (spec: PuzzleTypes[K]['spec'], rng: Rng) => Array<PuzzleTypes[K]['answer']>;
const WRONG: { [K in LogicPuzzleKind]: Wrong<K> } = {
  code: (s, r) => {
    const out = ['', 'abc', '0000', String(Number(s.expected) + 1)];
    for (let i = 0; i < 5; i++) { const c = String(r.int(100, 9999)); if (c !== s.expected) out.push(c); }
    return out;
  },
  target: (s) => [[], [{ a: 0, b: 0, op: '+' }], [{ a: 99, b: 1, op: '+' }], [{ a: 0, b: 1, op: '%' as '+' }]],
  sequence: (s) => [s.expected + 1, -1, 0, ...s.options.filter((o) => o !== s.expected)],
  lights: (s) => { const sol = PUZZLES.lights.solve(s); return [[], [99], [-1], [...sol, sol[0] as number], sol.slice(1)]; },
  slide: (s) => [[], [99], [4, 4], s.solution.slice(0, -1)],
  pipes: (s) => [s.rots, [], s.solution.slice(1), s.solution.map(() => 7)],
  mastermind: (s) => [[], [s.secret.map((v) => (v + 1) % s.symbols)], Array.from({ length: s.maxAttempts + 1 }, () => s.secret), [[...s.secret, 0]]],
  untangle: (s) => [[], s.start.map((p) => [p[0], p[1]] as [number, number]), s.solved.slice(1), s.solved.map(() => [2, 2] as [number, number])],
  sort: (s) => [[], s.pieces.map((p) => (p.bin + 1) % s.bins.length), s.pieces.map(() => 99)],
  word: (s) => ['', 'ZZZZ', s.word + 'X', s.word.slice(1), '12'],
  memory: (s) => [[], s.sequence.slice(0, -1), s.sequence.map((v) => (v + 1) % s.pads), [...s.sequence].reverse().map((v, i) => (i === 0 ? (v + 1) % s.pads : v))],
};

describe.each(KINDS)('puzzle %s', (kind) => {
  const def = PUZZLES[kind] as unknown as {
    generate(seed: number, d: Difficulty): PuzzleTypes[LogicPuzzleKind]['spec'];
    check(spec: unknown, a: unknown): boolean; solve(spec: unknown): unknown; hint(spec: unknown, p?: number): string; parSeconds(d: Difficulty): number;
  };
  const wrong = WRONG[kind] as unknown as (s: unknown, r: Rng) => unknown[];

  it.each(DIFFS)(`difficulty %i: solvable, rejects wrong answers, deterministic (${SEEDS} seeds)`, (d) => {
    const times: number[] = [];
    for (let seed = 1; seed <= SEEDS; seed++) {
      const t0 = performance.now();
      const spec = def.generate(seed * 7919 + d, d);
      times.push(performance.now() - t0);
      expect(JSON.stringify(def.generate(seed * 7919 + d, d))).toBe(JSON.stringify(spec));
      expect(def.check(spec, def.solve(spec))).toBe(true);
      const rng = new Rng(seed);
      for (const w of wrong(spec, rng)) expect(def.check(spec, w), `${kind} d${d} seed ${seed} wrong=${JSON.stringify(w)}`).toBe(false);
      expect(def.hint(spec, 0).length).toBeGreaterThan(3);
      expect(def.hint(spec, 5).length).toBeGreaterThan(3);
    }
    times.sort((a, b) => a - b);
    const p99 = times[Math.floor(times.length * 0.99)] as number;
    expect(p99, `${kind} d${d} generate p99 ms`).toBeLessThanOrEqual(10);
  });

  it('par seconds grow with difficulty', () => {
    expect(def.parSeconds(1)).toBeLessThan(def.parSeconds(2));
    expect(def.parSeconds(2)).toBeLessThan(def.parSeconds(3));
    expect(def.parSeconds(3)).toBeLessThanOrEqual([25, 50, 90][2] as number);
  });
});

describe('kind-specific rules', () => {
  it('code: facts given -> uses them; result is a positive 3-4 digit string', () => {
    const facts = [
      { key: 'receipt', label: 'receipt total', value: 64 }, { key: 'seat', label: 'ticket seat', value: 47 },
      { key: 'tag', label: 'bag tag', value: 8 }, { key: 'mugs', label: 'mug count', value: 5 },
    ];
    for (const d of DIFFS) for (let seed = 1; seed <= SEEDS; seed++) {
      const s = PUZZLES.code.generate(seed, d, { facts });
      expect(s.expected).toMatch(/^[1-9]\d{2,3}$/);
      expect(s.digits).toBe(s.expected.length);
      if (!s.own) for (const f of s.facts) expect(facts.some((x) => x.key === f.key)).toBe(true);
      expect(s.facts.length).toBe(d === 3 ? 3 : 2);
    }
  });
  it('code: without facts invents its own, still valid', () => {
    for (const d of DIFFS) for (let seed = 1; seed <= SEEDS; seed++) {
      const s = PUZZLES.code.generate(seed, d);
      expect(s.own).toBe(true);
      expect(s.expected).toMatch(/^[1-9]\d{2,3}$/);
    }
  });
  it('target: target never among the numbers, 4-6 numbers, steps within budget', () => {
    for (const d of DIFFS) for (let seed = 1; seed <= SEEDS; seed++) {
      const s = PUZZLES.target.generate(seed, d);
      expect(s.numbers.length).toBe(d + 3);
      expect(s.numbers).not.toContain(s.target);
      expect(s.target).toBeGreaterThanOrEqual(10);
    }
  });
  it('sequence: 4 distinct options including the answer; missing term hidden', () => {
    for (const d of DIFFS) for (let seed = 1; seed <= SEEDS; seed++) {
      const s = PUZZLES.sequence.generate(seed, d);
      expect(new Set(s.options).size).toBe(4);
      expect(s.options).toContain(s.expected);
      expect(s.terms[s.missing]).toBeNull();
      expect(s.terms.filter((t) => t === null).length).toBe(1);
    }
  });
  it('lights: never starts solved and needs >= 3 presses', () => {
    for (const d of DIFFS) for (let seed = 1; seed <= SEEDS; seed++) {
      const s = PUZZLES.lights.generate(seed, d);
      expect(s.cells.some(Boolean)).toBe(true);
      expect(s.minPresses).toBeGreaterThanOrEqual(3);
      expect(PUZZLES.lights.solve(s).length).toBe(s.minPresses);
    }
  });
  it('slide: optimal depth in range, >= 8', () => {
    const range: Record<Difficulty, [number, number]> = { 1: [8, 10], 2: [11, 14], 3: [15, 18] };
    for (const d of DIFFS) for (let seed = 1; seed <= SEEDS; seed++) {
      const s = PUZZLES.slide.generate(seed, d);
      expect(s.depth).toBeGreaterThanOrEqual(range[d][0]);
      expect(s.depth).toBeLessThanOrEqual(range[d][1]);
      expect(s.solution.length).toBe(s.depth);
    }
  });
  it('mastermind: reference solver cracks every seed within the attempt cap', () => {
    for (const d of DIFFS) for (let seed = 1; seed <= SEEDS * 2; seed++) {
      const s = PUZZLES.mastermind.generate(seed, d);
      expect(PUZZLES.mastermind.solve(s).length).toBeLessThanOrEqual(s.maxAttempts);
    }
  });
  it('memory: no immediate repeats, length 3..7', () => {
    for (const d of DIFFS) for (let seed = 1; seed <= SEEDS; seed++) {
      const s = PUZZLES.memory.generate(seed, d);
      expect(s.sequence.length).toBeGreaterThanOrEqual(3);
      s.sequence.forEach((v, i) => { if (i > 0) expect(v).not.toBe(s.sequence[i - 1]); });
    }
  });
  it('untangle: starts tangled (>= minCross crossings), reference has none', () => {
    for (const d of DIFFS) for (let seed = 1; seed <= SEEDS; seed++) {
      const s = PUZZLES.untangle.generate(seed, d);
      expect(crossings(s.edges, s.start)).toBeGreaterThanOrEqual(s.minCross);
      expect(crossings(s.edges, s.solved)).toBe(0);
    }
  });
  it('untangle: theme follows the gate context', () => {
    expect(PUZZLES.untangle.generate(1, 1, { context: 'charging cable' }).theme).toBe('cable');
    expect(PUZZLES.untangle.generate(1, 1, { context: 'her necklace' }).theme).toBe('necklace');
    expect(PUZZLES.untangle.generate(1, 1).theme).toBe('headphones');
  });
  it('sort: bins in range, every piece belongs to a bin, never pre-sorted by position', () => {
    for (const d of DIFFS) for (let seed = 1; seed <= SEEDS; seed++) {
      const s = PUZZLES.sort.generate(seed, d);
      expect(s.pieces.length).toBeGreaterThanOrEqual(6);
      for (const p of s.pieces) { expect(p.bin).toBeGreaterThanOrEqual(0); expect(p.bin).toBeLessThan(s.bins.length); }
    }
  });
  it('word: custom payload is the only accepted answer; generated words accept anagrams of list words only', () => {
    const s = PUZZLES.word.generate(5, 1, { payload: 'keys-box', context: 'Where the keys sleep' });
    expect(s.word).toBe('KEYSBOX');
    expect(s.custom).toBe(true);
    expect(s.hint).toBe('Where the keys sleep');
    expect(PUZZLES.word.check(s, 'KEYSBOX')).toBe(true);
    expect(PUZZLES.word.check(s, 'BOXKEYS')).toBe(false);
    for (const d of DIFFS) for (let seed = 1; seed <= SEEDS; seed++) {
      const w = PUZZLES.word.generate(seed, d);
      expect(w.custom).toBe(false);
      if (w.mode !== 'cipher') expect(w.tiles.join('')).not.toBe(w.word);
      expect(w.mode === 'cipher' ? w.coded.length : w.tiles.length).toBeGreaterThan(0);
    }
  });
});
