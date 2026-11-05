import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { defaultProfile } from '../src/core/save';
import { allSpots } from '../src/logic/progression';
import { LEGACY_ROOMS } from '../src/shared/types';
import type { PlayerProfile } from '../src/shared/types';

const profile: PlayerProfile = { ...defaultProfile(), unlockedRooms: [...LEGACY_ROOMS, 'study'] };
const spots = allSpots(profile);

/** Every key or string in the shipped room atlas that names a spot frame. */
function atlasSpotFrames(): Set<string> {
  const names = new Set<string>();
  const walk = (x: unknown): void => {
    if (typeof x === 'string') { if (x.startsWith('spot/')) names.add(x); return; }
    if (Array.isArray(x)) { x.forEach(walk); return; }
    if (x && typeof x === 'object') for (const [k, v] of Object.entries(x)) { if (k.startsWith('spot/')) names.add(k); walk(v); }
  };
  walk(JSON.parse(readFileSync('public/atlas/room-slice.json', 'utf8')));
  return names;
}

describe('spot kinds and footprints (the list posted for AI-4)', () => {
  it('a kind has one footprint everywhere, and every footprint is at least 1x1x1', () => {
    const seen = new Map<string, string>();
    for (const s of spots) {
      const f = `${s.iso.w}x${s.iso.d}x${s.iso.h}@${s.iso.gz ?? 0}`;
      expect(seen.get(s.kind) ?? f, `${s.id} (${s.kind})`).toBe(f);
      seen.set(s.kind, f);
      expect(Math.min(s.iso.w, s.iso.d, s.iso.h), s.id).toBeGreaterThanOrEqual(1);
    }
  });
  it('every spot kind in entrance, bathroom and study has closed and open frames in the atlas', () => {
    const frames = atlasSpotFrames();
    for (const room of ['entrance', 'bathroom', 'study']) {
      for (const k of new Set(spots.filter((s) => s.room === room).map((s) => s.kind))) {
        expect(frames.has(`spot/${k}/closed`), `${room}: spot/${k}/closed`).toBe(true);
        expect(frames.has(`spot/${k}/open`), `${room}: spot/${k}/open`).toBe(true);
      }
    }
  });
  it('the three rooms hold the kinds posted in docs/status/AI-2.md', () => {
    const kinds = (room: string): string[] => [...new Set(spots.filter((s) => s.room === room).map((s) => s.kind))].sort();
    expect(kinds('entrance')).toEqual(['bagSpot', 'basket', 'bin', 'cabinet', 'drawer', 'jacket', 'papers', 'plant', 'shelf', 'shoeRack']);
    expect(kinds('bathroom')).toEqual(['bagSpot', 'basket', 'bin', 'cabinet', 'drawer', 'papers', 'plant', 'shelf', 'sink']);
    expect(kinds('study')).toEqual(['basket', 'bin', 'cabinet', 'drawer', 'papers', 'shelf', 'sofa', 'table']);
  });
});
