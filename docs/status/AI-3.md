# AI-3 status (Scenes and UI), Phase 6

## Done (pushed to main)
- Task 0: red test fixed. Pure maths moved to `src/scenes/homeGeometry.ts` (no Phaser import); `homeSky`/`homeStairs`/`homeGlow` re-export it.
- Overview was EMPTY: cause was `this.decor?.setTargets(room, drawRoomProps(...))` in `HomeScene.buildRoom`. `decor` only exists during a run, and `a?.f(g())` skips `g()`, so props were never drawn without a run. Props are now always drawn.
- Actors were built before `this.world` existed (AI-1 fixed the same line); avatar and cat walking tweens are now stopped on room change (crash "reading play").
- Task 1 HUD: fixed grid in `src/ui/hudLayout.ts` (pure, tested in `tests/home-hud-layout.test.ts`, 18 cases at widths 1280-1680): pause+home top-left, Clues+Hint top-right, progress pill top-centre (28 px), item tray bottom-centre with `icon/<item>` frames and a cream outline for items not found, 96 px "Look" chip bottom-left, room buttons as a column bottom-right (`src/scenes/homeChrome.ts`). Old "< House" chip removed. `__e2e.hud()` exists.
- Task 2 Focus: ONE veil dims every other room, props, yard and sky equally; the focused room is lifted above it (`HomeScene.refreshDim`, `HomeSky.setDim`).
- Task 3 (part): props visible from outside; title moved top-right so it no longer covers the house; cat sprite respawns after art loads; menu centred on `LAYOUT.w`.

## Verified
- `npm test`: 62 files, 555 tests passed. `npm run build`: dist 2414 KB (limit 2560).
- Live run in headless Chromium (swiftshader) at 1280x720: tappable HUD targets 96 px, no overlaps (screens: /tmp only, not yet in docs/shots).

## Not verified
- How anything FEELS on a real phone (owner only). 4x CPU throttle not measured.
- `__e2e.hud()` returns label bounds for Hud buttons, not the 96 px plates: fix before AI-1 relies on it.
- Wide screens (20:9) not rendered yet. Cat is tiny in Overview. docs/shots PNGs not yet regenerated for my pushes.

## Requests
- -> AI-4: window glow draws a dotted halo outside the window (focus-living); same teal plant repeated in every room (see AI-4's own request to register pottedFern/Cactus/Flower); cat sprite is small for the Overview.
- -> AI-2: answered: I will switch Relaxed to `generateCase` and add Resume (profile.resume) in task 6.

## Next
1. Task 4: full width. Sky/hills/grass to `LAYOUT.w`, HUD already anchors to `LAYOUT.w`; listen to `LAYOUT_EVENT` (src/core/screen.ts). Start in `HomeSky` (SKY_W) and `HomeScene.apply`.
2. Regenerate `npm run shots` (use `SHOTS_CHROMIUM=/tmp/chromium`) and commit PNGs.
3. Task 5 spot frames, Task 6 screens, Task 7 audio hooks, Task 8 READY FOR CLEANUP.
