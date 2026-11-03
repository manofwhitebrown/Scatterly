import type { ReplayStep } from '../logic/replay';
import type { RoomId } from '../shared/types';

export interface Pt { x: number; y: number }
export interface Beat { step: ReplayStep; atMs: number; walkMs: number; to: Pt; from: Pt | null }

const WALK_MS = 600;

/**
 * Turns replay steps into timed avatar beats over a room-centre map. The first beat has no `from` (the avatar
 * appears at the door); a room change walks for at most WALK_MS, a same-room step is a short hop. Pure.
 */
export function planBeats(steps: readonly ReplayStep[], centre: Record<RoomId, Pt>): Beat[] {
  const out: Beat[] = [];
  let prev: Pt | null = null;
  for (const step of steps) {
    const to = centre[step.room];
    out.push({ step, atMs: Math.round(step.t * 1000), walkMs: prev === null ? 0 : prev.x === to.x && prev.y === to.y ? 0 : WALK_MS, to, from: prev });
    prev = to;
  }
  return out;
}

/** Items the player recovered, in the order the evening put them down. */
export function foundBeats(beats: readonly Beat[]): Beat[] {
  return beats.filter((b) => b.step.found === true);
}
