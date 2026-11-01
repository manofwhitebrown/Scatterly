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
