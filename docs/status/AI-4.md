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
