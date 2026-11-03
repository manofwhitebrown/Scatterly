# AI-2 status (Phase 5: logic, content, world layout, case builder)

## Done
- Roster: `ENABLED` equals `IMPLEMENTED` (11 kinds). Spot cap: MAX_SPOTS_PER_ROOM = 12 enforced by progression (house spots 9-12 per room).
- World layout v2: `src/content/world.ts` (ROOM_SIZE, HOUSE_MAP_V2, WORLD_DOORS, STAIRS, worldDoorCell), `worldGrid.ts` (walkGrid incl. props+spots+stairs).
- Decor: `worldKinds.ts` (footprints/flags per prop kind), `worldPropsA.ts` (entrance, living, kitchen), `worldPropsB.ts` (bathroom, bedroom, study),
  `worldProps.ts` (resolver, doorSpans, FRONT_DOOR). 26-40 pieces per room incl. onTop items and wall mounts; windows per room; one theme line per room.
- Study: 10 new spots (study.bookshelfL, cabinet, drawerL, desk, drawerR, bookshelfR, papers, basket, sofa, bin), positions in layoutSpots.ts.
- Geometry change: entrance|living door moved to row 2 (row 4 clashed with an entrance spot); staircase is in the back-right corner (x10-11, y0-2).
- Sizes (w x d): entrance 8x9, living 12x9, kitchen 10x9, bathroom 8x9, bedroom 12x9, study 10x9.

## Verified
- `npm test`: 42 files, 386 tests passed. `npx tsc --noEmit` clean. `npm run secret-scan` clean. `npm run build` ok.
- `tests/logic.worldprops.test.ts`: per room: 25-40 pieces, in bounds, no overlaps (props, spots, storage slots, stairs), back-wall facing rule,
  seats face a table/desk/TV, onTop inside parent, mounts/windows/doors never overlap, floor connected, every spot reachable.

## Not verified
- `npm run verify` (e2e smoke) and `npm run shots` not run. Fairness 3 modes x 3 profiles not run separately (existing 5000-seed test passes with study spots).
- Study has no templates, clues or evening steps yet, so no case starts there; its spots hold items only when another template reaches it.

## Requests
- AI-3: use `ROOM_SIZE`/`HOUSE_MAP_V2` from src/content/world.ts (your homeWorld.ts sizes 6x6.. are smaller). Door cells: left room (w-1, at), right room (0, at).
  Decor via `WORLD_DECOR[room]`: props [kind, gx, gy, rot, id?, onTop?], mounts [kind, wall L|R, t, base h], windows, `doorSpans(room)`.
- AI-4: kind names used are listed in `PROP_KINDS` (worldKinds.ts); all appear in ASSET-LIST except `desk_lamp`, `lampWall`, `kitchenCabinetUpper`, `hangingPlant` placement notes: please confirm.
- AI-1: LAYOUTS.study is still a stub (8x8, no doors); legacy path.ts cannot route in study yet. At Gate B HOUSE_MAP_V2 replaces HOUSE_MAP.

## Next
1. Study templates/clues/evening steps/lockable check; path on world grids (path.ts).
2. Case builder (30 min), session sim, snapshot, puzzle levels and hints.
