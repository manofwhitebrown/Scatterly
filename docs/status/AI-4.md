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
