/**
 * Art manifest (Contract v4 shared API, AI-4).
 * Gameplay code asks for a key such as `spot/drawer/closed` and gets a FrameRef or undefined.
 * undefined means "use the procedural fallback"; it never throws.
 */

/** Pixel scale numbers from Art Bible v1; Contract v4 exports the same values as ART. */
export const ART_PX = 3;
export const TILE_ART = { w: 32, h: 16 } as const;

export type AtlasGroup = 'core' | 'house' | `room:${string}` | `puzzle:${string}`;

export interface FrameRef {
  key: string;
  atlas: string;     // Phaser texture key of the atlas PNG
  frame: string;     // frame name inside the atlas
  w: number;         // native art px
  h: number;
  pivotX: number;    // anchor in art px from the frame's top-left
  pivotY: number;
  group: AtlasGroup;
  tags?: Record<string, { from: number; to: number; ms: number }>;
}

export interface ArtManifest {
  version: 1;
  frames: Record<string, FrameRef>;
}

export type Dir = 'se' | 'sw';
export type SpotState = 'closed' | 'open';

/** Frame key builders: the single place where the naming convention lives. */
export const FRAME_KEYS = {
  spot: (kind: string, state: SpotState): string => `spot/${kind}/${state}`,
  prop: (id: string): string => `prop/${id}`,
  shell: (room: string, part: string): string => `shell/${room}/${part}`,
  ui: (name: string): string => `ui/${name}`,
  icon: (item: string): string => `icon/${item}`,
  fx: (name: string, n: number): string => `fx/${name}/${n}`,
  avatar: (dir: Dir, anim: string, n: number): string => `avatar/${dir}/${anim}/${n}`,
  pet: (anim: string, n: number): string => `pet/cat/${anim}/${n}`,
  puzzle: (kind: string, name: string): string => `puzzle/${kind}/${name}`,
  mat: (name: string): string => `mat/${name}`,
} as const;

const KEY_RE = /^(spot\/[A-Za-z]+\/(closed|open)|prop\/[A-Za-z0-9_]+|shell\/[a-z]+\/[A-Za-z0-9_/]+|ui\/[A-Za-z0-9_]+|icon\/[A-Za-z0-9_]+|fx\/[A-Za-z]+\/\d+|avatar\/(se|sw)\/[a-z]+\/\d+|pet\/cat\/[a-z]+\/\d+|puzzle\/[a-z]+\/[A-Za-z0-9_]+|mat\/[A-Za-z0-9_]+)$/;

export function isValidKey(key: string): boolean {
  return KEY_RE.test(key);
}

let current: ArtManifest = { version: 1, frames: {} };

/** Installs the loaded manifest (AI-1's asset loader calls this after an atlas group arrives). */
export function setManifest(m: ArtManifest): void {
  current = m;
}

/** Merges frames of one atlas group into the manifest. */
export function addFrames(frames: readonly FrameRef[]): void {
  const next: Record<string, FrameRef> = { ...current.frames };
  for (const f of frames) next[f.key] = f;
  current = { version: 1, frames: next };
}

export function frame(key: string): FrameRef | undefined {
  return current.frames[key];
}

export function frameCount(): number {
  return Object.keys(current.frames).length;
}

/** Snaps a game-px coordinate to the art pixel grid. */
export function snap(v: number): number {
  return Math.round(v / ART_PX) * ART_PX;
}
