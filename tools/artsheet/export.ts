// Dumps the world decor layout (rooms, props with footprints, mounts, windows, doors) as JSON for tools/artsheet/sheet.py. Run: vite-node tools/artsheet/export.ts
import { ROOM_SIZE } from '../../src/content/world';
import type { WorldRoom } from '../../src/content/world';
import { PROP_KINDS, footprint } from '../../src/content/worldKinds';
import { WORLD_DECOR, doorSpans, worldProps } from '../../src/content/worldProps';

const out: Record<string, unknown> = {};
for (const room of Object.keys(ROOM_SIZE) as WorldRoom[]) {
  const props = worldProps(room).filter((p) => PROP_KINDS[p.kind] && !PROP_KINDS[p.kind]?.mount).map((p) => {
    const f = footprint(p.kind, p.gx, p.gy, p.rot);
    return { ...p, w: f.w, d: f.d, h: f.h, flat: !!PROP_KINDS[p.kind]?.flat };
  });
  const d = WORLD_DECOR[room];
  out[room] = { size: ROOM_SIZE[room], props, mounts: d.mounts, windows: d.windows, doors: doorSpans(room) };
}
process.stdout.write(JSON.stringify(out));
