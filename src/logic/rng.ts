/** Seeded mulberry32 RNG. Every random choice in the generator goes through this class. */
export class Rng {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  /** Float in [0, 1). */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Integer in [a, b] inclusive. */
  int(a: number, b: number): number {
    return a + Math.floor(this.next() * (b - a + 1));
  }

  pick<T>(arr: readonly T[]): T {
    if (arr.length === 0) throw new Error('Rng.pick: empty array');
    return arr[Math.floor(this.next() * arr.length)] as T;
  }

  /** Returns a shuffled copy (Fisher-Yates). */
  shuffle<T>(arr: readonly T[]): T[] {
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      const tmp = out[i] as T;
      out[i] = out[j] as T;
      out[j] = tmp;
    }
    return out;
  }

  weighted<T>(pairs: ReadonlyArray<readonly [T, number]>): T {
    if (pairs.length === 0) throw new Error('Rng.weighted: empty list');
    let total = 0;
    for (const p of pairs) total += Math.max(0, p[1]);
    if (total <= 0) return (pairs[0] as readonly [T, number])[0];
    let roll = this.next() * total;
    for (const p of pairs) {
      roll -= Math.max(0, p[1]);
      if (roll < 0) return p[0];
    }
    return (pairs[pairs.length - 1] as readonly [T, number])[0];
  }

  chance(p: number): boolean {
    return this.next() < p;
  }
}

/** Mixes a seed with a salt into a new well-spread 32-bit seed. */
export function deriveSeed(seed: number, salt: number): number {
  let h = (seed ^ Math.imul(salt + 1, 0x9e3779b1)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}

/** Small string hash (FNV-1a) for stable, rng-free text variation. */
export function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
