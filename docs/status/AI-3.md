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
