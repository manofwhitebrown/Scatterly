import { describe, expect, it, vi } from 'vitest';

vi.mock('phaser', () => ({ default: { Geom: { Rectangle: class {}, } } }));
import pal from '../docs/art/palette.json';
import { COLOR, CSS } from '../src/ui/theme';
import { yardPlan } from '../src/scenes/homeYardPlan';
import { ROOM_SIZE } from '../src/content/world';

const hex = (s: string): number => parseInt(s.slice(1), 16);

describe('exterior plan', () => {
  const plan = yardPlan();
  it('never puts lawn or props inside the house footprint', () => {
    const w = 30; const d = Math.max(...Object.values(ROOM_SIZE).map((r) => r.d));
    for (const i of plan) if (i.key.startsWith('yard/lawn')) expect(i.gx >= 0 && i.gx < w && i.gy >= 0 && i.gy < d).toBe(false);
  });
  it('has the whole kit: porch, path, fence, gate, trees, bushes, flowers, mailbox', () => {
    for (const p of ['porch/floor', 'porch/steps', 'yard/path', 'yard/fence_r', 'yard/fence_gate', 'yard/tree_0', 'yard/bush_0', 'yard/flowers_0', 'yard/mailbox']) expect(plan.some((i) => i.key === p)).toBe(true);
  });
});

describe('theme tokens mirror docs/art/palette.json theme block', () => {
  it('match', () => {
    const t = pal.theme;
    expect(COLOR.plate).toBe(hex(t.panel)); expect(COLOR.plateLight).toBe(hex(t.panelHi)); expect(COLOR.bg).toBe(hex(t.panelLo));
    expect(COLOR.plateEdge).toBe(hex(t.outline)); expect(COLOR.amber).toBe(hex(t.btnPrimary)); expect(COLOR.teal).toBe(hex(t.btnSecondary));
    expect(COLOR.red).toBe(hex(t.btnDanger)); expect(COLOR.cream).toBe(hex(t.text)); expect(CSS.cream).toBe(t.text); expect(CSS.muted).toBe(t.textDim);
  });
});

import { HOUSE } from '../src/content/house';
import { artStats, needsHint } from '../src/scenes/homeArtStats';
import { coveredBySpot } from '../src/scenes/homeProps';
describe('art stats and decor hint', () => {
  it('counts kinds with frames per key family', () => {
    const none = artStats(() => false);
    expect(none.propsWith).toBe(0); expect(none.propsTotal).toBeGreaterThan(30); expect(none.spotsTotal).toBeGreaterThan(10);
    const all = artStats(() => true);
    expect(all.propsWith).toBe(all.propsTotal); expect(all.spotsWith).toBe(all.spotsTotal);
  });
  it('shows the outline hint after 3 decor taps, once', () => {
    expect(needsHint(2, false)).toBe(false); expect(needsHint(3, false)).toBe(true); expect(needsHint(9, true)).toBe(false);
  });
  it('a prop under a piece with art is hidden, with no art it stays', () => {
    const s = (HOUSE.find((x) => x.room === 'living'))!;
    const f = { gx: s.iso.gx, gy: s.iso.gy, w: 1, d: 1 };
    expect(coveredBySpot('living', f, () => true)).toBe(true);
    expect(coveredBySpot('living', f, () => false)).toBe(false);
  });
});
