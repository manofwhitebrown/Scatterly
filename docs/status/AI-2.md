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
