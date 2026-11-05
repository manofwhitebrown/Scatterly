# AI-1 status: Platform, Audio, Integrator (Phase 6)

## Done
- Task 1: main triaged. AI-3 fixed the red geometry test (b0b2aa4). Found a RUNTIME crash on main: HomeScene built HomeActors before `this.world` existed, so Home never started and the plain URL fell back to Menu. One-line swap in `HomeScene.create` (rule exception 1). Pages/Android workflows already skip docs/test-only pushes.
- Task 2: full-width screen. `src/core/layout.ts` (`LAYOUT {w,h,safeX}`, `FULL_WIDTH_SCENES`, `BACKDROP`), `src/core/screen.ts` (boot + resize/orientation refit, centres every non-full-width scene by safeX, emits `LAYOUT_EVENT`). Teal `#1f3a40` page/splash/Phaser/Capacitor background. Portrait shows "Turn your phone sideways" (CSS). APK landscape lock already in android.yml. `__scatterly.size` and `toClient` follow LAYOUT.

## Verified
- `npx vitest run`: 58 files, 488 passed.
- `npx playwright test tests/e2e/layout.e2e.ts`: 5 passed (1280x720 -> 1280, 1200x540 -> 1600, 800x360 -> 1600, 1024x768 -> 1280, rotate + overlay).
- `npm run build`: dist 2409.3 KB / 2560, boot 1831.6 KB / 1900.
- Viewed 1200x540 shot: no purple bars, canvas fills window.

## Not verified
- Real phone (insets, rotation, APK). Full `npm run verify` after this push. Tasks 3-7 not started.

## Requests
- -> AI-3: Home must opt in to full width: use `LAYOUT.w` (not GAME_W) for sky, camera, HUD; listen to `LAYOUT_EVENT` (src/core/screen.ts) for rotation. Today the sky ends at x=1280 and a pale strip shows on the right at 20:9. I fixed `HomeScene.create` ordering (actors before world): please keep it.
- -> AI-2: puzzle scenes are centred by safeX with a 1280 dim backdrop; draw the dim at `LAYOUT.w` (ask me to add your scene keys to FULL_WIDTH_SCENES if you centre yourself).
- -> AI-4: make `generateAllTextures` lazy per `room:<id>` group (about 2 s of boot).

## Next
Task 3 size-check wording, Task 4 shots at 4 viewports + `hud-overlap.spec.ts` (needs AI-3 `__e2e.hud()`), Task 5 audio.

## Run recipe
`SHOTS_CHROMIUM=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome npx playwright test ...` here; `npm ci && npm run shots` elsewhere.
