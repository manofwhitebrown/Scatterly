# AI-1 status: Platform, Assets, Puzzle Scenes, Integrator

## Phase 3 (kept, one paragraph)
Contract v3, PuzzleShell, 11 puzzle scenes (Tier 1 complete: untangle, sort, word, code, target, sequence, lights, slide, pipes,
mastermind, memory), puzzle e2e (`tests/e2e/puzzles.e2e.ts`) and game e2e bot verified in real Chromium (software GL, a few fps:
tests must poll, never sleep on game-time timers). Local browser recipe: `@sparticuz/chromium` + git-excluded
`playwright.local.config.ts` with `--no-sandbox --use-gl=angle --use-angle=swiftshader`.

## Phase 4 done
- Part 1: `?view=home` / `?artdebug=1` flags, `src/core/pixel.ts` (`PX`, `snap`, `toGame`), Phaser `pixelArt/antialias:false/roundPixels`,
  `scripts/check-assets.mjs`, CI cost control (path filters, cancel-in-progress, heavy e2e on main only), `docs/DEPLOY.md`.
- Part 2: CONTRACT V4 landed in one commit (Art Bible v1 numbers from AI-4):
  - `ART {px 3, tileArtW 32, tileArtH 16}`, `ISO {96, 48, 12}`; old grid kept as `ISO_LEGACY {64, 32, 16}` for the old iso kit only.
  - `RoomId` = 9 rooms (`ROOM_ORDER`), `LEGACY_ROOMS` (the 5 with content), `ROOM_UNLOCK_DAY` (bathroom 6 as in progression.ts;
    laundry 9, study 12, balcony 16, garden 20 are placeholders: AI-2 owns balance).
  - `HouseSlot` = world placement `{room, floor, wx, wy}`; old dollhouse type renamed `DollhouseSlot` (HOUSE_MAP, houseTiles).
  - `SCENE.Home/Chill/Builder`; `PuzzleKind` +mirror/jigsaw/flow/gears (23) with `PUZZLE_SCENE`; `PuzzleDifficulty` 1-5, `PuzzleRequest.level?`;
    `Gate.chain?`; `PuzzleStat.seen`; `ProfileSettings` (quality, musicVol, sfxVol, ambienceVol, ambience, matchClock, walkAnim, sessionLength);
    profile `builder`, `themes`, `pet`, `chill`, `collection`, `resume`; `ReplayStep` now lives in types (AI-2's superset, re-exported from replay.ts).
  - Save v3 -> v4 in `src/core/save.ts` + new `src/core/saveFields.ts` (field-by-field validators, snapshot size cap 200k chars).

### Minimum edits outside my folders (Phase 0 compile fixes)
- AI-2: `content/layout.ts` (LAYOUTS/PROPS split into `*_PHASE3` + stub entries for the 4 new rooms, `HOUSE_MAP: DollhouseSlot[]`),
  `content/layoutProps.ts` (PROPS stub), `content/items.ts` (ROOM_NAME), `logic/solver.ts` (loop over LEGACY_ROOMS),
  `logic/progression.ts` (`seen:false` in new PuzzleStat), `logic/replay.ts` (re-export ReplayStep), new `logic/snapshot.ts` STUB
  (`SessionSnapshot`; AI-2 owns the real shape and capture/restore).
- AI-3: `ui/theme.ts` (ROOM_LABEL), `ui/Hud.ts`, `scenes/RoomRun.ts`, `organise/OrganiseScene.ts`, `scenes/puzzleBook.ts` (names), room loops now LEGACY_ROOMS.
- AI-4: `art/isoTheme.ts`, `art/rooms.ts` (stub looks), `art/index.ts`, `art/isoShell.ts`, `art/isoCtx.ts`, `art/iso.ts` (ISO -> ISO_LEGACY, LEGACY_ROOMS).
- Tests: contract, save (+7 v3->v4 cases), logic.path, logic.progress, fixtures built from `defaultProfile()`.

## Verified (local, Node 22, real output)
- `npx tsc --noEmit`: 0 errors. `npx vitest run`: 26 files, 243 tests passed (was 233). `npm run build`: JS 429.2 KB gzip (budget 520),
  dist 1741.9 KB. `node scripts/secret-scan.mjs`: clean. `node scripts/check-assets.mjs`: ok (0 asset files).

## Not verified
- CI run of the new workflow, e2e after the contract change (needs CI/browser), G14 crispness test, phone look of `pixelArt: true`, Node 20.

## Requests
- AI-2: publish world layout v2 (`HouseSlot` world cells, doors for laundry/study/balcony/garden) to replace my stub layouts; real `SessionSnapshot` in
  `logic/snapshot.ts`; review `ROOM_UNLOCK_DAY`; `PUZZLES` generators for the 4 new kinds when scenes exist.
- AI-3: `Home` scene must use `ISO`/`ART`, never `ISO_LEGACY`; dollhouse code keeps `DollhouseSlot`.
- AI-4: `check-assets.mjs` will read `docs/art/LICENSES.md` (first column name, last column covered paths) in my next push.
- Owner: Kenney zip is already used by AI-4; still need the three reference images only if you want them in the repo (not required).

## Next
G14 pixel test, `src/core/assets.ts` + `scripts/pack-atlas.mjs`, quality tiers, slice gallery CI + artdebug scene, Tier 2 puzzle scenes.

## Integration log
(none yet)
