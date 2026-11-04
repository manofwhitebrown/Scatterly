# AI-4 status (Phase 5)
> Manager inbox: docs/manager/TO-AI-4.md
## Done
- Theme v2 (TO-AI-4 section 0): palette.json has `theme` block; woodWarm/woodDark lightened; `plum` ramp replaced by `slate` (64 colours kept); ink #2a2030; UI kit regenerated in slate/cream with orange/teal/terracotta buttons; shells use cream trim and painted wainscot; A0 slab edge teal; ART-BIBLE rule added.
- Earlier: check_fronts, fronts.json (32 models), A0 passed, UI kit v0, icons, avatar/cat, shells day/dusk/night.
- Exterior kit (27 frames, group `house`, public/atlas/house.png): yard/lawn_0-2, path, flowers_0-3, bush_0-2, tree_0-1, fence_r/l/corner/gate, mailbox; porch/floor, steps, awning, railing, door, mat, lamp, lamp_glow, plant. Generator tools/pixelart/yard.py; ledger rows added; check.py accepts yard/porch names.
- Kitchen shell redesign: cream tile backsplash with teal cap, sage/cream checker floor (was grey). Bedroom shell: soft blue stripes with rose dot lattice and picture-rail line. Living unchanged.
- Stairs: `prop/stairsUp` (1x3 tiles, 12 steps x 6 art px = 72 rise, climbs toward -gy at rot 0, procedural, pivot = footprint top vertex) and `shell/house/stairwell` (2x1 hole with cream rim for the upper floor), both in group `house`; tools/pixelart/stairs.py. Kenney stairs models rendered as a ladder at this size, not used.
- Room contact sheet tool (art:sheet), kitchen/bedroom props, check-frames fronts check: closed/open now exist for every kind used by living, kitchen and bedroom (bagSpot, basket, bin, charger, jacket, papers, shoeRack, rug, table new; sofa/bed/tv/plant got an `open` state). tools/pixelart/spots.py + spots.json (table).
- 42 more Kenney-derived `prop/<kind>` frames (all registry kinds that have a Kenney model: sofa, chairs, tables, storage, kitchen, bath, laundry, lamps, rugs, small tops...). Footprints/heights taken from worldKinds.ts. fronts.json now covers 50 models (check_fronts: 0 missing). room-slice atlas 113 frames in one 1024x1024 sheet.
- Shells for ALL 6 rooms at ROOM_SIZE (entrance 8x9, living 12x9, kitchen 10x9, bathroom 8x9, bedroom 12x9, study 10x9), wall 64 art px, windows from worldProps, door on the left wall of rooms that are `b` of a WORLD_DOOR. Keys `shell/<room>/full|full_dusk|full_night`, one atlas per room: group `room:<id>`. Pivot = back corner of the floor diamond = (145,65) in every room. Old 10x8 shells removed from room:slice. Per-room moods: entrance terracotta, living sage, kitchen teal tile, bathroom teal stripe + stone, bedroom blue/rose, study sage + slate.
## Verified
- check.py core: 74 files, 0 problems; room-slice: 49 files, 0 problems (see commit).
## Not verified
- Not made: optional porch bench/bike/cat. Fence pivots are the segment start vertex (AI-3 to confirm placement). check-frames does not yet check fronts.json. How it looks: owner/manager judge.
## Weaknesses (honest)
- sofa/bed/tv/plant `open` is only a small envelope peeking on the closed frame (no real animation); hand-built small spots are 10-14 art px and basic; rug lift is a lighter corner; padlock overlay is `ui/padlock` (not re-skinned).
- Exterior is simple: flat lawn tiles, small door (12x19 art px), awning is a single striped slope, glow is dithered.
- A few picture frames and the coat rack still use dark honey-brown outlines; kitchen/bedroom shells only recoloured, not redesigned.
## Requests
- AI-3: shells are in `room:<id>` groups now (ensureGroup('room:living') etc.); props stay in `room:slice`. Pivot of every shell = floor back corner (145,65). Stairs: staircase prop is 1x3 (climbing -gy); STAIRS footprint 2x3 -> frame is centred on it (AI-3's homeStairs does that).
- AI-2: stairsUp footprint is 2x1 in layoutProps.ts but the staircase needs 1 wide x 3 deep (or rotate to 3x1 with rot 1 once I add a mirrored frame). Tell me which; I can also re-cut it 2x1 with steeper rise.
- AI-3: src/ui/theme.ts should read docs/art/palette.json `theme`. AI-1: add check_fronts.py to `npm run verify`.
## Next
- Hand-built kinds still missing (29): rugRect, bathMat, catBed, shoesPair, slippers, robotVacuum, teacup, vase, photoFrame1/2, bowl, cuttingBoard, pan, banana, magazine, desk_lamp, hat, keyring, towelStack, soap, toothbrush, poster1-3, calendar, clockWall, mirrorWall, hangingPlant, bunting.
- Room contact sheet tool (art:sheet), kitchen/bedroom props, check-frames fronts check (spot/<kind>/closed|open, padlock overlay).
