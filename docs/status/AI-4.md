# AI-4 status (Phase 5)
## Done
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
- none
## Next
- Await A0 verdict; then +8-10 props and plank texture, else slice shells.
