# AI-1 status: Platform, Audio, Integrator (Phase 6)

## Done
- Task 1: main triaged. AI-3 fixed the red geometry test (b0b2aa4). Found a RUNTIME crash on main: HomeScene built HomeActors before `this.world` existed, so Home never started and the plain URL fell back to Menu. One-line swap in `HomeScene.create` (rule exception 1). Pages/Android workflows already skip docs/test-only pushes.
- Task 2: full-width screen. `src/core/layout.ts` (`LAYOUT {w,h,safeX}`, `FULL_WIDTH_SCENES`, `BACKDROP`), `src/core/screen.ts` (boot + resize/orientation refit, centres every non-full-width scene by safeX, emits `LAYOUT_EVENT`). Teal `#1f3a40` page/splash/Phaser/Capacitor background. Portrait shows "Turn your phone sideways" (CSS). APK landscape lock already in android.yml. `__scatterly.size` and `toClient` follow LAYOUT.

- Task 4 (part): `npm run shots` now also writes -1200 (20:9) and -1024 (4:3) PNGs for home-overview, focus-bedroom, focus-kitchen; a stale-PNG check fails the run if any committed PNG was not rewritten. All 15 shot tests passed, every PNG regenerated. `tests/e2e/hud-overlap.e2e.ts` written (1280x720 and 800x360, Overview, all 6 focus rooms).

- Task 5 (audio): the game used to play NO files (all sound was live synthesis; `public/audio` was dead weight). Now: `src/audio/` has a sample player (`bank.ts` lazy fetch+decode, `samples.ts`, `loops.ts` gapless loops), buses music/sfx/ui/ambience with music ducking (`engine.ts`), `music.ts` (track crossfade, Rush tension layer, result sting then calm bed), recorded ambience per room with the old synth beds as fallback, pure logic in `logic.ts`, data in `manifest.ts`. Old synth sounds/music remain as fallback when a file is missing. Content: 77 sfx x 3 variants, 5 music loops + tension layer + 6 s sting, 6 ambience loops, all original (`tools/audio/*.py`, `render.py`). `docs/art/AUDIO-LIST.md` has the "what plays when" table. Shipped audio 5.2 MB of 8 MB; `size-check` now reports audio separately (own 8 MB limit) and dist without audio.
- Loop seams measured after encoding: music about 1 (no click), worst ambience 2.7 (a smooth hum). Evidence: `docs/art/evidence/audio-*.png`, `audio-report.json`.

- Task 7 (partial): app icon + favicons by `scripts/make-icon.py` (isometric cutaway house like the game, `public/favicon.ico`, `favicon-32.png`, `apple-touch-icon.png`, `icon-192/512.png`; the Android set is made in CI, adaptive + legacy sizes, installed by android.yml; checked the drawing only, not on a phone); `android.yml` now names the APK `Scatterly-<package version>-build<run>.apk`, sets versionName/versionCode (installs over the previous build), after uploading the new file it deletes older ones so `latest` holds one file and is never empty, release text names the commit. `docs/DEPLOY.md` has the owner's install steps. YAML parses; the workflow itself has NOT run yet (needs a push to main and a look at the Actions result).

## Verified
- `npx vitest run`: 64 files, 566 passed. `npx playwright test tests/e2e/audio.e2e.ts`: loads 168 files in Chromium, music track + room loop active, 0 errors. Boot e2e (Home, Menu, uncaught error) 3 passed.
- `npx playwright test tests/e2e/layout.e2e.ts`: 5 passed (1280x720 -> 1280, 1200x540 -> 1600, 800x360 -> 1600, 1024x768 -> 1280, rotate + overlay).
- `npm run build`: dist 2409.3 KB / 2560, boot 1831.6 KB / 1900.
- Viewed 1200x540 shot: no purple bars, canvas fills window.

- `npx playwright test -c playwright.shots.config.ts`: 15 passed (6.7m).

## Not verified
- **Nothing has been listened to.** Balance, taste and how convincing the synthesised foley is are unknown; mixer levels are calculated, not tuned by ear. Needs the owner's ears on a phone.
- Callers: scenes still use mostly the old 18 sound names (they now play the new files automatically); the many new names (drawer, door, puzzle_*, star_stamp...) and `setTrack`, `resultMoment`, `setRoomAmbience('overview')` are NOT called from scenes yet.
- hud-overlap.e2e.ts is RED on purpose: after Play -> Start the run opens in the living room but `__e2e.hud()` returns [] and no HUD is drawn (screenshot checked, 15 s wait). The overlap check cannot run until AI-3 shows the HUD.
- Real phone (insets, rotation, APK). Full `npm run verify` after this push. Tasks 3-7 not started.

## Requests
- -> AI-3: Home must opt in to full width: use `LAYOUT.w` (not GAME_W) for sky, camera, HUD; listen to `LAYOUT_EVENT` (src/core/screen.ts) for rotation. Today the sky ends at x=1280 and a pale strip shows on the right at 20:9. I fixed `HomeScene.create` ordering (actors before world): please keep it.
- -> AI-2: puzzle scenes are centred by safeX with a 1280 dim backdrop; draw the dim at `LAYOUT.w` (ask me to add your scene keys to FULL_WIDTH_SCENES if you centre yourself).
- -> AI-4: make `generateAllTextures` lazy per `room:<id>` group (about 2 s of boot).

- -> AI-3: in-run HUD is missing on main (Play -> Start -> living room, no back/pause/room buttons, no progress strip, `hud()` empty). Also focus-bedroom shows no props. Run `npx playwright test tests/e2e/hud-overlap.e2e.ts` to see it.

- -> AI-3 / AI-2: please call the new sounds per the table in `docs/art/AUDIO-LIST.md` (`sfx.play('drawer')`, `sfx.setTrack(...)`, `sfx.resultMoment()`, `sfx.setRoomAmbience(room)`). I did not touch your scenes.

## Waiting
- Task 6 (Gate B cleanup, one commit) waits for "READY FOR CLEANUP" from AI-3 and AI-2 (neither written yet). Task 7 still open: Back router check, background pause, 4x-throttle perf, leak counts.

## Next
Task 6/7 when READY FOR CLEANUP arrives. Task 3: size-check already has budget 2560 and separate boot/total lines.

## Run recipe
`SHOTS_CHROMIUM=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome npx playwright test ...` here; `npm ci && npm run shots` elsewhere.
