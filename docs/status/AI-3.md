# AI-3 status (Home world, HUD, src/ui), Phase 6. Scope split applied (5 Nov): Result/Replay/Journal/Settings/checkpoints/audio/run controller/generateCase/Resume wiring are AI-5's.

## Done (pushed to main)
- Task 0: red test fixed (pure maths in `src/scenes/homeGeometry.ts`, no Phaser import).
- Overview EMPTY rooms: root cause was `this.decor?.setTargets(room, drawRoomProps(...))` in `HomeScene.buildRoom`. `decor` only exists in a run and `a?.f(g())` skips `g()`, so props were never drawn without a run. Props now always drawn.
- Crash fixes: actors built before `this.world` existed; walking tweens stopped on room change (avatar/cat `play` on destroyed sprite).
- Task 1 HUD: fixed grid `src/ui/hudLayout.ts` + `tests/home-hud-layout.test.ts` (18 cases, widths 1280-1680). Pause+Home top-left, Clues+Hint top-right, progress pill (28 px) top-centre, item tray bottom-centre (`icon/<item>` frames, cream outline when not found), 96 px "Look" chip bottom-left, room column bottom-right (`homeChrome.ts`). `__e2e.hud()` exists.
- Task 2 Focus: ONE veil dims rooms, props, yard and sky equally; focused room lifted above it.
- Task 3 (part): title top-right clear of the house; cat respawns after art loads; menu centred on LAYOUT.w.
- Task 4 full width: camera, sky (2600 px), menu use `LAYOUT.w`; `LAYOUT_EVENT` refits. Seen at 1560x720.
- Task 5 (part): badges use `ui/hunch` / `ui/ruledOut` frames (glyph fallback). Play sheet: Start no longer overlaps the chip row.

## Verified
- `npm test` green at last push (555 tests). dist 2414 KB (limit 2560).
- Live headless-Chromium runs at 1280x720: HUD targets 96 px, no overlaps.

## Not verified
- Feel on a real phone (owner only). 4x CPU throttle not measured. Shots at 1366x640 and 1200x540 not yet committed.
- `__e2e.hud()` returns label bounds, not the 96 px plates: fixing next.

## Requests
- -> AI-5: please export `hasResume(profile): boolean` and `startFromResume(scene)`; I will call them from the Play sheet. Also send `FINALE_EVENT` on the game events bus; Home will do the camera push.
- -> AI-4: window glow draws a dotted halo outside the window; cat is small in Overview.

## Next (Home only)
1. Light: `LIGHT_KEYS[time]` multiply rectangle, `shellPart`, `windowGlowKey`, lamp glow. `icon/<item>_sil` in tray. `ui/check` glyph. Confirm `spot/keyHook` anchor.
2. Audit: title-vs-rooms geometry check, centre/enlarge house, 25+ props per room, upper-floor slab edge + shadow, window frames, staircase.
3. Shots at 1366x640 and 1200x540 (`SHOTS_CHROMIUM=/tmp/chromium`). Then "READY FOR CLEANUP (AI-3)".
