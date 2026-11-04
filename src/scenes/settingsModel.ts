import type { PlayerProfile } from '../shared/types';

export type Settings = PlayerProfile['settings'];
export type ToggleKey = 'sfx' | 'music' | 'vibration' | 'lowFx' | 'reducedMotion' | 'walkAnim' | 'matchClock' | 'showLockIcons';
export type VolumeKey = 'musicVol' | 'sfxVol' | 'ambienceVol';

export const VOLUME_STEPS = [0, 0.25, 0.5, 0.75, 1] as const;
export const QUALITY_STEPS = ['auto', 'low', 'high'] as const;
export const LENGTH_STEPS = ['short', 'standard', 'long'] as const;

/** Next value in a ring; an unknown current value starts at the first entry. */
export function nextInRing<T>(ring: readonly T[], current: T): T {
  const i = ring.indexOf(current);
  return ring[(i + 1) % ring.length] as T;
}

/** Next volume step above `v`, wrapping to 0 after the top. Off-grid values snap upward. */
export function nextVolume(v: number): number {
  const up = VOLUME_STEPS.find((s) => s > v + 1e-9);
  return up ?? 0;
}

export const pct = (v: number): string => `${Math.round(v * 100)}%`;
export const title = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

export type Row =
  | { kind: 'toggle'; key: ToggleKey; label: string }
  | { kind: 'volume'; key: VolumeKey; label: string }
  | { kind: 'quality'; label: string }
  | { kind: 'length'; label: string };

/** Two columns of six rows, in reading order per column. */
export const COLUMNS: readonly (readonly Row[])[] = [
  [
    { kind: 'toggle', key: 'sfx', label: 'Sound effects' },
    { kind: 'toggle', key: 'music', label: 'Music' },
    { kind: 'toggle', key: 'vibration', label: 'Vibration' },
    { kind: 'toggle', key: 'lowFx', label: 'Low effects' },
    { kind: 'toggle', key: 'reducedMotion', label: 'Reduced motion' },
    { kind: 'toggle', key: 'walkAnim', label: 'Walk animation' },
  ],
  [
    { kind: 'volume', key: 'musicVol', label: 'Music level' },
    { kind: 'volume', key: 'sfxVol', label: 'Effect level' },
    { kind: 'volume', key: 'ambienceVol', label: 'Ambience level' },
    { kind: 'quality', label: 'Quality' },
    { kind: 'length', label: 'Case length' },
    { kind: 'toggle', key: 'matchClock', label: 'Match my clock' },
    { kind: 'toggle', key: 'showLockIcons', label: 'Show lock icons before tapping' },
  ],
];

/** Pure update of one row: returns the new settings. */
export function applyRow(s: Settings, row: Row): Settings {
  switch (row.kind) {
    case 'toggle': return { ...s, [row.key]: !s[row.key] };
    case 'volume': return { ...s, [row.key]: nextVolume(s[row.key]) };
    case 'quality': return { ...s, quality: nextInRing(QUALITY_STEPS, s.quality) };
    case 'length': return { ...s, sessionLength: nextInRing(LENGTH_STEPS, s.sessionLength) };
  }
}

export function rowLabel(s: Settings, row: Row): string {
  switch (row.kind) {
    case 'toggle': return s[row.key] ? 'On' : 'Off';
    case 'volume': return pct(s[row.key]);
    case 'quality': return title(s.quality);
    case 'length': return title(s.sessionLength);
  }
}

export const rowActive = (s: Settings, row: Row): boolean => (row.kind === 'toggle' ? s[row.key] : false);
