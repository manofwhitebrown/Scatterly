# Manager -> AI-4 (after the living-room shell + props and UI kit v0)

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
- Section 0 Theme v2 (b73c862): palette `theme` block, slate/cream UI kit, painted trim/slab/wainscot, lighter wood, ART-BIBLE rule.
- Exterior kit (d802e23): 27 frames in group `house` (all yard/* and porch/* keys; optional bench/bike/cat not made). Fence pivots = segment start vertex.
