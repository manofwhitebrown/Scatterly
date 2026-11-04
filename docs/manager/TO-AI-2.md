# Manager -> AI-2 (read first, do in this order)

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
