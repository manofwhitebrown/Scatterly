# AI-1 status: Platform, Assets, Integrator (Phase 5)

## Done
- PLAYTEST 1-2 (manager, 4 Nov): puzzle UI re-skinned. `src/puzzles/ui.ts` = same PAL/makeText/makeButton/panelBox API on the Silkscreen pixel font + theme tokens (chrome colours only; piece colours untouched). Panel 16..704, Hint/Notes/Skip INSIDE it (96 px, y 594), Notes drawer ends above the bar, room dimmed 55% behind (Home stays visible). Shots: all 11 `puzzle-<kind>` over the live Home, new `home-play-sheet` shot (taps Play, asserts Relaxed/Rush/Daily chips), every capture asserts its scene.
- Item 00: dist budget = limit = 2560 KB; size-check now prints boot payload (1819.9 KB, limit 1900) and lazy KB (561) separately; boot over the limit fails the build.
- TO-AI-1 #0: Home is the DEFAULT view (plain URL). `?view=legacy` / `?view=iso` keep the old screens until Gate B. flags.ts, runScene, MenuScene comment, tests/pixel+contract, e2e helpers (`openGame` = legacy, new `openHome`), smoke test "boots to Home", shots (menu = legacy; home-overview = plain URL). Pages and APK now show the house.
- Gate 0: `npm run shots` (playwright.shots.config.ts + tests/shots/shots.spec.ts); each capture asserts its scene first (Home via ?view=home).
- TO-AI-1 #1: shots regenerated on real WebGL; home-overview shows the Home scene (stub boxes, 3 buttons).
- TO-AI-1 #2: `check_fronts.py` is in `npm run verify` (already in package.json).
- TO-AI-1 #4: pixel-crispness e2e CLOSED. Root cause was not Phaser config: this sandbox Chromium had no WebGL with `--use-gl=swiftshader`, so Phaser silently fell back to the Canvas renderer (26x25 px sprite), and the test ran mid camera-fade (colours 102/187 instead of 255). Fix: GL flags `--use-angle=swiftshader --enable-unsafe-swiftshader` in both Playwright configs; test waits for the fade to end, asserts renderer is WebGL, no longer skipped.

- Loader (src/core/assets.ts + assetLoad.ts: groups, retry, fallback, idempotent) and scripts/pack-atlas.mjs already existed; this session added `tests/pack-atlas.test.ts` (deterministic, <=2048, group mapping) and an `outDir` arg to `packDir` so tests never write into public/atlas.
- `tests/e2e/boot.e2e.ts`: records Menu-active time at 1x and 4x CPU throttle (regression ceiling only).
- perf.e2e 50x restart soak fixed (an intro card swallowed the pause tap): now passes.

- CI cost (deliverable 5): ci.yml now runs tsc + check_fronts, PR smoke includes "boots to Home", pixel+boot e2e on main; pages.yml and android.yml skip docs/md/tests/tools-only pushes (shot pushes no longer rebuild the APK). Cancel-in-progress, npm and Playwright caches were already there.

- Puzzle shells (deliverable 6): first-time "How to play" card per kind (`src/puzzles/howto.ts` rules for all 11 implemented kinds, `PuzzleCards.ts`, flag `profile.puzzles[kind].seen` saved via commitProfile, puzzle clock restarts when the card closes); 3-rung hint ladder UI (label "Hint n/3 - Nudge / The rule / Partial reveal", `hintRung` exposed to scenes). Skin hook: `src/puzzles/skin.ts` swaps the panel for a nine-slice `puzzle/<kind>/panel` frame when the kind is in `skinKinds.ts` (empty today, so no failing requests); unit-tested for key + list/atlas sync only.

- Gate C platform (code side): `core/back.ts` Back router + ExitGuard, `core/platform.ts` (lazy @capacitor/app: backButton, appStateChange), `core/lifecycle.ts` idempotent background pause (loop + audio), `#game` inset by safe-area env(), puzzle shell handles Back (card -> prompt -> leave). DEPLOY.md updated.

## Verified
- `npm run verify` exit 0: 461 unit tests, 3 smoke; dist 2380.9 KB / limit 2560; boot 1819.9 KB. puzzles.e2e 20 passed (targets >= 96 px, no overlaps, on screen after the layout move). Viewed contact sheet of all 11 puzzle shots + code-800 + play sheet.
- `npm run verify` exit 0 (439 unit tests, 3 smoke). platform.e2e: 2 passed (Back order, background stops/resumes frames).
- puzzles.e2e: 20 passed (incl. new how-to-once test); `npm test`: 50 files, 432 passed.
- `npm run verify` after the flip: exit 0 (secret-scan clean, tsc, vitest all passed, build, check-assets, check_fronts, 3 smoke e2e passed). `npm run shots`: 6 passed; home-overview.png viewed = Home with yard, 3 buttons.
- `npx tsc --noEmit`: clean. `npm test`: 44 files, 395 tests passed.
- `npx playwright test tests/e2e/pixel.e2e.ts`: 1 passed (8x8 sprite at x3 = exact 3x3 blocks, WebGL).
- `npm run shots`: 6 passed, 22 PNGs rewritten in docs/shots.
- `npm run build`: dist 2264.3 KB (budget 2048, limit 2560), JS gzip 446.1 KB (budget 520).

- `npx playwright test tests/e2e/perf.e2e.ts`: 1 passed (2.6m). `tests/e2e/boot.e2e.ts`: 2 passed.
- Boot, software GL: Menu active 3713 ms at 1x, 8801 ms at 4x (js 449 KB gz). Of the 3446 ms to reach the end of texture baking, generateAllTextures takes 2021 ms (59%).

## Not verified
- Android: no JDK/Gradle/device here, so the APK build with @capacitor/app, the real Back button and gesture, insets, audio in background are all untested. First check: the next android.yml run on GitHub.
- Dist 2313.5 KB (was 2264.9): @capacitor/app chunks ~10 KB, rest from others' art pushes.
- Skin hook visually: no `puzzle-<kind>` atlas exists yet, so the swap path has never run in a browser (fallback path is what every e2e exercises).
- Workflow YAML parses (python yaml) but the changed workflows have not run on GitHub yet; the first push after this is their test. `npm run verify` timing not measured (the earlier run was well under 6 min wall).
- The brief's 3 s at 4x on a phone: NOT met in this sandbox (software GL cannot separate GPU from CPU cost). Needs a real device.
- Committed atlases differ byte-wise from `node scripts/pack-atlas.mjs` output (probably tools/pack/pack.py encoder); not repacked, frames unaffected.
- Full `npm run verify` timing and the GitHub CI run after this push.
- Pixel test on a real phone GPU (only software WebGL here).
- `?view=home` still boots Menu first by default (deliverable 4 pending); shots reach Home via the flag.

## Dist size (TO-AI-1 #3), numbers
- phaser chunk 1478 KB (65%): engine is locked; not shrinkable without a custom Phaser build.
- audio 492 KB (38 files; music_lofi_a.ogg 98 KB, amb_rain.ogg 92 KB, purr x3 39 KB).
- app JS 352 KB, atlas 80 KB, fonts 28 KB.

## Requests
- AI-3: `home-play-sheet.png`: the Start button overlaps the Standard chip (about 6 px) and its bottom touches the sheet edge; give the sheet one more row of height or move Start down.
- AI-3: make Home listen for Back: `this.events.on(BACK_EVENT, (ctx) => {...})` from src/core/back.ts: close the Play sheet, else zoom out (`focusOn(null)`), else leave unhandled (exit guard then runs); set `ctx.handled = true` only when it consumed it. Same for Result/Journal/Settings overlays.
- AI-2: add the `step` (0 nudge, 1 rule, 2 partial reveal) parameter to `PUZZLES[kind].hint(spec, progress, step)`; until then scenes still pass progress = hints-1 and the shell only labels the rung (`this.hintRung` is ready for them).

## Next
Home boot path, CI cost, puzzle shells + hint ladder.

## Run recipe
`npm ci && npm run shots`. If Playwright cannot download Chromium: `SHOTS_CHROMIUM=/path/to/chrome npm run shots`.
