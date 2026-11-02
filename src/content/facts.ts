/** Numeric facts that clues can carry. Values are rolled per seed; code locks combine them (see logic/puzzles/codeLock). */
export type FactKey = 'receipt' | 'seat' | 'tag' | 'laundry' | 'mugs' | 'platform' | 'flat' | 'page' | 'charge' | 'track' | 'fuse' | 'guests' | 'calls' | 'ptag';

export const FACT_KINDS: Record<FactKey, { label: string; lo: number; hi: number }> = {
  receipt: { label: 'receipt total', lo: 60, hi: 189 },
  seat: { label: 'ticket seat', lo: 5, hi: 48 },
  tag: { label: 'bag tag', lo: 40, hi: 140 },
  laundry: { label: 'laundry count', lo: 3, hi: 14 },
  mugs: { label: 'mug count', lo: 2, hi: 9 },
  platform: { label: 'platform number', lo: 3, hi: 19 },
  flat: { label: 'flat number', lo: 11, hi: 80 },
  page: { label: 'page number', lo: 12, hi: 95 },
  charge: { label: 'battery level', lo: 3, hi: 19 },
  track: { label: 'track number', lo: 3, hi: 24 },
  fuse: { label: 'fuse number', lo: 3, hi: 30 },
  guests: { label: 'guest count', lo: 6, hi: 25 },
  calls: { label: 'missed calls', lo: 3, hi: 14 },
  ptag: { label: 'plant tag', lo: 12, hi: 60 },
};
