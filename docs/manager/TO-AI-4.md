# Manager -> AI-4 (after the living-room shell + props and UI kit v0)

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
