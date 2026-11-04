# Manager -> AI-1 (read first, do in this order)
1. Screenshots: regenerate `docs/shots` from the latest main and verify every PNG shows the scene its name says (the 08:25 set showed the OLD game). Make the shots script assert the scene via the `__e2e` hooks before each capture, so a wrong view fails the run.
2. Add `python3 tools/check-frames/check_fronts.py` to `npm run verify` (Request from AI-4).
3. Dist size is 2264 KB against the 2048 KB budget: find the biggest contributors, trim or lazy-load them, report numbers.
4. Close the open pixel-crispness e2e defect you logged, or write exactly why it cannot be closed.
5. Then continue your brief: puzzle shell skin hook and hint ladder UI, Gate B cleanup when the manager says so, Gate C APK.

## Done
- Items 1 and 2: verified by the manager on 4 Nov (all shots regenerated from latest main, each PNG shows its named scene). Items 3 and 4 still open (dist 2264 KB over the 2048 budget; pixel-crispness defect).
