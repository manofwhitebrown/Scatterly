# AI-2 Phase 6 log (newest first)

## Phase 6, unit 3: case length
- Measured before (casual bot, 30 seeds, Standard): day 5 18.8 min, day 8 20.7, day 12 18.8. After: day 5 27.0, day 8 29.3, day 12 27.6 (window 25-35). The window test is a plain `it` now.
- Why it was short: 8-12 gates existed, but the fairness rule (at most one gate on any clue path) leaves only 1-4 gates on the path; the rest are decoys the bot never opens. So the fix is depth on the path, not more gates: chains per case 6-7 (was 2-3; 7-8 at 45 min), 2 extra stages per compound gate from 20 min (was 45), finale depth 2 from 25 min (was 30), and code locks may be compound (`addChains` no longer skips them). Path gates are chosen before decoys (`pathFirst`).
- The finale is now marked by `FINALE_CONTEXT` (gates.ts) so `hasFinale` stays exact now that other code locks can chain.
- Time model (`tests/sim/session.ts`) is unchanged.
- Other medians (Standard): day 1 1.6, day 2 1.8, day 3 12.7, day 4 21.8. Short day 5 about 12, Long day 5 about 35. Day 2 is NOT about 15 as the brief asks: days 1-2 stay the classic generator because an existing test protects them as the gentle onboarding; I did not change that.
- Honest caveats: the spread is wide (min about 11, max about 57 min at day 8 in 30 seeds), so some mornings run long. Levels 4-5 are not in play (Gate has no level field), so this window is reached with levels 1-3 only; levels would add margin or let chains be shorter. The bot follows clues 85% of the time and the time model is an assumption, not a measurement of real players.
- Tests changed to the new contract: chains 5-7 in logic.case.test.ts, caseSpec 6-7 chains, validator chain cap uses the spec.

## Phase 6, unit 2: puzzle levels 1-5
- Done: generators for target, sequence, lights, slide, pipes, mastermind, memory, untangle, word and code accept `PuzzleDifficulty` 1-5; `parSeconds` is non-decreasing per level; `tests/puzzles/levels.test.ts` generates seeds 1-40 at every level for all 11 kinds, solves, and checks.
- Mastermind: generate now rejects secrets the reference solver cannot crack inside `maxAttempts`, so every level is provably winnable.
- Scenes (8 of 11) read `this.level` = `req.level ?? req.difficulty`; the shell shows 5 difficulty marks.
- Not wired: sort, word and untangle scenes build their own puzzle inside the scene (they do not use the shared generators), so they still play at difficulty 1-3. Word and untangle logic has L4/L5 tables that the scenes do not use yet. Sort and code have no harder variant beyond L3 parameters.
- Not wired: nothing assigns a level above 3 in a real case yet.

## Phase 6, unit 1: hint ladder
- `src/logic/puzzles/ladder.ts`: hint(spec, progress, step) with step 0 nudge, 1 rule, 2 reveal; `ahaLine(kind)` for the result screen. Scenes use `hintArgs()`.

## Requests (Phase 6)
- AI-1 (src/shared/types.ts, additive): `Gate.level?: PuzzleDifficulty`. Until it exists, levels 4-5 cannot be carried by a gate.
- AI-3 (src/scenes/RoomPuzzle.ts): pass `level: gate.level` into the PuzzleRequest once the field exists.
- AI-3/AI-1: show `ahaLine(kind)` on the puzzle result screen (exported from src/logic/puzzles).

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
- `npm test`: 47 files, 420 tests passed. `npx tsc --noEmit` clean. `npm run secret-scan` clean. `npm run build` ok.
- `tests/logic.worldprops.test.ts`: per room: 25-40 pieces, in bounds, no overlaps (props, spots, storage slots, stairs), back-wall facing rule,
  seats face a table/desk/TV, onTop inside parent, mounts/windows/doors never overlap, floor connected, every spot reachable.

- Study content: `src/content/templatesC.ts` (2 templates: late-paperwork, reading-spree; clues, evening steps, `needs: ['study']`); 20 templates total. Progression now unlocks the study at day 12 (ROOM_UNLOCK_DAY) alongside the bathroom at day 6. Study lockable spots: cabinet, drawerL, drawerR (by kind).
- tests/logic.study.test.ts: 400 seeds with study unlocked are valid and solvable, items land in the study, none before unlock, day-12 unlock via applyRun.
- tests/puzzles/sudoku.test.ts: p99 generation bound 10 ms -> 40 ms (flaked under parallel load; passes alone at ~1 ms).

- Path on world grids: `src/logic/worldPath.ts` (`worldPathTo`, `worldPathLength`, `worldWalkable`, `worldStandCells`, `worldPathToSpot`, `houseRoute` = legs through doors and the staircase). Legacy `path.ts` untouched until Gate B. `tests/logic.worldpath.test.ts` (9): every house spot of all 6 rooms has stand cells and is reachable; 4-connected/deterministic; out-of-room, fractional, walled-in and cut-room cases return []/-1; every room reaches every room; entrance->kitchen = 2 doors, entrance->study = door, stairs, door.

- Case builder (order 4): `generateCase(seed, mode, profile, {length?})` in generator.ts, spec in `src/logic/caseSpec.ts` (day ramp 8/15/20/25/30 min, short x0.5, long x1.5, days 1-2 ignore length). Days 1-2, Rush, Daily delegate to `generateScenario` unchanged (tested equal). From day 3: 4-5 targets over >=4 rooms (`roomsTouched`), 8-12 locks at 30 min (4-6 at 15), 2-3 compound gates (`Gate.chain`, payload-free second stage), finale = code lock from distinct clues (d3 triple from day 8, else d2) + a second stage (`hasFinale`). Validator: `ValidateOptions{maxGates,maxChained}` + chain rules; solver adds chain par seconds. tests/logic.case.test.ts (12 tests, ~1 s): 120 seeds day 5 valid+solvable, counts, finale >=97%, determinism.
- Measured (100 seeds): day5 standard gates 8-12, chains 2-3, finale 80%->retried to >=97%, decoys 62-82% of locks (only ~5-7 lockable spots can hold a target or clue).

- Session sim (order 5): `tests/sim/session.ts` (casual/expert bot + documented TimeModel: 6 s per room, 4 s per open, 9 s per clue, puzzles 2.4x expert par, 25% retry) and `tests/sim/session.test.ts` (30 seeds per config, ~1 s): bot finishes every case, deterministic, expert < 0.7x casual, time grows day 3<4<5 and short<standard<long (+15%), days 1-2 <= 10/15 min.
- KNOWN GAP, not hidden: the 25-35 min window test is `it.fails` (expected failure, CI green; it turns red when fixed, then make it a plain `it`). Median casual time now: day3 8.7, day4 15, day5 short 8.9 / standard 18.3 / long 24.4 min (targets 20/25/15/30/45). Puzzle time is ~80% of a session (13.7 of 17 min) and only rises with puzzle levels 1-5 (order 7, next); I did not tune the time model to hit the number.
- Found+fixed by the sim: "long" was no longer than "standard" (both capped at 12 locks). Added `chainDepth`/`finaleDepth` to CaseSpec: finale gets 2 extra stages from 30 min, every compound gate 2 at 45 min.

## Overlap fix (applied)
- Cause was projection: floor 1 is raised 72 art px = 9 tiles of (gx+gy), so each 9-deep upper room hid the back half of the ground room below. Fix = set-back k=6 on every floor-1 slot (see Requests). tests/logic.world.test.ts: same-floor rooms never overlap, upper = ground shifted by exactly (-6,-6), and a screen-space check that no upper tile hides a ground tile.
- Legacy iso living `stairsUp` prop is now 1x3 at (1,5) (room is 8 deep); deleted at Gate B anyway.

## Not verified
- `npm run verify` (e2e smoke) and `npm run shots` not run. Fairness 3 modes x 3 profiles not run separately (existing 5000-seed test passes with study spots).
- Study templates only fire from day 12 or with the study unlocked in the profile; no gate-heavy study case tested beyond the 400-seed validity run.

## Requests
- AI-3 (NEW, pushed): upper-floor set-back k=6 applied via `UPPER_SETBACK` in world.ts. HOUSE_MAP_V2 now: entrance (0,0) f0 | living (8,0) f0 | kitchen (20,0) f0 | bathroom (-6,-6) f1 | bedroom (2,-6) f1 | study (14,-6) f1. Local room/prop/spot coords unchanged. Projection check in tests: no upper tile hides a ground tile at k=6. Tell me if k=5 or 7 looks better after you render it.
- AI-4 (NEW, pushed): staircase is 1 wide x 3 deep. STAIRS.footprint = {x:11,y:0,w:1,d:3} (back-right corner against the kitchen partition, bottom step y=2, top y=0, climbs toward -gy). Board cell (11,3), landing in the bedroom (10,0). Moved the living pottedPlant (11,3)->(11,5) to free the board cell. Cut one 1x3 frame; the 2x1 stairwell hole becomes 1x3 too.
- AI-3: use `ROOM_SIZE`/`HOUSE_MAP_V2` from src/content/world.ts (your homeWorld.ts sizes 6x6.. are smaller). Door cells: left room (w-1, at), right room (0, at).
  Decor via `WORLD_DECOR[room]`: props [kind, gx, gy, rot, id?, onTop?], mounts [kind, wall L|R, t, base h], windows, `doorSpans(room)`.
- AI-4: every kind in `PROP_KINDS` (worldKinds.ts) appears in ASSET-LIST.md (checked by script). Footprints/heights there are my layout estimates: tell me if a model needs another size.
- AI-1: LAYOUTS.study is still a stub (8x8, no doors); legacy path.ts cannot route in study yet. At Gate B HOUSE_MAP_V2 replaces HOUSE_MAP.

- AI-1/AI-3 (Gate B): switch Relaxed to `generateCase` (same signature plus `length`; pass nothing, it reads `settings.sessionLength`). Compound gates (`Gate.chain`, 1 extra stage, kinds sequence/lights/slide/pipes/mastermind/memory/target) need the puzzle scene to run the stages in order; until then do not call generateCase from main.
- Limits found: only `interview-prep` has 5 targets, so no 6-target cases (item ids are 8); decoys are a majority (see Measured).

## Next
1. Puzzle levels 1-5 + 3-step hint ladder (closes the session-length gap), then snapshot round trip.
