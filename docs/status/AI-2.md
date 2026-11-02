# AI-2 Brain status

## Done
- src/logic: rng, evening (simulator), clues, generator, validator, solver, session, progression, index
- src/content: house (55 spots), items, decor (15), templates (18, split into templatesA/B + templateKit), phrases
- tests/logic.test.ts: determinism, 400 seeds x 3 modes x 3 profiles valid + solvable, spatial rules, session, stars/coins, immutability, perf
- Locally: tsc strict + noUncheckedIndexedAccess clean, 20/20 tests pass, ~0.3ms per scenario, 0 fallbacks

## Design notes
- Item locations are derived from the last evening step touching them (validator re-checks this).
- Difficulty 1 names spots in clue text; 2+ uses oblique hints (content/phrases.ts IMPLY).
- parSearches = ideal chain length + 2. Stars: 3 needs <= par*1.25 and 0 hints.
- Extra exports (not in index): fallbackScenario, validateScenario, solveScenario, simulateEvening, anySpot (content/decor).

## Phase 2 progress
- Marks: `setMark(spotId, mark|null): boolean`, `cycleMark(spotId)`, `marks()`, `on('mark')` (payload `{spotId, mark}`). Searching clears the mark. Tests added.
- `habitHits()` implemented. `spotsIn(room)` now cached per room (do not mutate the returned array).
- `SpotMark` now comes from shared types (Contract v2 landed).

- Fuzz: tests/logic.fuzz.test.ts (random inspect/take/solveGate/hint/marks/finish incl. bogus ids and duplicates): invariants hold, no throws.

## Requests
- AI-1: land Contract v2 (SAVE_VERSION 2, ProfileStats, PlayerProfile v2 fields, RunResult habitHits/newAchievements, SCENE.Journal, tex.mark/fx) plus save migration. Week plan, stats and achievements wiring in `applyRun` are blocked on it.

## Next up
- Cross-check AI-3/AI-4 usage of logic API once pushed; fix anything they flag.

## Notes for AI-3
- Marks: `session.cycleMark(id)` on long-press or mark button; render from `session.marks()`; listen with `on('mark')`.
- `session.habitHits()` after the run for the Result screen.
- `session.inspect` counts a search only when a spot first opens (locked attempts are free). After the puzzle, call `solveGate(spotId, skipped)` then `inspect` again.
- Hint results: first call returns room only, second adds spotId. `hint()` returns null once all targets are found.
- Storage decor spots exist only if owned; use `session.spotsIn(room)` to render, not HOUSE.
- Habit sticky notes have clue id `habit-<item>` if you want to style them.

## Notes for AI-4
- Cosmetic decor ids were chosen to hit your keyword drawings (plantHerbs, lampLights, shelfTowels, rugBathMat, curtains, clock, mirror).
- Storage spot labels: 'Key hook', 'Wallet bowl', 'Shoe bench', 'Bag hook', 'Pegged coat', 'Charging dock', 'Catch-all tray'.
- Word gate: payload = answer word (uppercase), context = riddle. Untangle payload 'cables'; sort payload 'colour'.

## Phase 3 (AI-2: Logic, Content and Puzzle Generators)

### Done (pushed)
- `src/logic/puzzles/`: framework (`types.ts`) + 11 pure generators with generate / check / solve / hint / parSeconds: Tier 1 `code`, `target`, `sequence`, `lights`, `slide`, `pipes`, `mastermind`, `memory`, plus the three existing kinds ported to pure logic: `untangle`, `sort`, `word` (same rules as the scenes; scenes do not use them yet, AI-1 adopts them). Registry `PUZZLES` + `PuzzleTypes` in `index.ts`.
- `src/content/puzzleRoster.ts`: `ENABLED = ['untangle','sort','word']` (kinds with generator AND scene). `tests/puzzles/roster.test.ts` enforces ENABLED is a subset of `IMPLEMENTED` and of the registry.
- `src/content/layout.ts` (+ `layoutSpots.ts`, `layoutProps.ts`): `LAYOUTS` (5 rooms, 8x8 to 10x8, doors for entrance-living, living-kitchen, living-bedroom (stairs), bedroom-bathroom, windows), `HOUSE_MAP`, `KIND_FOOT`, `spotIso`, `DECOR_ISO`, `PROPS` (6 per room), hand-placed iso for all 55 spots + 7 storage slots + 8 cosmetic decor. `house.ts`/`decor.ts` now take `iso` from it (isoFromBox removed). No spot or decor id changed.
- Tests: `tests/puzzles/puzzles.test.ts` (per kind x 3 difficulties), `tests/puzzles/roster.test.ts`, `tests/logic.layout.test.ts` (29 tests: ids/footprints, bounds, no overlaps incl. all storage owned, wall mounts touch a wall, doors/windows clear, free floor connected, free neighbour per spot, door symmetry, HOUSE_MAP).

### Verified (commands run)
- `PUZZLE_SEEDS=2000 npx vitest run tests/puzzles` -> 58 passed (2000 seeds x 3 difficulties x 11 kinds incl. generate -> solve -> check, wrong answers rejected, determinism, generate p99 <= 10 ms). A real bug was caught and fixed on the way (untangle jitter could remove the crossings after they were counted).
- Layout mutation check: moving the TV onto the sideboard, and the bedroom wardrobe in front of the door, makes the tests fail as expected; restored.
- `npm test` / `npm run build` green before push (see Integration log in AI-1.md).

### Not verified / not done yet
- Layout vs art footprints (AI-4 review) and layout look on screen: not seen rendered. Positions are by hand, only checked by the geometric tests.
- G10 note: Entrance has 11 house spots + 5 storage decor = 16 interactive pieces once everything is bought (brief says 8-14). Ids may not change, so I kept it; owner decides whether to cap storage purchases in the entrance.
- Median ideal-bot time per difficulty (G9) not measured yet; `parSeconds` is set (code 18/35/65, target 18/40/75, sequence 12/25/45, lights 20/40/70, slide 25/45/80, pipes 25/45/80, mastermind 25/50/80, memory 12/25/45, untangle 15/35/70, sort 14/25/50, word 12/25/50).
- Still to do, in order: Scenario v3 (gate density, `lockable` only, 40% padlocked, day-1 guided), clue `facts` + `needs` + template growth (18 -> ~28), validator/solver for code locks, `applyRun` puzzleLog + ACHIEVEMENTS, balance sim (tests/sim), fuzz extension to 5000 seeds, then Tier 2 kinds after the parity gate.

### Layout conventions (for AI-3 / AI-4)
- gx runs along the RIGHT wall (plane gy = 0), gy along the LEFT wall (plane gx = 0); cell (0,0) is the back corner; front/open edges are gx = cols and gy = rows. Door/window `at`: wall 'right' -> gx, wall 'left' -> gy. Door entry cell = (at,0) on the right wall, (0,at) on the left wall; always free floor.
- Footprints come only from `KIND_FOOT[kind]` (w along gx, d along gy, h in height units, `gz` for wall mounts: jacket, keyHook, charger). No rotation: every kind is drawn with its long side along gx. `WALL_H` = 10, windows occupy heights 3..8 (`WINDOW_Z`).
- A piece blocks walking if gz = 0 and h > 1 (rugs, mats, runners and shoe racks are walk-over). `PROPS[room]` entries have `kind: PropKind`; `lampHang` is the only prop with gz > 0 that is not on a wall.
- Dollhouse: `HOUSE_MAP`: ground floor entrance(col0), living(col1), kitchen(col2); upper floor bedroom(col1, above living), bathroom(col2, above kitchen).

### Notes for AI-1/3/4 (puzzle API, additions only)
- `import { PUZZLES } from 'src/logic/puzzles'`; `PUZZLES[kind].generate(seed, difficulty, ctx?)`; `ctx` = `{ facts?, payload?, context? }` (payload/context = Gate fields, used by word and untangle). Specs are plain JSON and contain solution fields, so scenes must not render them.
- Answer shapes: code `string`; target `Array<{a,b,op}>` (a,b index the growing pool: originals first, each step's result appended; both operands consumed; ops `+ - * /`; results positive integers; solved when any result equals `target`); sequence `number` (the chosen option); lights `number[]` (cells pressed, duplicates cancel); slide `number[]` (cells tapped, each next to the gap); pipes `number[]` (final rotation 0..3 per cell); mastermind `number[][]` (all guesses so far, last = secret, count <= `maxAttempts`; `feedback(secret, guess)` gives exact/misplaced); memory `number[]` (whole sequence); untangle `Array<[x,y]>` normalised 0..1 per node (solved = `crossings(spec.edges, pts) === 0`, helper exported); sort `number[]` (bin index per piece in spec order); word `string` (anagrams of list words also accepted unless `spec.custom`).
- `code`: `spec.facts` lists the facts the rule uses (their keys become `Gate.needs`); `spec.own` true = it invented facts (show them on the lock).
- `hint(spec, progress)`: pass how many hints were already shown for this puzzle.
- Tests: env `PUZZLE_SEEDS` raises the seed count (default 300).

### Requests
- AI-1: when you adopt the logic generators in the scenes, add the kinds to `IMPLEMENTED` and tell me; I then add them to `ENABLED`.
- AI-4: please review `KIND_FOOT`/`PROPS` against your iso art footprints (a kind whose art needs a different footprint: tell me the numbers and I change the data, the tests will tell if it still fits).
