# AI-4 Hands & Eyes status

## Done
- src/art: palette (colours, draw helpers, makeText/makeButton UI helpers), rooms, spots (20 kinds x closed/open), props (spot helpers), items, icons, decor, index (generateAllTextures)
- src/audio/sfx.ts (WebAudio synth, generative lo-fi music, safe before unlock())

- src/puzzles: PuzzleShell (extra shared base), UntangleScene, SortScene, WordScene, index (untangle generator unit-checked: 1200 seeds, solution always planar, start always tangled)

- src/organise: OrganiseScene (preview + Shop/Home spots, list scrolls with a second camera, pooled rows), index
- decor art matches the real DECOR ids (fairy lights, herb pots, towel shelf, bath mat, curtains, mirror, clock, print)

## Next up
- Cross-check against AI-2's logic/index.ts once pushed; run the real build + fps gate

## Notes
- Extra files inside my own folders (keeps every file < 400 lines): src/art/props.ts, src/puzzles/PuzzleShell.ts
- Art was rendered offline to PNG and checked by eye; textures total ~20 MB.

## Notes for AI-2
- DECOR drives `decor_<id>` textures: storage defs with `spotKind` reuse that spot's drawing scaled to w x h; cosmetic ones pick a drawing from keywords in id/name (lamp, clock, mirror, vase/flower, plant, curtain, cushion, rug, shelf, candle), otherwise a framed picture.
## Notes for AI-3
- Textures exist after `await generateAllTextures(scene)`; guard with `scene.textures.exists(key)` if you create images early.

## Phase 2 session log (AI-4)
- Verified: split art/spots.ts -> spots.ts 185 + spotsB.ts 219; npm test 20/20; build green; JS gzip 386.5 KB.
- Verified: Phase 0 stubs pushed: src/fx/index.ts (playFx no-op, liveParticles), src/fx/names.ts (local FxName mirror), sfx.play(name,{step}) (step pitch real), sfx.setIntensity, sfx.setRoomAmbience (state only). JS gzip 386.8 KB.
- Not verified: how anything sounds/looks; fps on device.
- Requests: AI-1 land Contract v2 (FxName, tex.fx, tex.mark) so fx/names.ts can import from shared/types.

## Phase 3 (AI-4)
- Verified (c266730): real FX system in src/fx (specs.ts, pool.ts, textures.ts, layer.ts, index.ts). All 16 FxNames implemented: tap, open, empty, found, take, clue, hint, room, urgent, win, lose, coin, star, buy, unlock, puzzleOk. Pooled images (cap 60), confetti cap 40, one pooled flash rectangle, one update listener per scene, no per-particle tweens, cleanup on shutdown/destroy, calm mode (lowFx/reducedMotion) = one 120 ms ring highlight. `liveParticles()` feeds the debug overlay.
- Verified: `npx tsc --noEmit` clean; `npm test` 49/49 (new tests/fx.test.ts: specs within caps, allowedCount, Pool reuse/steal); `npm run build` green, JS gzip 393.3 KB (was 391).
- Not verified: how effects look or feel on a device; fps with effects; G4 leak counts (no e2e step yet for fx).
- Blocked: iso kit v0 needs Contract v3 (Spot.iso, IsoPlacement, ISO) from AI-1; types.ts is still SAVE_VERSION 2. Waiting.
- Next: audio (ambience beds, puzzle sounds, limiter, 12 voices), then iso kit once v3 lands.
- Verified (audio): src/audio split into engine.ts (lazy AudioContext, master gain + DynamicsCompressor limiter, noise buffers), voices.ts (VoiceBook: steal-oldest, budget music 5 + ambience 2 + sfx 5 = 12), recipes.ts (adds click, success x3 variants, unlock, bell, fanfare), ambience.ts (5 room beds, ~0.6 s crossfade, resumes after pause), music.ts (adaptive: kick above intensity 0.3, hats above 0.6, tempo x1.08 at 1.0), sfx.ts facade. Mutes (suspends ctx) when hidden, resumes on unlock()/visible. No throw without an AudioContext (tests/audio.test.ts).
- Verified: `tsc` clean, `npm test` 54/54, build green. Chord voicing reduced from 4 to 2 notes to stay inside the 12-voice budget (sound changes slightly).
- Not verified: how it sounds on a device (balance, limiter behaviour, bed loudness, crossfade clicks); the real Web Audio path has no automated test (needs a browser). Callers still need to call sfx.setIntensity (Rush last 20 s) and sfx.setRoomAmbience on room switch (AI-3/AI-1).
- Verified (iso kit v0): src/art/iso.ts (isoToScreen, screenToIso, depthKey, faceShade, ISO_DIMS, boxTexture), isoBox.ts (extruded 3-tone boxes, open = dark opening + pulled slab), isoShell.ts (floor diamond + 2 walls, 5 palettes, ensureRoomShell / prefetchRoomShells one room per frame), isoKit.ts (20 kinds x closed/open + 1 prop per DECOR item, baked in generateAllTextures; isoTextureBytes). Keys: tex.isoSpot(kind, open), tex.isoShell(room), tex.isoProp(id). tests/iso.test.ts 6 tests (math round-trip, depth order, shade order, coverage, shell <= 960x640).
- Evidence: docs/status/AI-4/iso-v0-furniture.png and iso-v0-shells.png. Rendered offline by running the real draw code against a recording mock Graphics and rasterising with PIL (no browser in my sandbox), so this is the geometry and colours, not a Phaser screenshot.
- Anchor convention for AI-3: every iso_spot/iso_prop texture's origin is the TOP vertex of the footprint at floor level. Use `setOrigin(ox/w, oy/h)` with `boxTexture(ISO_DIMS[kind])`, place at isoToScreen(gx, gy, gz) + room origin, depth = depthKey(spot.iso). Shells use origin = top vertex of the floor diamond (`shellSize()`).
- Not verified: texture memory and bake times (needs a browser: not measured yet); the look inside Phaser; tint behaviour.
- Requests: AI-2 use ISO_DIMS (src/art/iso.ts) as the canonical footprint per kind and publish room cols/rows so shells match (shells use 8x8 until LAYOUTS exist). AI-3 review of art keys/helpers is due.
- Verified (iso kit v1, part 1): furniture now has a distinct silhouette and details for all 20 kinds, closed + open (drawer slides out, doors swing ajar, lids lift, rug corner flips, cushion/blanket lifted, TV lights up). Built from a sub-box composer (src/art/isoCtx.ts, isoFurnA.ts, isoFurnB.ts, isoFurniture.ts); textures carry an 18 px transparent margin so open parts never clip (boxTexture now includes PAD; anchor math unchanged: origin = top vertex of the footprint at floor level).
- Verified: room shells v1 (isoShell.ts + isoTheme.ts): five themes, plank/tile floors, rugs, skirting, windows with baked floor light patches, doors, entrance/bedroom stairs, wall frames, lamp glow. ensureRoomShell(scene, room, spec?) accepts a layout-derived ShellSpec (same shape as DEFAULT_SPECS) so AI-2's LAYOUTS can drive cols/rows/doors/windows/rug.
- Verified: badges (isoBadges.ts): padlock, check, mark_ruledOut (round, red, cross), mark_hunch (amber diamond, exclamation), iso_shimmer. The two mark textures replace the text-glyph fallback in RoomMarks; shapes differ so state is not colour-only.
- Verified: `tsc` clean, `npm test` 112/112, build green, JS gzip 400.1 KB (budget 520). Evidence: docs/status/AI-4/iso-v1-rooms3.png (living, kitchen, bedroom composed from the real draw code), iso-v1-furniture_v1.png, iso-v1-badges.png. Rendered offline via a recording mock Graphics + PIL (no browser here); strokes/arcs were checked in the badge render.
- Known issues: bedroom stairs sit tight in the back corner and clip the wall; DECOR props (cosmetics) are still v0 plain boxes; shells are 8x8 until LAYOUTS exist; window light patches were retuned after the first render looked like dark wedges.
- Not verified: Phaser rendering (anti-aliasing, tint behaviour), bake time per room, texture memory in a real browser, mobile look at 390 px.
- Not done yet: dollhouse frame/roof art (cutaway, room-lit state), avatar + cat sprites, prop v1 art, iso Organise (drag/drop view), full-time-budget perf numbers.
- Verified (iso kit aligned to AI-2 layout, replaces the earlier v1 footprints): ISO_DIMS is now KIND_FOOT from src/content/layout.ts, so every sprite matches its spot placement (drawer 1x1x3, cabinet 1x1x5, fridge 1x1x7, sofa 3x1x3, wardrobe 2x1x7, sink 2x1x3, rug 3x2x1 ...). Shells come from LAYOUTS via specFor(room): real room sizes (living 10x8, kitchen/bedroom 9x8), WALL_H 10, windows in WINDOW_Z 3..8, doors on their 1-cell entry cell. Shells no longer bake rugs, stairs, frames or lamps (those are PROPS).
- Wall mounts (jacket, keyHook, charger; all 1x1): sprite is drawn against the RIGHT wall (gy = 0). For a spot with gx = 0 (left wall, e.g. bedroom.jacket) AI-3 must mirror it: setFlipX(true) with origin x = 1 - ox/w (these footprints are symmetric so 0.5 works). Anchor stays the top vertex of the footprint at the piece's base height: place at isoToScreen(gx, gy, gz).
- Evidence: docs/status/AI-4/iso-v1b-real_living.png and iso-v1b-real_bedroom.png are real rooms composed from HOUSE spot placements and my sprites (depth-sorted with depthKey); sprites land on their cells.
- Verified: `tsc` clean, tests/iso.test.ts 10 tests including sprite footprints == layout footprints, doors/windows inside the wall, shells <= 960x640.
- Verified (props + dollhouse art, commit after 0c13b20): src/art/isoProps.ts bakes every PROPS variant (10 kinds: frontDoor, mat, runner, frame, lampFloor, lampHang, stool, pot, pouf, stairsUp; 'scale' as a bath scale), the 8 cosmetic decor pieces (mirror, print, clock, plantHerbs, curtains, lampLights, shelfTowels, rugBathMat) and the storage decor (same art as tex.isoSpot(spotKind); isoSpot is the cheaper alias). Prop ids repeat with different sizes (e.g. 'pot' h2 vs h3), so keys are tex.isoProp(`${id}_${w}x${d}x${h}`); AI-3 should call propSpriteInfo(prop) from src/art/isoProps.ts, which returns { key, flip, originX, originY }.
- Left-wall pieces (gz > 0, gx = 0, gy > 0): drawn like right-wall pieces with w/d swapped, then setFlipX(true). `spriteInfo(iso)` / `isLeftWall(iso)` in src/art/iso.ts give the same flip and the origin fractions; after the flip the origin math equals the normal boxTexture formula.
- Verified: dollhouse art. houseFrameGeometry + buildHouseFrame(scene, { colX, colStep, cols, floorY, tileW, tileH }) in src/art/isoHouse.ts: backdrop, two floor slabs, outer walls, roof edge, stair block, as plain rectangles plus two small baked textures (roof, stairs). Crisp miniatures: ensureRoomShell(scene, room, spec, true) / prefetchRoomShells(scene, rooms, true) bake `iso_shellmini_<room>` at MINI_K = 0.35 with simplified details (no plank seams, muntins, door knobs), so they do not shimmer like a downscaled full shell. Locked rooms: setTint on the mini shell plus the iso_badge_padlock texture (AI-3 keeps drawing the overlay).
- Evidence: docs/status/AI-4/iso-v1c-rooms-with-props.png (all five rooms, real HOUSE spots + PROPS, depth-sorted) and dollhouse-v1.png (HouseScene constants: colX 300, step 340, floors y 440 / 215, mini shells).
- Texture memory (estimated RGBA from the baked sizes, not measured in a browser): furniture 40 textures 2519 KB; props 38 textures 2033 KB; badges 5 textures 52 KB; full shells x5 4660 KB (baked lazily, one per frame); mini shells x5 610 KB. All at once about 9.9 MB; a normal run loads the furniture and props once and only visited rooms' full shells.
- Bake times per group: NOT measured (no browser in my sandbox). Please read them from `?debug=1` on a device.
- Not verified: how it looks inside Phaser, tint behaviour, fps. Known: the upper-left dollhouse slot is empty because HOUSE_MAP has no upstairs room at col 0 (layout, not art).

## Phase 4 (AI-4, Art Director / Technical Art / Audio / FX)
- Verified (Phase 0 push): `docs/art/ART-BIBLE.md` v1, `docs/art/palette.json` (64 colours: 12 ramps x 5 + 4 specials, checked unique), `docs/art/ASSET-LIST.md` + `asset-list.json` (generated by `python3 tools/assetlist/build.py`: 777 planned frames, 148 unique props, 20 + 12 spot kinds), `docs/art/LICENSES.md` ledger (Kenney Furniture Kit 2.0, CC0, read from the zip's License.txt), `src/art/manifest.ts` stub (+ tests/art-manifest.test.ts). `npx tsc --noEmit` clean, `npm test` 216/216, `npm run build` green, JS gzip 427.8 KB.
- Decision: base for Track A is the Kenney OBJ models (141 px pre-rendered PNGs are too small and low-poly lit; OBJ loads in trimesh with per-material colours, e.g. loungeSofa 256 faces). The pack has 140 models; wall/door/window/stairs parts exist (wall, wallWindow, doorway, stairs, floorFull), so the Building Kit is not needed yet.
- Numbers for AI-1 (Contract v4): `ART = { px: 3, tileArtW: 32, tileArtH: 16 }`, `ISO = { tileW: 96, tileH: 48, unitH: 12 }` (unit = 4 art px; a cell is 4 units tall = tileH; wall 10 units = 40 art px). Current types.ts still has ISO 64/32/16: AI-3 must not hard-code either.
- Not verified: anything visual or audible (no renders yet this phase); the Art Bible numbers are untested against a rendered sprite until tools/render3d lands.
- Verified (render3d v0): `tools/render3d/render.py` + `models.json` render 10 Kenney models (sofa, fridge, bed, tv, plant, sink, coffee table, floor lamp, bookcase, stool) to palette-exact sprites; sizes match the grid maths (sofa 3x1x3 -> 67x44 art px). Off-palette/partial-alpha pixels counted by script: 0. Evidence: docs/art/evidence/render3d-v0-sheet.png (rendered, viewed by me). Run: `python3 tools/render3d/render.py tools/render3d/models.json <kenney OBJ dir> <out dir>`.
- Weak so far: sofa reads as a flat slab (no visible backrest/arms), no internal outlines between materials, no closed/open variants, no wall/floor materials yet. Orientation convention is now: against the right back wall, facing +gy.
- Verified (materials + QA): `tools/materials/gen.py` generates plank/checker/stone floors, striped/plain wallpaper, wainscot and trim, projected onto the iso diamond and both walls (living 10x8, kitchen 9x8, bedroom 9x8 shells, 10 units tall). `tools/check-frames/check.py <dir>`: palette, alpha 0/255, naming, size, padding; 13 files, 0 problems. Evidence docs/art/evidence/rooms-v0.png (shells + render3d sprites composed; viewed by me). Looks like clean cohesive indie, far from Ref 1 density: 4-7 pieces per room, no window light, no rugs/props yet.
- Weak: floor lamp and TV model read wrongly (lamp = white box, TV lies flat), trim is thin, no windows/doors in shells, no dither shadows. Not verified in Phaser.
- Verified (pixel DSL + props v0): `tools/pixelart/dsl.py` (rows + legend `ramp.tone`, auto 1 px outline, 1 px padding) and `props.py` with 18 hand-built props (teapot, mug, bread, apple, book stack, open book, cactus, fern, tulips, succulent, plate, kettle, cookies, record, alarm clock, candle, umbrella, cat bowl). check-frames: 18 files, 0 problems. Evidence docs/art/evidence/props-v0.png (viewed by me).
- Weak: alarm clock face, mug handle, vinyl record and tulip pot read poorly at 1x; props are 6-10 px wide so they need grouping (shelves, table settings) to feel rich. 18 of 148 planned props exist.
- Next: closed/open variants for spot kinds, windows with light, more props, AUDIO-LIST.md + tools/audio, pixel font choice.
- Requests: AI-1: land Contract v4 with the ART/ISO values above; `scripts/check-assets.mjs` should read `docs/art/LICENSES.md` (first column is the asset name, last column says which `assets/` paths it covers).
