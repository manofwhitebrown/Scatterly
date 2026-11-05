# Manager -> AI-4 (after the living-room shell + props and UI kit v0)

## 5 Nov 2026 (manager): art sheet shows the rooms look like a yard sale (placement is AI-2's, but help)
See the top of TO-AI-2.md. AI-2 is doing an interior-design pass on all rooms. You: (a) tell AI-2 which tiny floor kinds are the stray red/pink tiles and whether they are worth keeping; (b) answer AI-2's frame questions fast (footprints, pivots, rot fronts); (c) make the art sheet show doors and the staircase so layout problems are visible; (d) if a missing prop blocks a zone (TV on a media console, floor lamp, coat hooks, shoe rack, wall shelf with books), say so under Requests -> AI-6 or draw it yourself.

## 5 Nov 2026 (manager): SCOPE SPLIT
AI-6 now takes your Task 6 (puzzle skins for the remaining kinds) and Task 7 (FX particles), plus extra wall decor if time. DROP those. You keep: Tasks 1-5 and 8 (boot cost, lazy `room:<id>` textures), plants, density, and you remain the ONLY one who runs `tools/pack/pack.py`: repack when AI-6 asks. Reply to AI-6's frame-name questions quickly.

## 5 Nov 2026 ~04:20 UTC (manager audit of Home Overview, fresh build of 85081d1)
Evidence: owner's live-site screenshot (9:45 IST) showed EMPTY rooms; that was a stale deploy. My fresh build of main (85081d1) shows props, so the empty-rooms bug is fixed in code. I generated shots at 1366x640 and 1200x540 myself. The defects below are what is STILL wrong. Verify each with your own screenshot at BOTH sizes, and do not report done from committed shots.
- 1. WINDOWS: in the Overview every window is a flat pale rectangle with no frame, curtain, sill or light. Make window frames with curtains plus the floor light patch (task 1d), in the wall-left and wall-right orientations, and register the frames so AI-3 can use them.
- 2. PROPS READ AS BLOCKS: at Overview size most furniture is an orange/tan blob (sofas, beds, tables look alike). Give each major piece a clear silhouette and two tones of shading (sofa arms and cushions, bed pillow and blanket, table legs, TV, bookshelf with colourful spines), like the reference house images (dense, readable at small size).
- 3. PLANTS: the same teal plant is in every room. Register fern/cactus/flower kinds (task 1c) and tell AI-2 the kind names in Requests so they vary by room.
- 4. SHELL/FLOOR: floors are big flat wood or checker slabs. Add rugs, floor-light patches and contact shadows under furniture (task 1e).
- 5. Upper-floor slab: provide a slab edge + shadow frame so upper rooms do not look like floating boxes (AI-3 will place it).
- Report: art:sheet for windows/props at 1x and 3x, plus an honest weakness list.


## OWNER SCREENSHOT, bedroom Focus, 4 Nov 14:40 (the owner sent it; read it first, it beats every older item)
What the owner sees, all yours:
1. The tan boxes (wardrobe, nightstands, stacked boxes near the bed) are the tappable spots. They are the first thing the room shows and they are still boxes. Spot frames come first, bedroom now.
2. The bed is a flat pink slab: no headboard, pillow or blanket fold. Fix it from the Kenney bed model or hand-build it.
3. The rug is a huge saturated red-orange diamond that dominates the floor. Make it smaller, patterned, a low-contrast warm tone, thin.
4. The same teal spiky plant is used six times and looks like a dry agave in rooms where it makes no sense. Make 3 plant variants and use them sparingly.
5. Windows are flat pale-blue squares. Add frame, sill, curtain and a soft light patch on the floor.
6. The avatar: send first idle + walk frames (outlined, same palette).
7. For every room, before you push, view the real composition in a Focus screenshot (`npm run shots`) and write in your status what still looks weak.

## URGENT, do before puzzle skins and sound (owner noticed: furniture art arrives but nothing is tappable)
The tappable pieces (the 6-10 per room: drawers, fridge, wardrobe, padlocked boxes) are still grey boxes, because the `spot/<kind>/closed|open` frames (your deliverable 3) do not exist yet. Make them now: for every spot `kind` used in the rooms (list: `grep -ho "kind: '[a-z]*'" src/content/*spots* | sort -u`, or ask AI-2), a `closed` and an `open` frame (drawer pulled out, door ajar, lid up) sized to the spot footprint in `spot.iso` (w,d,h in tiles), same style and palette as the props. Where a spot is a piece of furniture (fridge, wardrobe, sofa chest), the spot frame REPLACES the decor frame at that spot, so the player sees one object, not two. Also: padlock overlay, checked tick, hunch mark. Push after living, kitchen and bedroom spots first.

## Relayed from AI-1: `generateAllTextures` bakes everything at boot (about 2 s of a 3.4 s start). As atlas art replaces code-drawn textures, drop or lazy-bake them per `room:<id>` group so the menu is interactive within 3 s on a throttled CPU. Do it when you retire each code-drawn texture, not as a separate project.


## PLAYTEST (manager played the 4 Nov build from fresh screenshots; do these before older items unless marked later)
Problem: this is the single biggest reason the game feels fake. In every room the player sees plain grey/blue/green boxes; only the art-proof image looks like the references. 53 of 66 decor kinds have no frame.
1. Props first, room by room, in this order: living (the owner's best-known room), kitchen, bedroom, then entrance, bathroom, study. Push after EACH room so AI-3 can show it; frames in the loader group `room:<id>`. Target per room: every kind in `WORLD_DECOR[room]` has a `prop/<kind>` frame, correct facing (fronts.json), outlines, 3-step shading, one palette. Small props (mug, books, plants, frames) hand-built, big furniture from the Kenney render pipeline.
2. The cat: sleeping and idle frames first (`pet/cat/sleep|idle`), AI-3 will place it on the overview. This is the "someone lives here" cue.
3. Lit windows: a warm window-glow frame (day) so the overview windows read as lit.
4. Puzzle skins after rooms: `puzzle/<kind>/panel` nine-slice (cream paper with wood trim), pixel-style buttons and tiles, for the 3 shot puzzles (untangle, lights, mastermind) first.
5. Do not start sound until rooms 1-3 are done. Re-run `art:sheet` and commit an honest evidence PNG with each room.
Order of your older items stands after this.

## 0. From AI-3's Request (manager, 4 Nov)
Shells must be cut per `ROOM_SIZE` in `src/content/world.ts` (living 12x9, kitchen 10x9, bedroom 12x9, entrance 8x9, bathroom 8x9, study 10x9), not 10x8. Answer AI-3 in your status: prop pivot = base centre of the footprint; rot 1 = mirrored rot 0 (say so only if that is true for your frames). 53 of 66 decor kinds still have no `prop/<kind>` frame: after shells, do props room by room (living, kitchen, bedroom first). The stairs footprint question is between you and AI-2; the staircase needs 1 wide x 3 deep.


Gate A0 passed (verdict given by the manager). New small request, decorative only, from the owner: the area around the house is bland and this is a morning game.

## 0. Theme v2: remove the muddy brown (applies to UI kit v0 and the living shell NOW)
Owner: "the brown looks disgusting; whatever else looks good is fine." Direction: fresh morning, not dark wood.
- UI kit: NO wood or brown panels any more. Nine-slice panels in deep slate-teal (`#2d4a53`, hi `#3f6a72`, lo `#1f3338`, outline `#16252a`) and cream paper (`#fff3dc`) for the notebook; secondary buttons teal (`#3f7f86`), primary keeps sun orange (`#f4a93d`), danger terracotta (`#c8604a`). Pressed states, the item tray and icons follow it. Update the pixel-font colours if needed.
- Shells and props: wood stays on furniture only, but lighter and warmer (honey/peach, never dark muddy brown). Replace dark brown trims, the floor slab edge and wainscot with lighter honey wood or painted trim in cream, sage or dusty teal; use the deep plum ink `#2a2030` for outlines and the dark backdrop instead of brown. Each room keeps a distinct mood.
- Publish a `theme` block in `docs/art/palette.json` (keys: panel, panelHi, panelLo, outline, btnPrimary, btnSecondary, btnDanger, text, textDim) as the single source; AI-3's `src/ui/theme.ts` reads it. Update `docs/art/ART-BIBLE.md` with the new rule "no dark brown fills".

## Exterior kit (about 15-20 frames, palette-limited, same iso 32x16 grid and style as the shells)
Push it after the living room and UI kit v0, before the kitchen and bedroom shells. AI-3 places it; you only deliver frames and register keys in the manifest.
- `yard/lawn` (3 grass tile variants, plus a path-stone tile), `yard/flowers` (4 small variants), `yard/bush` (3), `yard/tree` (2), `yard/fence` (segments for both iso directions plus a corner and a gate), `yard/mailbox`.
- `porch/floor`, `porch/steps`, `porch/awning`, `porch/railing`, `porch/door` (front door frame with a small window, seen from outside, matching the entrance shell colours), `porch/mat`, `porch/lamp` (with a glow variant), `porch/plant` (potted).
- Optional if time allows: `porch/bench`, `porch/bike`, a cat sitting on the porch (reuse the cat style).
- Everything non-interactive. Warm morning light, palette of the day variant; add `docs/art/ASSET-LIST.md` entries.
- Use Kenney pieces where they fit (fence-like, plant, bench) and mark them Kenney-derived; hand-build the rest.
- Front faces must follow the FACING rule in the shared brief; record any new models in `fronts.json`.

## Done
- PLAYTEST 4 (3 shot puzzles): `puzzle/untangle|lights|mastermind/panel` + tiles/pegs/beads; kinds added to SKINNED_KINDS.
- PLAYTEST 1-3: all registry kinds have `prop/<kind>` frames (fd30bd1), cat sleep/idle exist, window glow `fx/windowGlow/0-3` + `fx/lampGlow/0` (group house). Mounts have `_L` variants.
- Shells for all 6 rooms at ROOM_SIZE, groups `room:<id>` (afd2694); stairs + stairwell (810bf70); spot frames (9e1cfb3).
- Section 0 Theme v2 (b73c862): palette `theme` block, slate/cream UI kit, painted trim/slab/wainscot, lighter wood, ART-BIBLE rule.
- Exterior kit (d802e23): 27 frames in group `house` (all yard/* and porch/* keys; optional bench/bike/cat not made). Fence pivots = segment start vertex.
