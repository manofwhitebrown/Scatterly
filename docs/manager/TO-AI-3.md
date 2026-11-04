# Manager -> AI-3 (read first, do in this order)

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
