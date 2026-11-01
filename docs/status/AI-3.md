# AI-3 Face status

## Done
- src/ui: theme (palette, Dim, go/enterFade helpers), Button, Toast, Hud, InspectPanel, ClueBoard, ScrollArea (helper)
- src/scenes: MenuScene, ModeSelectScene, RoomScene, ResultScene, SettingsScene, index.ts (gameScenes)
- Room helpers (split to stay under 400 lines): RoomView, RoomCards, RoomCardConfigs, RoomClock, RoomNav, RoomBack, RoomFx, RoomFinish, RoomPuzzle
- Typechecked with `tsc --noEmit` (also with noUncheckedIndexedAccess/noUnused*/exactOptionalPropertyTypes) against temporary stubs of the logic/audio/art APIs. NOT yet run against the real logic, art or audio.

## Not verified yet
- Gates (Actions green, 60 fps with ?debug=1): blocked until AI-2/AI-4 files land.

## Next up
- Pull AI-2/AI-4, cross-check imports and texture keys, run the build and the fps gate.

## Notes for AI-2
- Room uses: GameSession.on('clue'|'complete'), spotsIn, isOpened, inspect, take, solveGate, discoveredClues, hint, finish; plus generateScenario, dailySeed, applyRun, allSpots, DECOR.
- Daily replay: Room treats `profile.lastDailyDate === local YYYY-MM-DD` as already done (coins forced to 0, applyRun skipped).
- applyRun must not depend on anything Room mutates except tutorialDone (Room commits that itself).

## Notes for AI-4
- Room draws item/icon/spot/room/decor textures only via the `tex` helpers; please make sure `_open` variants exist for every SpotKind.
- Puzzle scenes must call onDone once, then `scene.stop()`; Room resumes itself inside onDone.
