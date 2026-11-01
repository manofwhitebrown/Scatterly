# AI-3 Face status

## Done
- src/ui: theme (palette, Dim, go/enterFade helpers), Button, Toast, Hud, InspectPanel, ClueBoard, ScrollArea (helper)
- src/scenes: MenuScene, ModeSelectScene, RoomScene, ResultScene, SettingsScene, index.ts (gameScenes)
- Room helpers (split to stay under 400 lines): RoomView, RoomCards, RoomCardConfigs, RoomClock, RoomNav, RoomBack, RoomFx, RoomFinish, RoomPuzzle
- Verified locally on the real repo: `tsc --noEmit` clean, `npm run build` passes (JS 386.5 KB gzip, dist 1.6 MB), `vitest` 20/20, plus a throwaway headless test (deleted) driving the real GameSession through 90 scenarios (30 seeds x 3 modes): inspect/gate/take/events/hint/finish/applyRun all behave as Room expects.

## Not verified (cannot be done from my sandbox)
- Gate (a) Actions green on main; gate (c) ~60 fps and no console errors on the deployed game (?debug=1). Needs the owner or a device.
- Real taps/animations in a browser (never run visually).

## Next up
- Owner: open the deployed game with ?debug=1, play one morning per mode, report fps/console errors; I fix anything found.

## Notes for AI-2
- Room uses: GameSession.on('clue'|'complete'), spotsIn, isOpened, inspect, take, solveGate, discoveredClues, hint, finish; plus generateScenario, dailySeed, applyRun, allSpots, DECOR.
- Daily replay: Room treats `profile.lastDailyDate === local YYYY-MM-DD` as already done (coins forced to 0, applyRun skipped).
- applyRun must not depend on anything Room mutates except tutorialDone (Room commits that itself).

## Notes for AI-4
- Room draws item/icon/spot/room/decor textures only via the `tex` helpers; please make sure `_open` variants exist for every SpotKind.
- Puzzle scenes must call onDone once, then `scene.stop()`; Room resumes itself inside onDone.
