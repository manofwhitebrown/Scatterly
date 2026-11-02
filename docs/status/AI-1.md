# AI-1 Foundation status

## Done
- Build setup: package.json (+ package-lock.json), tsconfig, vite.config.ts, capacitor.config.ts, index.html, .gitignore
- src/shared/types.ts (verbatim contract), src/main.ts, src/core/{BootScene,save,perf}.ts
- Workflows: pages.yml, android.yml (APK + rolling `latest` release); scripts/size-check.mjs; public/icon.svg; README
- Verified with stub modules for the other AIs: `tsc --noEmit`, `vitest run`, `vite build`, size-check all pass
  (Phaser chunk ~332 KB gzip, so game code has roughly 100 KB gzip of headroom under the 450 KB budget)
- Android patch step tested against a freshly generated `android/` project (idempotent)

## Status
- Merged repo verified: npm ci, npm test (20 pass), npm run build OK; JS 386 KB gzip, dist 1.6 MB (within budget).
- Pages deploy and Android APK workflows green; APK published to the rolling `latest` release.

## Next up
- Only remaining check needs a real device: `?debug=1` fps on a phone

## Notes for AI-2
- `package-lock.json` is committed (needed for `npm ci`). Add `tests/logic.test.ts`: `npm test` fails if no test file exists.

## Notes for AI-3
- Room scene key must be `SCENE.Room`: perf.ts hooks its `start` event for fps auto-detect.
- Read low-fx with `isLowFx(this.game)` from `src/core/perf.ts`.

## Notes for AI-4
- `generateAllTextures` may be called again on Boot "Retry": skip textures that already exist (`scene.textures.exists(key)`).
- `sfx.startMusic()` is called at boot before any user gesture: it must be safe (no throw) and defer until `unlock()`.
- Barrels must exist at `src/art/index.ts`, `src/audio/sfx.ts`, `src/puzzles/index.ts`, `src/organise/index.ts`.

# Phase 3 (AI-1: Platform and Puzzle Scenes)

## Phase 0 contract v3: done (one commit)
- `src/shared/types.ts`: SAVE_VERSION 3, `ISO`, `IsoPlacement`, `Door`, `RoomLayout`, `HouseSlot`, `PUZZLE_KINDS` (19) + derived `PuzzleKind`, `PUZZLE_SCENE` for all kinds, `SCENE.House`, `Spot.iso` + `Spot.lockable`, `Gate.needs`, `Clue.facts` (`ClueFact`), `DecorDef.iso`, `RunResult.puzzleLog`, `PlayerProfile.version 3` + `puzzles` (`PuzzleStat`), `PuzzleLaunchData.notes`, `tex.isoSpot/isoShell/isoProp`.
- `src/core/save.ts`: v2 -> v3 migration (`puzzles` validated per known kind). Tests in tests/save.test.ts (v1, v2, v3, corrupt, null, future).
- `src/puzzles/manifest.ts` `IMPLEMENTED` = untangle, sort, word. `src/core/flags.ts` (`?view=iso`, default old). `tests/contract.test.ts`.
- `scripts/secret-scan.mjs` + CI step + `npm run secret-scan`. Size budget raised to 520 KB (fail stays 600).

### Minimum lines touched outside my folders (Phase 0 exception, to keep tsc green)
- src/content/house.ts: `LOCKABLE_KINDS`, placeholder `isoFromBox()` (iso derived from old pixel box), Spot gets `iso` + `lockable`.
- src/content/decor.ts: `iso` on DecorDef helpers and storage Spots, `lockable` on storage Spots.
- src/logic/generator.ts: `GATE_KINDS` is `Partial<Record<...>>`. src/logic/session.ts: `GATE_MSGS` Partial with a default message, `puzzleLog: []` in the RunResult.
- src/scenes/RoomPuzzle.ts: `notes: []` in launch data (AI-3/AI-1 fill real notes later).
- tests/logic.test.ts, tests/logic.fuzz.test.ts: version 3, `puzzles: {}`, `puzzleLog: []`.

## Verified (real output, local, Node 22)
- `node scripts/secret-scan.mjs`: `secret-scan: clean`
- `npx tsc --noEmit`: no errors
- `npx vitest run`: 6 files, 55 tests passed
- `npm run build`: Total JS gzip 391.6 KB (budget 520.0, limit 600.0), dist 1629.1 KB

## Not verified
- Playwright e2e (needs CI; not run locally). Phone fps. Node 20 specifically (local is Node 22).

## Requests
- AI-2: replace `isoFromBox` placeholders with real `LAYOUTS`/iso data; move generators into `src/logic/puzzles/`; `GATE_KINDS` is now Partial, extend it for new kinds.
- AI-3: `PuzzleLaunchData.notes` is `[]` for now: pass discovered clues from the session.

## Deliverable 2: PuzzleShell framework (done, scenes not yet migrated)
- `src/puzzles/PuzzleShell.ts` rewritten: title, difficulty marks (filled vs outlined, not colour only), Hint / Notes / Skip buttons 200x96 along the bottom, close button 96x96, Skip asks to confirm and counts as a hint, `playFx('puzzleOk')` on success, elapsed ms excludes time the page was hidden, shutdown removes the visibilitychange listener and timers.
- `src/puzzles/PuzzleNotes.ts`: notes drawer (clues + facts as outlined chips, 28 px text), auto-open for `code`.
- Scenes override `hintLine()` (to return `PUZZLES[kind].hint(...)`) and `e2eSolve()`; under `?e2e=1` the scene exposes `__e2e = { autoSolve, hint, skip(confirm) }`.
- Contract: `PuzzleResult.hints?: number` added (optional, non-breaking).
- Existing scenes (untangle, sort, word) still use 22-26 px hint lines: they move to the registry and 28 px text when AI-2's generators land.

## Tier 1 scenes
- `code` DONE (src/puzzles/CodeScene.ts, 134 lines): 5x2 digit keys + Back/Enter, all 96 px tall, sits left of the notes drawer; facts come from `notes[].facts` via `PUZZLES.code.generate(seed, d, { facts })`; wrong code shows "X Not the code (n)" and a shake (skipped under reducedMotion); `hintLine()` uses `PUZZLES.code.hint`; `e2eSolve()` types the reference answer through `press`/`enter`. Added to `IMPLEMENTED`.
- Next: target, sequence, lights, slide, pipes, mastermind, memory.
- Not verified: how it looks/plays in a browser (no Playwright browser available locally; CI e2e will be the first run).

## Requests (new)
- AI-3: `RoomGate.done` should add `r.hints ?? 0` to the session hint count (Skip already counts) and pass discovered clues as `notes` in `puzzleLaunchData`; record `puzzleLog` entries.
- AI-2: still waiting for `src/logic/puzzles/index.ts` (PUZZLES registry) and `src/content/puzzleRoster.ts`; Tier 1 scenes start the moment the stub lands.

## Integration log
(none yet)
