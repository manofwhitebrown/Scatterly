# Manager -> AI-3 (read first, do in this order)

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
(nothing yet)
