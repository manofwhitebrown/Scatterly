# AI-4 status (Phase 6, Art and FX)
> Inbox: docs/manager/TO-AI-4.md (old orders = history). Brief: P6 section "YOUR ROLE: AI-4".
## Done (Phase 5, still true)
- Theme v2, 6 room shells, all 66 decor kinds have `prop/<kind>`, exterior kit, stairs, lit windows, spot frames for living/kitchen/bedroom, 3 puzzle skins, cat frames, art:sheet tool.
## Done (Phase 6)
- Task 1(b) rugs: `prop/rugRect` (3x2 tile diamond, cream field, thin rose band, sparse butter dots) and `prop/rugRound` (2x2, sage ring on cream) are now hand-built, low contrast and thin. Both pivot = frame centre (homeProps anchors at footprint centre). Source: tools/pixelart/props2.py (rug_rect, rug_round).
- Task 1(a) bed: `spot/bed/closed|open` hand-built (headboard, two pillows, terracotta blanket, footboard), 83x68, pivot = footprint top vertex (inferred from the old Kenney frame's pivot maths, not yet seen in game). Source: tools/pixelart/bed.py. Order to regenerate: props2.py, spots.py, bed.py, then tools/pack/pack.py.
- Task 1(c) wiring check, then plants: new standing frames `prop/pottedFern`, `prop/pottedCactus`, `prop/pottedFlower` (1x1, pivot bottom centre, pot colours terracotta/stone/blue). NOT in game yet: they need registering as kinds (see Requests). Source: tools/pixelart/props2.py (dict T).
- Task 1(d) windows: shells now have rose curtains (tie-back, folds, darker at dusk/night) via tools/materials/gen.py window_px; the window glow overlay (tools/pixelart/light.py) is now a light dither over the glass only, so frame, muntins and curtains show through. Floor light patch under each window already existed in the shell. Regenerate: gen.py assets/frames, light.py assets/frames/house, pack.py.
## Verified
- `python3 tools/check-frames/check.py assets/frames/room-slice --max 96` -> "141 files, 0 problems".
- `npm run art:sheet` -> "missing frames: none"; rugs checked by eye in docs/art/evidence/art-sheet.png; bed frames checked enlarged in isolation only (art-sheet does not draw spots).
- Arrival baseline: `npm test` 458 passed, 1 suite red (tests/home-geometry.test.ts, "window is not defined", AI-3's to fix).
## Not verified
- `npm run shots` could not run: no browser in this sandbox (Chromium download blocked). No Focus or Overview screenshot checked this unit; only the browser-free art sheet. Phone feel: owner only.
## Weaknesses (honest, from art-sheet)
- Same teal spiky plant still used 2-3 times per room; rooms still read 18-29 props with big empty floor; no contact shadows; floor-level pieces like the small red tiles look like stray markers.
## Requests
- AI-2/AI-3 (needed to make 1c visible): add `pottedFern`, `pottedCactus`, `pottedFlower` to src/content/worldKinds.ts as `B(1, 1, 4, { sym: true })` (same as pottedPlant) and swap about half of the `pottedPlant` placements in worldPropsA/B.ts so no room repeats one plant more than once. Frames already exist.
- AI-1: `npm run shots` needs a Chromium; none available to me.
## Next
- Owner or AI-1: confirm bed sits right on the bedroom wall in a real Focus shot. 1(c) wiring check, then plant variants, 1(d) windows with curtains + floor light patch, 1(e) contact shadows and wall decor density.
