# Scatterly Art Bible v1 (AI-4, Phase 4 "High-End Cozy")

Authority: this file defines the look. `docs/art/palette.json` is the machine-readable palette. Nothing ships that breaks a rule here; `tools/check-frames` enforces the checkable ones.

## 1. Numbers (final, for Contract v4)
```ts
export const ART = { px: 3, tileArtW: 32, tileArtH: 16 } as const;   // 1 art px = 3 game px
export const ISO = { tileW: 96, tileH: 48, unitH: 12 } as const;     // game px; tileW = 32*3, tileH = 16*3, unitH = 4 art px * 3
```
- Native art canvas 427x240 art px (1281x720 game px). Every sprite is stored at native size and drawn at scale exactly 3.
- One height unit = 4 art px. A full cell height = 4 units = 16 art px = tileH. Wall height 10 units = 40 art px. Fridge (7u) = 28 art px.
- Camera: 2:1 dimetric. The 3D renderer uses orthographic yaw 45 deg, elevation 30 deg, then resamples to the 2:1 diamond (32x16 art px per cell). Footprint convention unchanged: anchor = TOP vertex of the footprint diamond at the piece's base height.
- Snap: positions are multiples of 3 game px (`snap()`); no fractional scale, no rotation, no smoothing.

## 2. Palette
- 64 colours total: 12 ramps x 5 + 4 specials (`palette.json`). Ramp order is `[outline, shadow, base, light, highlight]`.
- Specials: `ink` (text, never pure black), `paper`, `glow` (lamp/window light), `shade` (cast shadow colour).
- Never use pure black or pure white. No colour outside the palette, ever (G13/check-frames). Alpha is allowed only 0 or 255 in art (soft shadow = dithered `shade`, not alpha).
- Warm/cool pairing: every room uses a warm ramp for light and a cool ramp for shadow side (living: woodWarm lit, plum shadow accents; bedroom: sky walls with rose accents). Per-room ramps are in `palette.json > rooms` (wall / floor / accent). A room may use at most those 3 ramps plus `woodWarm|woodDark|stone` for furniture and `sage` for plants.
- Mood: living = warm honey + terracotta (Ref 1); kitchen = butter + sage + stone tile; bedroom = airy sky + rose; bathroom/balcony = light teal/sky glass rooms (Ref 3); study = navy + walnut + butter lamp; garden = sage + plum flowers.
- Day/night overlay (runtime, ONE multiply rectangle, not part of the 64): morning #ffe9cf, noon #ffffff, dusk #ffc79a, night #6f7bb8.

## 3. Light and shading
- Light comes from the upper left, slightly front. Top face = `light`, left face (SW side) = `base`, right face (SE side) = `shadow`. Cast shadow on the floor falls to the right/back as dithered `shade` (checker dither, never alpha).
- 3 flat tones + highlight: `highlight` pixels only on the upper-left edge of top faces and rounded curves (1 px, max 12% of a sprite's pixels). No gradients, no anti-aliasing.
- Window light: floor patches of `glow` over the floor base using a 2x2 ordered dither at the patch edge; patch follows the window cell shifted +2 cells along the floor diagonal.

## 4. Outline
- 1 px, colour = ramp[0] of the fill's ramp (a darker hue of the fill, never black). Outer silhouette only plus a 1 px inner line where two different materials meet. No outline on the floor-contact side of the base edge when it touches its own cast shadow.
- Highlights never touch the outline.

## 5. Dither
- Ordered 2x2 Bayer only, max 2 tone steps, used for: cast shadows, window light edge, rug/wallpaper shading, wall-to-floor ambient occlusion. No noise dither, no error diffusion.

## 6. Materials (built by the algorithmic generators in `tools/materials`)
| Material | Rule |
|---|---|
| Plank floor | 4 art px wide planks along the iso axis, 1 px `shadow` seams, every 3rd plank offset by 5 px, 2 grain flecks per plank in `light`. |
| Checker floor | 2x2 tiles of 8x4 art px diamond halves alternating `base`/`light`, 1 px grout in `shadow`. |
| Stone tile | 16x8 art px tiles, grout `outline`, rare `highlight` chip. |
| Wainscot | lower 14 art px of the wall: panel boxes 10 px wide with 1 px top bevel; top rail 2 px `light`, 1 px `outline` under it. |
| Striped wallpaper | stripes 4 px base / 4 px light, 1 dither row at the wainscot seam, thick trim: top 3 px rail (`woodDark` ramp). |
| Rug | 1 px border `outline`, 2 px pattern band (diamond or stripe) in the accent ramp, fringe 1 px ticks at the short ends. |
| Stairs | per step: top `light`, riser `base`, side `shadow`, 1 px nosing `highlight`. |
| Window | frame 2 px `woodDark`, glass `sky` ramp light with a 3 px diagonal `highlight` glint; muntin cross 1 px; sill 2 px. Day/night art switches the glass ramp. |
| Fabric | 2 tones plus a 1 px fold line in `shadow`; patterns (plaid, dots) 1 px, max 2 colours. |
| Metal / glass | stone ramp, `highlight` glint line; glass = `sky` highlight, 1 px diagonal. |

## 7. Frame rules
- Naming (Contract v4, section 8): `spot/<kind>/<closed|open>`, `prop/<id>`, `shell/<room>/<part>` (parts: `floor`, `wallL`, `wallR`, `trimL`, `trimR`, `window<n>/<day|dusk|night>`, `door<n>`, `stairs`), `ui/<name>`, `icon/<item>`, `fx/<name>/<n>`, `avatar/<dir>/<anim>/<n>` (dir `se|sw`, mirrored for `ne|nw`), `pet/cat/<anim>/<n>`, `puzzle/<kind>/<name>`, `mat/<name>` (tileable materials).
- Directions: pieces are authored standing against the right back wall facing +gy (screen lower-left); the left-wall version is the mirrored frame (`flipX`), authored separately only when lighting would look wrong (lamps, windows).
- Padding: 1 transparent px around the sprite (UI nine-slices and `mat/*` tiles are edge-to-edge, exempt); open parts (drawer, door ajar) stay inside the frame box of the `open` variant, which is the max extent for both states. Both states share the same anchor and frame size.
- Size limits: furniture <= 96x96 art px, props <= 48x48, icons 16x16 (and 32x32 for the large set), UI nine-slices 24x24 minimum cell, fonts 8 art px cap height (24 game px).
- Anchors: stored as `pivot` in the atlas JSON (x,y in art px from the top-left of the frame) = top vertex of the footprint diamond at base height. Wall mounts: pivot is the top vertex of the footprint on the wall base line; left-wall pieces are the mirror (flip) of right-wall pieces.
- Animation tags (Aseprite style `frameTags`): `idle`, `open`, `close`, `walk`, `sleep`, `react`, `loop`, `once`. Cat: `sleep`, `idle`, `walk`, `react`, `eat`. Avatar: `idle`, `walk` (6 frames), `reach`. Ambient: `loop`.
- Frame times: walk 100 ms, idle 400 ms, ambient loops 150-300 ms. Reduced-motion: only the first frame plays.
- State variants: every interactive spot has `closed` and `open`. Container extras: `locked` is a runtime overlay (`ui/padlock`), not a frame.

## 8. Atlas groups
`core` (UI kit, bitmap font, avatar, cat, icons) / `house` (dollhouse frame + mini shells) / `room:<id>` (shell, materials, props, spots for that room) / `puzzle:<kind>`. Atlas PNGs are indexed PNG8 where the palette (<= 64) allows; JSON is Aseprite-style `frames` + `meta.frameTags`. Atlas size cap 1024x1024 each; budget in `docs/art/ASSET-LIST.md`.

## 9. UI style
- Wood panels: nine-slice, 1 px `woodDark[0]` outline, 2 px `woodWarm[3]` inner bevel top/left, `woodWarm[1]` bottom/right, inset face `woodWarm[2]`. Buttons: 3 states (up, hover/focus, pressed = face moves down 1 art px). Pressed feedback in the same frame.
- Paper notebook: `plaster[3]` page, `plaster[1]` ruled lines every 6 px, `terracotta[2]` margin line, spiral holes `stone[1]`.
- Item tray: shelf of `woodDark` with 8 slots (inset 24x24 art px), items drawn as 16x16 icons.
- Font: an OFL pixel font (candidate: "Silkscreen" or "Pixelify Sans", OFL 1.1, from Google Fonts, decided at slice time, licence recorded in the ledger), converted to a Phaser bitmap font. Body 8 art px cap height; minimum play-time text 28 game px; ink colour `ink`, on-wood text `paper`.
- Cursor: hand cursor (16x16, 3 states: point, press, drag) on desktop only.
- No default rounded rectangles, no system fonts, no translucent black boxes; panels are always pixel panels.

## 10. Lighting plan
1. Baked into art: window light patches on floors, lamp glow circles (dithered `glow` over `base`), wall-to-floor AO dither.
2. One multiply rectangle for time of day (4 key colours above, linear blend, 3 s tween), optional `matchClock`.
3. Window art switches (`day|dusk|night`) with the same transition; night windows show `navy` sky and `butter[4]` stars; cheap rain at windows is a 12-sprite pooled streak particle in the focused room only.
4. `high` quality tier only: Phaser camera FX (vignette + subtle colour grade). Never per-sprite FX.

## 11. What this look cannot do (honest limits)
Hand-pixeled richness (character in every prop) is not reachable from converted low-poly models. We close the gap with density (25-40 props per room), strict palette, baked light, animated ambience and sound. Anything that reads as "default" or mixed-scale is a defect, not a style.

## Theme v2 (manager order): no dark brown fills
- Rule: no dark brown fills anywhere. Wood is only furniture, in the lighter honey/peach `woodWarm`/`woodDark` ramps (outline plum-brown `#6a3f45`, never a large dark area). Trim, wainscot and the floor slab edge are painted: cream trim, per-room sage/teal/rose wainscot, teal slab. Backdrop and outlines use ink `#2a2030`.
- UI: nine-slice panels use the `slate` ramp (panel `#2d4a53`, hi `#3f6a72`, lo `#1f3338`, outline `#16252a`); paper is cream `#fff3dc`. Buttons keep their keys: `btn_wood` = sun orange (butter ramp, primary), `btn_sage` = teal (secondary), `btn_terracotta` = danger.
- `palette.json > theme` is the single source for AI-3's `src/ui/theme.ts`. The `plum` ramp was replaced by `slate` to stay at 64 colours.
