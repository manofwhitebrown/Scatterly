import { HOUSE } from '../content/house';
import { WORLD_ROOMS } from '../content/world';
import { worldProps } from '../content/worldProps';

export interface ArtStats { propsWith: number; propsTotal: number; spotsWith: number; spotsTotal: number }

/** How many decor kinds have a `prop/<kind>` frame and how many spot kinds have a `spot/<kind>/closed` frame. Pure; `has` is `hasFrame`. */
export function artStats(has: (key: string) => boolean): ArtStats {
  const props = new Set<string>();
  for (const r of WORLD_ROOMS) for (const p of worldProps(r)) props.add(p.kind);
  const spots = new Set<string>(HOUSE.map((s) => s.kind));
  return {
    propsWith: [...props].filter((k) => has(`prop/${k}`)).length, propsTotal: props.size,
    spotsWith: [...spots].filter((k) => has(`spot/${k}/closed`)).length, spotsTotal: spots.size,
  };
}

export const artStatsText = (s: ArtStats): string => `props with art: ${s.propsWith}/${s.propsTotal}   spots with art: ${s.spotsWith}/${s.spotsTotal}`;

/** True when a decor tap should trigger the one-off "Show tappables" outline: 3 decor taps with no piece opened in between. */
export function needsHint(decorTaps: number, shownAlready: boolean): boolean { return !shownAlready && decorTaps >= 3; }
