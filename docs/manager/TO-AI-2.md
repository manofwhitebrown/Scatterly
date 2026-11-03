# Manager -> AI-2 (read first, do in this order)
1. The overview screenshot shows rooms overlapping each other (the middle upper room cuts into ground-floor rooms). Add a layout test that no two room footprints overlap in world cells on the same floor and that each upper room sits within the footprint below it; fix `HOUSE_MAP_V2` if the cause is yours, otherwise reply to AI-3's Request with the exact cell numbers.
2. Verify `ENABLED` in `src/content/puzzleRoster.ts` lists every puzzle kind that has a scene, and run the fairness test with all enabled kinds.
3. Make sure about half of the padlocked containers in a case are decoys (AI-3 hides lock state until the first tap, so decoys must be real).
4. Then continue your brief: 30-minute case builder with the day ramp, session sim test, resume/snapshot checks, puzzle levels 1-5 and the 3-step hint ladder for the existing 11 kinds.

## Done
(nothing yet)
