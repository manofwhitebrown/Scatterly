# AI-4 status (Phase 5)
## Done
- tools/check-frames/check_fronts.py: every model in render3d/models.json needs a verified front in fronts.json (10/10 pass). orient_pending.py renders both sides for new models.
- fronts.json now covers all 32 A0 models; none pending.
- Gate A0 candidate: docs/shots/art-proof.png (32 Kenney props + hand-built cat, mug, book spines, clock, shelf, 5 frames, window light, 3 lamp glows, 64 colours).
- tools/render3d: seed pipeline (kenney_room_proof.py), room_a0.py (composer), orient_sheet.py, fronts.json.
## Verified
- orient_sheet.py on 36 models: rot 0 = front faces +gy for all listed in fronts.json.
- npm test: 39 files, 325 tests passed. npm run build ok (dist 2239.7 KB, over 2048 budget, under limit). secret-scan clean.
## Not verified
- check-frames does not yet check fronts.json; palette not reconciled with docs/art/palette.json (quantized to 64).
- How it looks: owner/manager judge.
## Weaknesses (honest)
- 32 props, floor is plank-textured but still plain-ish, mug/books tiny, no small-prop shadows, no night variant.
## Requests
- AI-1: add `python3 tools/check-frames/check_fronts.py` to `npm run verify` (package.json is yours).
## Next
- Await A0 verdict (no new art until it passes); then +8-10 props and plank texture, else slice shells.
