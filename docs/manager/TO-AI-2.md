# Manager -> AI-2 (read first, do in this order)

## 5 Nov 2026 ~10:00 UTC (manager): LAYOUT PASS (owner shown the living room art sheet and is unhappy)
AI-4 is out of usage; AI-6 now does the art. The PLACEMENTS in `src/content/worldPropsA.ts` / `worldPropsB.ts` are yours (written 3 Nov) and the living room reads as a random scatter: sofa not facing anything, armchairs floating in the middle of the floor, no TV, stray small floor decals, rug at the front edge, same plant 3 times. Do a layout pass on ALL 6 rooms, one room per commit, each with an `npm run art:sheet` PNG: 
- Compose GROUPS like the references: living = TV unit on the right back wall, sofa facing it (rot per the FACING rule), coffee table + rug between them, armchair at an angle, side table + lamp, bookshelf, plants varied; bedroom = bed headboard on a back wall, two nightstands, wardrobe, rug at the foot; kitchen = counter along the walls, dining table with chairs facing it; and so on.
- Keep a clear walking path from the door (worldGrid must still connect every spot).
- Furniture against walls, small items on surfaces, not scattered mid-floor. Delete stray floor decals that read as markers.
- Register `pottedFern/pottedCactus/pottedFlower` and use each plant kind at most once per room.
- Aim 28-40 props per room including wall pieces; ask AI-6 under Requests for any frame you lack (name + footprint).

## 5 Nov 2026 (manager) URGENT, TOP PRIORITY: the rooms are laid out like a yard sale
Evidence: owner's screenshot of the art sheet, living room (`tools/artsheet/sheet.py` renders YOUR placements in `src/content/worldPropsA/B.ts`). Defects: furniture floats in the middle of the floor facing nowhere; the pink loveseat sits mid-room with its back to everything; the sofa is jammed at the back-left corner; no TV or media wall, coffee table not in front of the sofa; both side walls are bare apart from tiny frames; the same teal plant three times; tiny red/pink floor tiles that read as stray markers; the rug is not under a seating group.
Do an INTERIOR DESIGN PASS on all 6 rooms (living first), in this order of rules:
1. Each room gets 2-3 ZONES (living: TV wall + sofa facing it + coffee table between + rug under all three; reading corner with armchair + lamp + shelf. Kitchen: counter run on the back walls, table with chairs in the open half. Bedroom: bed headboard against a wall, nightstands both sides, wardrobe, desk zone. Bathroom: tub/shower against one wall, basin + mirror, washing machine. Study: desk facing the window, chair, bookshelf wall, plant. Entrance: shoe rack, coat hooks, bench, mat at the door).
2. Big pieces (sofa, bed, cabinets, shelves, counters) sit against a wall or form a clear group; chairs face the table or TV; NOTHING large in the dead centre except a table group. Use the FACING rule in the brief (rot = where the FRONT faces; `tools/render3d/fronts.json`).
3. Keep doors, the staircase landing and the walk grid clear (existing path tests stay green); add a layout test: every big piece within 1 tile of a wall or in a named zone; no two large pieces overlap; at least 6 wall pieces per room.
4. Vary plants (use pottedFern/pottedCactus/pottedFlower once registered: do that first), no kind more than twice per room; remove or relocate the tiny floor tiles that look like stray markers (they are decor kinds: ask AI-4 which, or drop them).
5. Evidence: run `npm run art:sheet` and commit the new `docs/art/evidence/art-sheet.png`; also post the living room Focus shot. Do this BEFORE any other task; this is the biggest visible quality problem left.

## 5 Nov 2026 (manager): SCOPE SPLIT
`src/puzzles/*` (the puzzle screens) now belongs to AI-7. DROP your Task 1 (puzzle screens restyle) and the scenes side of 'not wired' levels. You keep puzzle logic, generators, content, levels in `src/logic/puzzles`, `Gate.level` request to AI-1, placements in `worldProps*.ts`. Answer AI-7 and AI-6 requests (generator signatures, new wall-decor kind names and footprints). Also still open for you: register `pottedFern/pottedCactus/pottedFlower` in `worldKinds.ts` and swap half of the `pottedPlant` placements (AI-4 request), and the spot list for AI-4 if not posted.

## Manager note (4 Nov 09:55): commit ed88d56 (old AI-1, 09:20) already restyled the puzzle shell (pixel font, theme tokens, bar inside the panel, 55 percent dim), added 11 puzzle shots and the play-sheet shot, and raised the dist limit to 2560 with a boot payload report. VERIFY these in `docs/shots/puzzle-*.png` and `scripts/size-check.mjs` and fix only what is still wrong; do not redo them. Current briefs: `docs/manager/briefs/P6-AI-N-*.md`.


## OWNER SCREENSHOT, bedroom Focus, 4 Nov 14:40 (the owner sent it; read it first, it beats every older item)
Check the staircase: its landing cell must sit inside the bedroom footprint and be walkable, and the stairs must start inside the living room floor. In the owner's screenshot the staircase stands on the bedroom's front edge, outside the floor. Add a test: stairs bottom cell is inside the ground room, landing cell is inside the upper room, both walkable, and the drawn path between them is continuous. Post the cell numbers for AI-3.

## Small, for AI-4 (owner request): post in your status the list of distinct spot `kind` values per room with their `iso` footprints (w, d, h), so AI-4 can cut `spot/<kind>/closed|open` frames to size. Do it today.

## Relayed from AI-1: add the `step` parameter (0 nudge, 1 rule, 2 partial reveal) to `PUZZLES[kind].hint(spec, progress, step)`; AI-1 already shows the rung in the shell. Small; do it after your layout items.


## PLAYTEST (manager played the 4 Nov build from fresh screenshots; do these before older items unless marked later)
Problem: stairs. AI-4 needs a decision: the staircase footprint is 1 wide x 3 deep (not 2x1). Change `stairsUp` in layoutProps.ts to 1x3 (adjust STAIRS footprint and the walk grid, keep ids) and reply in your status so AI-4 cuts one frame. Also: after the (-6,-6) set-back, post the new wx/wy numbers under Requests for AI-3 the moment you push, because their overview fit waits on it. Do these two first.
0. APPROVED (manager, 4 Nov, after reading your overlap analysis; your set-back beats my first idea): apply the upper-floor set-back now. Give every floor-1 slot the offset (-6,-6): bathroom wx -6 wy -6, bedroom wx 2 wy -6, study wx 14 wy -6. Pure vertical shift, all upper rooms share it, so stacking and shared walls hold. Update `HOUSE_MAP_V2`, the nesting test (upper room = ground room shifted by exactly (-6,-6)), `worldGrid`/stairs/door cells if they read world coordinates, and anything else that assumed wy=0 upstairs. Local room coordinates and all prop/spot positions stay unchanged. The staircase is a link plus a drawn stair, not continuous geometry, so keep its cells as is. If after AI-3 renders it you and AI-3 both see the upper floor still hiding the ground back wall badly, you may try k=5 or 7; tell me the final k. Push it first, then post the new slot numbers under Requests for AI-3.
1. The overview screenshot shows rooms overlapping each other (the middle upper room cuts into ground-floor rooms). Add a layout test that no two room footprints overlap in world cells on the same floor and that each upper room sits within the footprint below it; fix `HOUSE_MAP_V2` if the cause is yours, otherwise reply to AI-3's Request with the exact cell numbers.
2. Verify `ENABLED` in `src/content/puzzleRoster.ts` lists every puzzle kind that has a scene, and run the fairness test with all enabled kinds.
3. Make sure about half of the padlocked containers in a case are decoys (AI-3 hides lock state until the first tap, so decoys must be real).
4. Then continue your brief: 30-minute case builder with the day ramp, session sim test, resume/snapshot checks, puzzle levels 1-5 and the 3-step hint ladder for the existing 11 kinds.

## Done
- Stairs 1x3 and (-6,-6) set-back: pushed, numbers under Requests in docs/status/AI-2.md (k=6 final unless AI-3 asks otherwise).
- Order 1: nesting test added; overlap cause is projection, numbers in status.
- Order 2: ENABLED == IMPLEMENTED (11 kinds), fairness test green.
- Order 3: decoy ratio test exists (0.25-0.75 of gates are decoys), green.
