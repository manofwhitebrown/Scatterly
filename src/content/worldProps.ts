import type { Rot } from './worldKinds';
import { footprint } from './worldKinds';
import { KITCHEN, LIVING, ENTRANCE } from './worldPropsA';
import { BATHROOM, BEDROOM, STUDY } from './worldPropsB';
import { WORLD_DOORS } from './world';
import type { WorldRoom } from './world';

export type FloorProp = readonly [kind: string, gx: number, gy: number, rot: Rot, id?: string, onTop?: string];
export type Mount = readonly [kind: string, wall: 'L' | 'R', t: number, h: number];
export interface WindowDef { wall: 'L' | 'R'; t: number; w: number }
export interface WorldRoomDecor { theme: string; props: FloorProp[]; mounts: Mount[]; windows: WindowDef[] }

export const WORLD_DECOR: Record<WorldRoom, WorldRoomDecor> = {
  entrance: ENTRANCE, living: LIVING, kitchen: KITCHEN, bathroom: BATHROOM, bedroom: BEDROOM, study: STUDY,
};

/** The front door: on the entrance's left back wall (gx = 0), leading outside. */
export const FRONT_DOOR = { room: 'entrance' as WorldRoom, wall: 'L' as const, t: 5 };

export interface WorldProp { id: string; kind: string; room: WorldRoom; gx: number; gy: number; rot: Rot; onTop?: string }

/** Resolved decor props of a room with stable ids (explicit id, else `kind_index`). */
export function worldProps(room: WorldRoom): WorldProp[] {
  return WORLD_DECOR[room].props.map((p, i) => {
    const [kind, gx, gy, rot, id, onTop] = p;
    const out: WorldProp = { id: id ? id : `${kind}_${i}`, kind, room, gx, gy, rot };
    if (onTop) out.onTop = onTop;
    return out;
  });
}

/** Door spans on a room's walls: every right-hand room has its partition door on the left wall; the entrance also has the front door. */
export function doorSpans(room: WorldRoom): Array<{ wall: 'L' | 'R'; t: number }> {
  const out: Array<{ wall: 'L' | 'R'; t: number }> = [];
  for (const d of WORLD_DOORS) if (d.b === room) out.push({ wall: 'L', t: d.at });
  if (room === FRONT_DOOR.room) out.push({ wall: FRONT_DOOR.wall, t: FRONT_DOOR.t });
  return out;
}

/** Floor footprints that block walking: tall floor props that are not on top of something. */
export function blockingProps(room: WorldRoom): Array<{ gx: number; gy: number; w: number; d: number; h: number }> {
  return worldProps(room).filter((p) => !p.onTop).map((p) => footprint(p.kind, p.gx, p.gy, p.rot)).filter((f) => f.h > 1);
}
