import type { SpotId } from '../shared/types';

/** Next piece to shimmer: cycles through the unopened ones so every piece gets its turn. Pure. */
export function nextShimmer(ids: readonly SpotId[], last: SpotId | null): SpotId | null {
  if (ids.length === 0) return null;
  const i = last === null ? -1 : ids.indexOf(last);
  return ids[(i + 1) % ids.length] ?? null;
}
