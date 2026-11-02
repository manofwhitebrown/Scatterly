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
- AI-2: ship `ACHIEVEMENTS` (id, name, description, progress target) and `weekPlan` so the Journal can show progress bars and Result can show the plan; today `profile.achievements` is a list of raw ids.
- AI-2: emit `Clue.facts` (key/label/value) on number clues; without it the notebook chips and the keypad's highlighted facts never show.
- AI-2 + AI-4 (blocking visual correctness): `KIND_FOOT` (layout) and `ISO_DIMS` (baked art) disagree, e.g. drawer 1x1x3 vs 2x1x2, cabinet 1x1x5 vs 2x1x4, fridge 1x1x7 vs 1x1x6, jacket/keyHook/charger are wall mounts (gz>0) in layout but floor-level in art, rug h 1 vs 0. The iso view draws and hit-tests the baked art footprint at the layout's (gx, gy, gz), so pieces will overlap or float until one side changes. Pick one table and make the other match.
- AI-4: `ensureRoomShell(scene, room)` bakes a fixed 8x8 shell; `LAYOUTS[room].cols/rows` are 8x8 to 10x8 and wall height is 10 (art uses 6). Please take cols/rows/wall height from `LAYOUTS`, and add textures for `PROPS` ids (only DECOR props have `tex.isoProp`).
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

- D1 Phase 0 skeletons (contract v3 landed): `IsoRoomScene` registered under `SCENE.Room` when `?view=iso` (default stays `RoomScene`), `HouseScene` registered under `SCENE.House` (tiles for the 5 rooms, locked rooms dark, tap picks a room or goes to Menu; no progress numbers or zoom yet). `IsoRoomView` draws placeholder shells and 3-shade boxes from `Spot.iso`, hit areas = iso screen box through the existing `pickSpot` (>= 96x96, nearest centre), long-press marks via new `ui/PressZone`, padlock badge from the start on gated containers, depth-sorted once. `RoomMarks` and `RoomNav` now depend on small interfaces (`MarkHost`, `RoomSwitcher`) so both views share them. Under `?e2e=1` the iso scene exposes `scene.__e2e.hotspots()` (`{spotId, x, y}` in game px).
- AI-4's iso kit landed: `IsoRoomView` now draws baked `tex.isoShell` + `tex.isoSpot(kind, open)` images (origin = top vertex via `boxTexture(ISO_DIMS[kind])`, position = `isoToScreen` + room origin, depth-sorted once with `depthKey`). Hit boxes and art both use the canonical `ISO_DIMS` footprint of the kind (`ui/isoGrid.placementOf`), so they always agree. Padlock badge is a tiny Graphics per gated container, hidden once opened. `ui/isoGrid.ts` wraps AI-4's `isoToScreen`. Room origin is (640, 200); the shell is the default 8x8 until AI-2 publishes room cols/rows.
- Door hotspots: `IsoRoomView` builds an arrow badge + 96x96 zone per `LAYOUTS[room].doors` entry (right wall at (at,0), left wall at (0,at), height 2), tap goes through `RoomNav.goTo` (so blocked while a modal is open, and only to unlocked rooms). `scene.__e2e.doors()` lists them. Not yet: door art, props from `PROPS`, shimmer, hop-out items, zoom to lock.
- HUD v3 + Dollhouse (D4/D5 part): `Hud` takes optional `handlers.onHouse`; when set a 180x56 'House' button (hit area >= 96x96 via Button) replaces the room tabs (iso view only; flat view keeps tabs). House button opens the Dollhouse as an overlay scene (`RoomHouse` -> `scene.launch(SCENE.House, {overlay, ...})`), the clock keeps running, spot taps are ignored while it is open (`modalOpen`), Esc/Back/Close and pause close it, and leaving the Room stops it. `HouseScene` places tiles from `HOUSE_MAP`, draws AI-4's baked shells scaled 0.4 (queued one per frame via `prefetchRoomShells`, swapped in as they appear), shows `searched/total · locks · clues` per room (pure `houseProgress.roomProgress`, counts only, no spoilers), highlights the current room, dark tile + padlock for locked rooms, tap = camera pan+zoom 300 ms then `goRoom` (cut when reduced motion or low-fx). G11: House button + room tile = 2 taps from any room.
- Interaction polish (iso view): items now hop from the opened furniture (not from the panel) to the tray, clues flutter from the furniture to the Clues button (`RoomFlyouts`, pooled, one baked 40x52 paper texture `ui_clue_paper`); tapping a padlocked container zooms the room container (HUD stays put) 1.5x onto it in 220 ms before the puzzle opens (`RoomGate.launch(..., before)`), reset when the puzzle closes; idle shimmer: 1 Hz timer, after 10 s without input the nearest unsearched container (capacity > 0, nearest to the last touch) hops and flashes, repeating every 10 s, never during modals, off under reduced motion or low-fx (`ui/isoGrid.nearestUnsearched`, tested). The flat view is unchanged. All motion is skipped when `isCalm`/`isLowFx`.
- Notebook + keypad notes (D5): fixed a real gap, `puzzleLaunchData` used to pass `notes: []` so every puzzle's Notes drawer was empty; it now gets the clues found so far (`RoomGate` hook `notes()`). Clue Board cards show up to 2 number chips per clue (`ui/clueFacts.factChips`, label shortened, outline + fill + check when pinned, tap area 96 px tall); tapping a chip pins that clue's fact, and pinned clues are ordered last in the puzzle's notes (the drawer shows the most recent ones, `orderNotes`). Pins live for the run. Needs AI-2: the generator does not emit `Clue.facts` yet, so chips only appear once it does (unit-tested with synthetic clues). Also: opened containers get a green check badge in the iso room (shape + colour).
- Journal + Result (D6): Journal now has the Puzzle Book, one card per puzzle kind (19) with name, locked/unlocked (enabled by the roster or already played), solved count, best time and skip rate (`scenes/puzzleBook.bookEntries`, tested). Result story is one sequence: stars stamp one by one (with a pop), coins count up after them, a one-line habit callout (`resultStory.habitLine`, from `RunResult.habitHits`), then the evening timeline fades in line by line (~3 s total, `revealStepMs`); a tap anywhere jumps to the final state, and reduced motion or low-fx (`isCalm`) shows everything instantly. Result's Organise / Next morning / Menu buttons unchanged.
- Art review for AI-4 (due per brief): keys and anchors work as documented; `ensureRoomShell` is called lazily per room on first show.

## Waiting on others
- AI-2 `LAYOUTS` / `HOUSE_MAP` / real Spot `iso` (current `iso` is AI-1's placeholder derived from the old pixel boxes, so pieces can sit outside the 8x8 shell and overlap until real layout data lands).
- Still to build: Menu backdrop (Dollhouse behind the Menu), achievements with progress bars + new-achievement toasts (waiting on AI-2's ACHIEVEMENTS table, ids are raw today), week plan on Result, tutorial in the iso room, reduced-motion coverage audit, leak counts, Parity cleanup (delete RoomView/RoomNav tabs path).

## Verified (commands run, repo at AI-3 iso-art commit)
- `npx tsc --noEmit`: clean.
- `npm test`: see latest run below.
- `npm run build`: green, JS 401.0 KB gzip (budget 520).

## Not verified
- `?view=iso` and the Dollhouse skeleton were never run in a browser (no GL/browser here); CI e2e covers the default view only until AI-1 adds an iso run.
- e2e bot: Playwright browsers cannot be installed in this sandbox, so the bot did not run locally. CI runs it on push; behaviour is meant to be unchanged (same calls, same order except RoomNav and RoomBack creation order, which have fixed depths).
- Feel, fps and anything visual: owner on a device with `?debug=1`.
- G4 leak counts not measured yet.

## Requests
- AI-1: add an e2e run on `?view=iso&e2e=1` that taps `scene.__e2e.hotspots()` (Room scene key is `Room`).
- AI-2: `LAYOUTS`, `HOUSE_MAP`, Spot `iso` data; `ACHIEVEMENTS` and `weekPlan` (still outstanding from Phase 2).
- AI-4: `src/art/iso.ts` (`isoToScreen`, `depthKey`, `tex.isoShell/isoSpot/isoProp`); real `playFx`.
