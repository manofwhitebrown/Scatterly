import { describe, expect, it } from 'vitest';
import { defaultProfile } from '../src/core/save';
import { DECOR } from '../src/content/decor';
import { ENABLED } from '../src/content/puzzleRoster';
import { MAX_SPOTS_PER_ROOM } from '../src/content/house';
import { generateScenario } from '../src/logic/generator';
import { buyDecor, listDecor, spotCount } from '../src/logic/progression';
import { solveScenario } from '../src/logic/solver';
import { validateScenario } from '../src/logic/validator';
import type { GameMode, PlayerProfile } from '../src/shared/types';

const ROOMS = ['entrance', 'living', 'kitchen', 'bedroom', 'bathroom'] as const;
const PROFILES: PlayerProfile[] = [1, 5, 14].map((day) => ({ ...defaultProfile(), day, unlockedRooms: [...ROOMS] }));
const MODES: GameMode[] = ['rush', 'relaxed', 'daily'];
/** Deterministic sampling: 5000 seeds spread over every mode x profile combination (about 555 each) keeps npm test fast. */
const SEEDS = 5000;

describe('fairness over 5000 seeds with every enabled kind (G5)', () => {
  it('roster holds all 11 implemented kinds', () => expect(ENABLED.length).toBe(11));

  it('every sampled scenario is valid and solvable incl. gates and code locks', () => {
    const bad: string[] = [];
    let gates = 0;
    for (let seed = 1; seed <= SEEDS; seed++) {
      const mode = MODES[seed % 3] as GameMode;
      const profile = PROFILES[Math.floor(seed / 3) % 3] as PlayerProfile;
      const sc = generateScenario(seed * 7919, mode, profile);
      gates += Object.keys(sc.gates).length;
      const v = validateScenario(sc);
      if (v.length > 0) { bad.push(`${seed}/${mode}/d${profile.day}: ${v[0]}`); continue; }
      const sol = solveScenario(sc);
      if (!sol.ok) bad.push(`${seed}/${mode}/d${profile.day}: unsolvable`);
    }
    expect(bad.slice(0, 5)).toEqual([]);
    expect(gates).toBeGreaterThan(SEEDS);
  });
});

describe('12 interactive pieces per room', () => {
  const rich: PlayerProfile = { ...defaultProfile(), day: 30, coins: 99999, unlockedRooms: [...ROOMS] };
  it('refuses storage that would exceed the cap, keeps cosmetics buyable', () => {
    let p = rich;
    for (const d of DECOR) { const next = buyDecor(p, d.id); if (next) p = next; }
    for (const r of ROOMS) expect(spotCount(p, r)).toBeLessThanOrEqual(MAX_SPOTS_PER_ROOM);
    for (const d of DECOR.filter((x) => x.kind === 'cosmetic')) expect(p.owned).toContain(d.id);
    const full = listDecor(rich).filter((v) => v.def.kind === 'storage' && spotCount(rich, v.def.room) >= MAX_SPOTS_PER_ROOM);
    expect(full.length).toBeGreaterThan(0);
    for (const v of full) expect(v.canBuy).toBe(false);
  });
});
