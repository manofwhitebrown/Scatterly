# Manager -> AI-3 (read first, do in this order)

## 5 Nov 2026 ~05:00 UTC (manager): SCOPE SPLIT, AI-5 takes part of your list
A new AI-5 now owns: `ResultScene`, `ReplayScene`, `JournalScene`, `SettingsScene`, `resultStory`, `replayPlan`, `puzzleBook`, `achievementBook`, `settingsModel`, the run controller (`RoomRun`, `RoomFlow`, `RoomFinish`, `RoomCards*`, `RoomClock`, `RoomFeel`, `RoomFx`, `RoomGate`, `RoomPuzzle`, `runScene`, `caseProgress`, `feelMath`) and new `run*/screen*/sound*` files.
DROP from your list: Task 6 (Result, Journal v2, checkpoints, Settings), Task 7 (audio/FX hooks), Task 8 sign-off for those parts, and AI-2's requests about `generateCase` and Resume wiring (AI-5 does them).
YOU KEEP: everything Home (`Home*`, `home*`, HUD, `src/ui`), Tasks 1-5 and the audit defects below, plus these requests addressed to you: apply `LIGHT_KEYS[time]` as one multiply rectangle and `shellPart(time)`/`windowGlowKey` (AI-4); use `icon/<item>_sil` in the Hud tray; swap HomeSpots text glyphs for `ui/check|hunch|ruledOut`; confirm the `spot/keyHook` anchor; full-width Home sky across `LAYOUT.w` (AI-1); a Resume button on the Play sheet that calls AI-5's `hasResume`/`startFromResume`; the finale camera push on AI-5's `FINALE_EVENT`.
Write "READY FOR CLEANUP (AI-3)" when the Home side is done. Do not edit AI-5's files; file a Request to AI-5. Update `docs/status/AI-3.md` now: it still says Phase 5.

## 5 Nov 2026 ~04:20 UTC (manager audit of Home Overview, fresh build of 85081d1)
Evidence: owner's live-site screenshot (9:45 IST) showed EMPTY rooms; that was a stale deploy. My fresh build of main (85081d1) shows props, so the empty-rooms bug is fixed in code. I generated shots at 1366x640 and 1200x540 myself. The defects below are what is STILL wrong. Verify each with your own screenshot at BOTH sizes, and do not report done from committed shots.
- 1. TITLE OVERLAP: the SCATTERLY / "WHERE'D I PUT IT?" block sits on top of the top-left bathroom (it hides the room). Move the title where it covers no room (left column below the house, or shrink it), or move/scale the house so they never touch. Add an e2e/geometry check: title rect does not intersect any room's drawn bounds.
- 2. HOUSE NOT CENTRED / WASTED SPACE: the house leans left and the right third of the screen is bare hills. Centre the house in LAYOUT.w and fit it as large as the free height allows (between title and buttons). Centre the three buttons under the house, not at the left.
- 3. STILL SPARSE AND FLAT: each room shows about 8-12 orange/tan blocks, the same teal plant in every room, no visible cat, no visible stair link between floors. Place ALL the decor AI-2's layout gives (target 25+ per room in Focus; Overview must show the same props at 1x), vary plant kinds once AI-4 registers the new fern/cactus/flower, show the cat, and draw the staircase living-to-bedroom so the house reads as ONE connected house.
- 4. UPPER-FLOOR ROOMS: they look like pasted separate boxes (hard edges, no slab thickness or shadow under them). Draw a floor slab edge and a soft shadow so the upper floor visibly sits on the lower one.
- 5. Wall windows are pale flat rectangles: wire AI-4's window glow/curtain frames when they exist; until then at least draw frame + sill.
- Report: before/after shots at 1366x640 and 1200x540 in docs/shots, and write a line under Requests when done.


## 0. MAIN IS RED, fix this before anything else (found by manager at 09:18)
`npm test` fails: `tests/home-geometry.test.ts` (your commit 2edafbf) imports Phaser, which needs `window`, so the file errors out in node ("ReferenceError: window is not defined" from phaser/src/device/OS.js). All 457 other tests pass. Fix: test only the pure geometry (import from the pure module, not from a file that pulls in Phaser), or move the pure math into a file with no Phaser import. Run the full `npm test` before you push; never push red.

## OWNER: purple bars on laptop, and what a phone shows (manager tested the 4 Nov 09:13 build at 1200x540 = 20:9 phone: 120 px dark bars each side, 20 percent of the screen wasted)
Home must use the full logical width once AI-1 pushes `src/core/layout.ts` (`LAYOUT.w`, `LAYOUT.safeX`): extend the sky, hills, grass and trees across the whole width (no hard edge at 1280); anchor HUD buttons to the left and right edges of `LAYOUT.w` inside the platform safe-area inset, and keep the house, Play sheet and Play/Journal/Settings centred. Put the 3 buttons and all important content inside the central 1280 box. Check in shots at 1200x540 and 1024x768.
ALSO: on main at 09:13 the Overview shows the new striped shells but the rooms are EMPTY (no props, no spots, no cat) 9 s after boot. If props are only drawn in Focus, that is wrong: the owner's references show furnished rooms from outside. Draw the baked props in Overview too (static layer, no live sprites). If it is a load failure, fix the fallback and tell me what happened.

## OWNER SCREENSHOT, bedroom Focus, 4 Nov 14:40 (the owner sent it; read it first, it beats every older item)
What the owner sees, all yours unless stated:
1. HUD collisions: the "< HOUSE" button sits on top of the pause/menu button (top left shows only "...USE"); the room-nav buttons (BATHROOM, LIVING) sit on top of a top-right button and hide it; CLUES is half covered. Lay out a fixed grid: top-left = pause + house side by side with a gap; top-right = Clues, Hint; room-nav goes to a bottom-right column; item tray bottom centre; Show tappables a compact 96 px icon button bottom-left (it is a huge slab now). Nothing overlaps at 1280x720 and 800x360. Add `__e2e.hud()` returning the rect of every HUD element and a test that fails if any two intersect (AI-1 wires it into e2e).
2. The progress strip "ROOMS 1/5 FOUND 1/3 LOCKS 0" is faint text laid over the wall. Put it on a small dark pill, at least 28 game px text, or remove it from Focus.
3. Dimming is wrong: the room below the focused room is bright and its props stick out under the bedroom floor edge (teal plants, a red sofa), while the left and right are dimmed. Everything outside the focused room dims the same (the sky behind included) or is hidden.
4. The staircase is giant and stands outside the room on its front edge, ending in a dark hole. Its 1x3 footprint must be drawn inside the room floor, scaled like the room, and its top must meet the bedroom floor. Coordinate the landing cell with AI-2.
5. The avatar is a flat block person that does not match the art. Until AI-4's frames exist, draw a small outlined pixel figure from the palette; keep it about 1.5 tiles tall.
6. Item tray icons: the silhouettes are unreadable dark blobs; use the `icon/<item>` frames when they exist, otherwise a readable outline in the cream colour.

## URGENT (owner noticed: furniture art arrives but nothing is tappable)
1. `HomeSpots` (src/scenes/HomeSpots.ts) still draws only iso boxes and never reads `frame('spot/<kind>/<state>')`. Use the frame for each spot's state (closed, open, padlocked overlay, checked, marked) as soon as it exists, per kind, automatically, with the box as fallback. Hit area stays 112 px, nearest centre wins. Where a spot frame exists, hide the decor prop that sits under it so one object shows.
2. Decor is intentionally not a hotspot, but the player does not know that. Make decor tap feel alive: a small bounce and soft tick sound on the prop, never a cost. If a prop is tapped 3 times without any spot being opened, show the "Show tappables" outline once for 2 s.
3. In `?debug=1` overlay show `spots with art: X/N` next to `props with art`.

## Relayed from AI-1: make Home listen for Back via `this.events.on(BACK_EVENT, ctx => ...)` from src/core/back.ts: close the Play sheet first, else zoom out (`focusOn(null)`), else leave unhandled; set `ctx.handled = true` only when you consumed it. Same for Result, Journal and Settings overlays. Needed for the Android Back button.


## PLAYTEST (manager played the 4 Nov build from fresh screenshots; do these before older items unless marked later)
Problems seen in the screenshots (priority order, all yours; only the art frames are AI-4's):
1. Focus view is not centred: the focused room sits left, the room above hangs over it, and the stairs are huge. After AI-2's set-back lands, centre the room with an even margin and size the stairs to their 1x3 footprint.
2. Overview is a jumble: upper rooms cover the ground floor (fixed by the set-back, then re-check) and there is no sign this is a living house. Add: the cat visible and moving (sleeps on a bed or sofa in Overview), lit windows glowing warm in the morning, and a small pixel title "Scatterly" with the subtitle "Where'd I put it?" above or beside the house. Keep Play, Journal, Settings as they are.
3. Grey boxes: until AI-4's `prop/<kind>` frames exist, keep boxes but make the switch automatic: the moment `frame('prop/<kind>')` exists it is used, per kind, no code change. Show "props with art: X/66" in the `?debug=1` overlay so everyone sees progress. Report X in your status.
4. Show tappables and long-press must be obvious to a first-time player: one gentle hint on first Play ("tap furniture to look inside"), shown once, never again.
5. HUD and Play sheet: confirm the Play sheet uses the new theme (the committed shot is stale; AI-1 regenerates it).
ANSWERS to your Requests (manager, 4 Nov): (1) Upper-floor overlap: decided, no cutaway overlap. AI-2 shifts every upper room by (-6,-6) (TO-AI-2.md item 0); read `HOUSE_MAP_V2` after it lands and fit the house. Delete the stale request from your status. (2) `shell/<room>/full` at 10x8 vs ROOM_SIZE 12x9: shells must follow ROOM_SIZE; I am telling AI-4 to cut frames per ROOM_SIZE. Keep the procedural fallback until then.

Source: the manager rebuilt the latest main and looked at the real `?view=home` screenshots. Items 1-4 are defects in your scenes, item 5 is a new small feature.

## 0. Theme swap: no more brown (quick token change, do it in the same push as item 1)
Owner: "the brown looks disgusting; whatever else looks good is fine, even the buttons." Brown is out as a UI/background colour. Keep the orange Play button (it looks good) and the cream text. Put ALL UI colours in one `src/ui/theme.ts` token set (no hex literals in scenes) and use these interim values until AI-4 publishes the final ones in `docs/art/palette.json` (`theme` block; then read from it, or mirror it with a test that asserts they match):
- panel `#2d4a53`, panelHi `#3f6a72`, panelLo `#1f3338`, outline `#16252a`
- primary button (Play, Start) sun orange `#f4a93d` (keep), pressed `#d98a20`
- secondary buttons teal `#3f7f86`, hi `#5aa3a5`, lo `#2a5a62`; danger/pause terracotta `#c8604a`
- text cream `#fff3dc`, dim text `#cfd9d3`, camera/fallback backdrop soft sky `#cfe8ee` (the sky in item 5 replaces it)
Replace every brown fill in buttons, HUD panels, the item tray, notebook chrome, toasts, sheets and dialogs. Do not touch furniture or floor colours (AI-4 owns those).

## 1. Focus view is unreadable (highest priority)
In Focus the neighbouring rooms are drawn as translucent ghosts OVER the focused room, so you cannot read it, and the room is not centred or fully on screen (cut off on the left).
- Fit and centre the focused room completely on screen with a margin (HUD safe area respected).
- Neighbour rooms: dim to about 25% brightness, draw them BEHIND and beside the focused room, never over it, and make them inert (no taps, no animation).
- Add a Focus screenshot check: the whole focused room is inside the viewport.

## 2. House overview geometry
MANAGER DECISION (4 Nov audit): the overlap is not your projection. AI-2 found it: floor 1 sits in the same cells as floor 0 and is raised only 72 art px, so each upper room hides the back half of the room below. AI-2 is moving every upper slot by (-6,-6) (pure vertical shift, see TO-AI-2.md item 0). Do not hack around it. When AI-2 pushes, read the new `HOUSE_MAP_V2`, then fit the whole house (about 386 art px tall plus sky margin) above a reserved bottom band for Play/Journal/Settings. Overview scale x1.5 or x2 is fine if it fits; only Focus must be integer x3. Check Overview crispness and tell me what you chose. The staircase is a visible drawn stair in the living room and a landing in the bedroom plus a tappable link; the two do not need to line up on screen.
- The house runs off the right and bottom edges: fit the whole house with a margin at game start.
- Rooms overlap each other (the middle upper room cuts into ground-floor rooms). Find out whether the cause is `HOUSE_MAP_V2` coordinates (then file a Request to AI-2 with the cell numbers) or your projection/offset (then fix it).
- The Play / Journal / Settings buttons must not cover the house: reserve a bottom band or shrink the house.
- Make the staircase visible and tappable.

## 3. Padlock rule (design decision, final)
- A padlock icon appears on a piece only AFTER the first tap on it. Decoys get padlocks too, so a lock tells the player nothing before trying.
- "Show tappables" outlines every interactive piece and must not reveal lock state.
- HUD "locks" shows only locks already found, never the total.
- Add a Settings toggle "Show lock icons before tapping", default OFF (easy mode only).
- Items and clues are never drawn before reveal (unchanged).

## 4. Screenshots
Run `npm run shots` after each change and commit the PNGs. The shots committed at 08:25 were of the OLD game; regenerate them. Check each name matches the scene shown.

## 5. Morning sky background (new, cheap, no art needed)
The area around the house is bland and this is a morning game. Add a procedural daytime backdrop behind the house, baked once into a RenderTexture (at most 1 ms per frame, no interactivity):
- Sky in 5-6 colour bands, peach near the horizon to light blue at the top, palette-limited (use the 64-colour palette).
- A pixel sun with 2 soft glow bands, 5-7 pixel clouds that drift about 1 px per second (static under reduced motion).
- Two layers of muted green hill silhouettes and a far tree line.
- Parallax 0.3 against camera pan and zoom; it must never be tappable.
- Tie its tint to the existing day/night overlay: morning by default, Rush stays morning.
- It must work with no art frames (this is code only).
Then, once AI-4 delivers the exterior kit (`house/*`, `porch/*`, `yard/*` frames, see docs/manager/TO-AI-4.md), place it around the ground-floor edge of the house from `frame(key)`: lawn, path, porch in front of the entrance room's door, fence, trees, bushes, flowers, mailbox. All decorative, non-interactive, baked into the same background texture where possible; if a frame is missing, skip it.

## Done
- 0 Theme: all UI colours now come from the `COLOR`/`CSS` tokens in src/ui/theme.ts (teal panels, sun-orange primary, cream text, sky backdrop). Furniture/floor colours untouched. Not yet mirrored from palette.json `theme` (block does not exist yet).
- 1 Focus: neighbours are darkened (about 25% brightness, opaque) and drawn BEHIND the focused room; the room is fitted and centred with insets. Test: tests/home-geometry.test.ts.
- 2 Overview: fits with a free bottom band for the 3 buttons; staircase drawn (steps below, stairwell above) and tappable in Focus. Overlap cause is the LAYOUT (see status Requests), not my projection.
- 3 Padlock rule: icon only after the first tap, HUD "Locks" counts only locks found, setting `showLockIcons` (default off) added to Settings.
- 5 Sky: src/scenes/homeSky.ts (baked once, parallax 0.3, drifting clouds, tint from palette dayNight). Exterior kit placement waits for AI-4 frames.
- 4 Screenshots: NOT done (no browser here), see status.
