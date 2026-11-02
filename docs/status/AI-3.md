# AI-3 Face status (Phase 2)

## Done
- D0 Prep: RoomScene split. 392 -> ~362 lines; new RoomFlow (intro/coach/pause), RoomGate (puzzle launch), RoomFeel (Feel Spec triggers), RoomMarks (badges). All scene/ui files < 400 lines.
- D1 Tap targets: `src/ui/hit.ts` `pickSpot` (hit area >= 96x96 centred on art, nearest centre wins) used by one room-wide zone in RoomView; Button hit area >= 96x96; body/label text 28 px (Toast too); HUD button text 28 px. Test: tests/ui-hit.test.ts.
- D2 Feel Spec (Room): RoomFeel fires sfx + playFx + vibrate; curved item flight (RoomFx.flyItem), slot bounce + check stamp and Clues wiggle and timer pulse (Hud), room-switch light sweep + ambience (RoomFeel.roomSwitch), Rush last 10 s tint + sfx.setIntensity (RoomFeel.urgency, via RoomClock onSecond), win/lose (RoomFeel.win/lose), `vibrate`/`isCalm` helpers in ui/theme.
- D3 Marks: 400 ms long-press in RoomView (suppresses the following tap), cycles via session.cycleMark, RoomMarks badges (pooled, lazy, hidden when cleared), coach step 4, Settings tip. Falls back to a text glyph if tex.mark art is missing.
- D4 Journal (partial): JournalScene (week board, streak, stats, earned achievement ids, ScrollArea), reachable from Menu.
- D7 Settings (partial): Reduced motion toggle added; two-step Reset already existed.

## In progress / not started
- D4: achievement names + progress bars (needs AI-2 `ACHIEVEMENTS`), reachable from Result, toasts for newAchievements.
- D5 Result story, D6 Menu polish / guided tutorial, D8 perf audit numbers, Feel rows not yet wired: Buy decor, Room unlock, Result win stars/coins (Result and Organise).
- Item "found" pop in InspectPanel, Hud-side vignette flash.

## Feel Spec rows wired (where it fires)
tap/open/empty/found/take/clue/hint/room/urgent/win/lose: src/scenes/RoomFeel.ts, called from RoomScene (onSpot, applyOutcome, takeItem, onClue, useHint, onComplete, onTimeUp) and RoomNav (onSwitch). Existing `burst` still draws the win stars until AI-4's playFx('win') renders.

## Verified (commands run)
- `npx tsc --noEmit` clean, `npm test` 46/46, `npm run build` green, JS 390.8 KB gzip (budget 450).

## Not verified
- Anything visual or tactile (feel, fps, haptics, light sweep, badge look): never seen on a device. Owner must check with `?debug=1`.
- Tab labels remain 24 px (5 tabs must fit 124 px each); everything else >= 28 px.
- No e2e step yet for marks / hit targets (AI-1 owns tests/e2e).
- G4 leak counts not measured.

## Requests
- AI-2: export `ACHIEVEMENTS` (id, name, description, target, progress(stats)) and `weekPlan` for the Journal.
- AI-4: art for tex.mark('ruledOut'|'hunch'); implement playFx rows.
- AI-1: e2e steps: long-press a spot twice then tap; tap a 90x60 spot at its edge.

## Notes for AI-2
- Room uses GameSession.on('clue'|'complete'|'mark'), spotsIn, isOpened, inspect, take, solveGate, cycleMark, marks, discoveredClues, hint, finish.

## Notes for AI-4
- Puzzle scenes call onDone once, then scene.stop(); Room resumes itself inside onDone.

# Phase 3 (AI-3 Scenes and UI)

## Done
- D2 Run controller: `src/scenes/RoomRun.ts` (362 lines) now holds the view-agnostic rules: session, clock, intro/coach/pause (RoomFlow), gates (RoomGate), marks input, feel, hints, inspect panel, clue board, finish. `RoomScene.ts` is a 66-line shell (RoomView + RoomNav + RoomMarks) that plugs in through the `RunView` interface (`playAction`, `refresh`, `pulse`, `center`) and `RunHost.goRoom`. The iso view will implement the same two interfaces, so there is one copy of the rules.

## Waiting on others
- D1 / D3 / D4: HouseScene and IsoRoomScene registration needs AI-1's contract v3 (`SAVE_VERSION` is still 2, no `ISO`, `IsoPlacement`, `SCENE.House` yet) plus AI-2 `src/content/layout.ts` and AI-4 `src/art/iso.ts` (neither exists on main).

## Verified (commands run, repo at AI-3 D2 commit)
- `npx tsc --noEmit`: clean.
- `npm test`: 5 files, 46/46 passed.
- `npm run build`: green, JS 391.4 KB gzip (before the refactor: 391.1 KB; budget 450, Phase 0 raises it to 520).

## Not verified
- e2e bot: Playwright browsers cannot be installed in this sandbox, so the bot did not run locally. CI runs it on push; behaviour is meant to be unchanged (same calls, same order except RoomNav and RoomBack creation order, which have fixed depths).
- Feel, fps and anything visual: owner on a device with `?debug=1`.
- G4 leak counts not measured yet.

## Requests
- AI-1: contract v3 commit (see "Waiting on others").
- AI-2: `LAYOUTS`, `HOUSE_MAP`, Spot `iso` data; `ACHIEVEMENTS` and `weekPlan` (still outstanding from Phase 2).
- AI-4: `src/art/iso.ts` (`isoToScreen`, `depthKey`, `tex.isoShell/isoSpot/isoProp`); real `playFx`.
