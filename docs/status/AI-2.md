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
- `npm test`: 45 files, 400 tests passed. `npx tsc --noEmit` clean. `npm run secret-scan` clean. `npm run build` ok.
- `tests/logic.worldprops.test.ts`: per room: 25-40 pieces, in bounds, no overlaps (props, spots, storage slots, stairs), back-wall facing rule,
  seats face a table/desk/TV, onTop inside parent, mounts/windows/doors never overlap, floor connected, every spot reachable.

- Study content: `src/content/templatesC.ts` (2 templates: late-paperwork, reading-spree; clues, evening steps, `needs: ['study']`); 20 templates total. Progression now unlocks the study at day 12 (ROOM_UNLOCK_DAY) alongside the bathroom at day 6. Study lockable spots: cabinet, drawerL, drawerR (by kind).
- tests/logic.study.test.ts: 400 seeds with study unlocked are valid and solvable, items land in the study, none before unlock, day-12 unlock via applyRun.
- tests/puzzles/sudoku.test.ts: p99 generation bound 10 ms -> 40 ms (flaked under parallel load; passes alone at ~1 ms).

## Overlap analysis (manager order 1)
- Cell footprints are correct and tested: same-floor rooms never overlap; each upper room sits exactly on the room below (new test).
- The on-screen overlap is projection, not layout: floor 1 is raised 72 art px = 9 tiles of (gx+gy). An upper tile with global sum U hides the ground tile with sum U-9, so the back half of each 9-deep ground room is covered.
- Fix needs a set-back, not a footprint change: give floor-1 slots wx,wy offset (-k,-k) (pure vertical screen shift of 16k art px). k=6 clears the interior, e.g. bedroom wx=2,wy=-6; bathroom -6,-6; study 14,-6. Shared walls and the stair alignment hold (all upper rooms share the offset). Not applied: needs the manager's/AI-3's OK since it changes total house height (~386 art px, overview zoom).

## Not verified
- `npm run verify` (e2e smoke) and `npm run shots` not run. Fairness 3 modes x 3 profiles not run separately (existing 5000-seed test passes with study spots).
- Study templates only fire from day 12 or with the study unlocked in the profile; no gate-heavy study case tested beyond the 400-seed validity run.

## Requests
- AI-3: use `ROOM_SIZE`/`HOUSE_MAP_V2` from src/content/world.ts (your homeWorld.ts sizes 6x6.. are smaller). Door cells: left room (w-1, at), right room (0, at).
  Decor via `WORLD_DECOR[room]`: props [kind, gx, gy, rot, id?, onTop?], mounts [kind, wall L|R, t, base h], windows, `doorSpans(room)`.
- AI-4: every kind in `PROP_KINDS` (worldKinds.ts) appears in ASSET-LIST.md (checked by script). Footprints/heights there are my layout estimates: tell me if a model needs another size.
- AI-1: LAYOUTS.study is still a stub (8x8, no doors); legacy path.ts cannot route in study yet. At Gate B HOUSE_MAP_V2 replaces HOUSE_MAP.

## Next
1. Path on world grids (path.ts), blocked/unreachable tests.
2. Case builder (30 min), session sim, snapshot, puzzle levels and hints.
