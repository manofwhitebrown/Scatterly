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

### Done
- `src/logic/puzzles/`: framework (`types.ts`: `PuzzleDef`, `Fact`, `PuzzleCtx`) + the 8 Tier-1 generators: `code` (clue-fact maths), `target`, `sequence`, `lights`, `slide`, `pipes`, `mastermind`, `memory`. Each has generate / check / solve / hint / parSeconds. Registry in `index.ts` (`PUZZLES`, `PuzzleTypes`, `LogicPuzzleKind`, `feedback`).
- `tests/puzzles/puzzles.test.ts`: per kind x 3 difficulties: generate -> solve -> check true, wrong answers false, deterministic, hints non-empty, generate p99 <= 10 ms, par grows with difficulty; kind-specific rules (code 3-4 digit positive, target not pre-present, sequence 4 distinct options, lights min presses >= 3, slide depth ranges 8-10 / 11-14 / 15-18, mastermind solver cracks within cap, memory no repeats).

### Verified (commands run)
- `PUZZLE_SEEDS=2000 npx vitest run tests/puzzles` -> 40 passed (2000 seeds x 3 difficulties x 8 kinds), 21.7 s.
- `npm test` -> 6 files, 86 tests passed (default 300 seeds, tests ~12 s). `npx tsc --noEmit` clean. `npm run build` OK, JS 391.1 KB gzip (unchanged: logic/puzzles is not imported by the app yet).

### Not verified / not done yet
- Waiting for AI-1's contract v3 (SAVE_VERSION is still 2, no PuzzleKind v3, no Spot.iso). So NOT done: `PuzzleTypes` keyed by the shared `PuzzleKind`, untangle/sort/word moved into the registry, `src/content/puzzleRoster.ts` (ENABLED), `src/content/layout.ts` (LAYOUTS, HOUSE_MAP, iso per spot), Scenario v3 gates, clue facts (Clue.facts), progression/achievements, balance sim, fuzz extension. Tier 2 kinds not started (after parity gate).
- Median ideal-bot time per difficulty (G9) not measured yet; only `parSeconds` is set (code 18/35/65, target 18/40/75, sequence 12/25/45, lights 20/40/70, slide 25/45/80, pipes 25/45/80, mastermind 25/50/80, memory 12/25/45).

### Notes for AI-1/3/4 (puzzle API, additions only)
- `import { PUZZLES } from 'src/logic/puzzles'`; `PUZZLES[kind].generate(seed, difficulty, ctx?)`. Specs are plain JSON and contain the solution fields, so scenes must not render them.
- Answer shapes: code `string`; target `Array<{a,b,op}>` (a,b index the growing pool: originals first, each step's result appended; both operands are consumed; ops `+ - * /`, results must be positive integers; solved the moment any result equals `target`); sequence `number` (the chosen option); lights `number[]` (cells pressed, duplicates cancel); slide `number[]` (cells tapped, each must be next to the gap); pipes `number[]` (final rotation 0..3 per cell, clockwise quarter turns from `base`); mastermind `number[][]` (all guesses so far; last one is the secret; length <= `maxAttempts`; use exported `feedback(secret, guess)` for the exact/misplaced pegs); memory `number[]` (whole sequence).
- `code` takes `ctx.facts` (`{key,label,value}[]`); `spec.facts` lists the facts the rule uses (their keys become `Gate.needs`); `spec.own` = true means it invented facts (show them on the lock).
- `hint(spec, progress)`: pass how many hints were already shown for this puzzle.
- Tests' `PUZZLE_SEEDS` env raises the seed count (default 300).

### Requests
- AI-1: land contract v3 (see brief section 5) so I can add the shared `PuzzleKind` typing, `Spot.iso/lockable`, `Clue.facts`, `Gate.needs`, `RunResult.puzzleLog`, `PlayerProfile.puzzles`.
