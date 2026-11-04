# AI-1 status: Platform, Assets, Integrator (Phase 5)

## Done
- Gate 0: `npm run shots` (playwright.shots.config.ts + tests/shots/shots.spec.ts); each capture asserts its scene first (Home via ?view=home).
- TO-AI-1 #1: shots regenerated on real WebGL; home-overview shows the Home scene (stub boxes, 3 buttons).
- TO-AI-1 #2: `check_fronts.py` is in `npm run verify` (already in package.json).
- TO-AI-1 #4: pixel-crispness e2e CLOSED. Root cause was not Phaser config: this sandbox Chromium had no WebGL with `--use-gl=swiftshader`, so Phaser silently fell back to the Canvas renderer (26x25 px sprite), and the test ran mid camera-fade (colours 102/187 instead of 255). Fix: GL flags `--use-angle=swiftshader --enable-unsafe-swiftshader` in both Playwright configs; test waits for the fade to end, asserts renderer is WebGL, no longer skipped.

## Verified
- `npx tsc --noEmit`: clean. `npm test`: 44 files, 395 tests passed.
- `npx playwright test tests/e2e/pixel.e2e.ts`: 1 passed (8x8 sprite at x3 = exact 3x3 blocks, WebGL).
- `npm run shots`: 6 passed, 22 PNGs rewritten in docs/shots.
- `npm run build`: dist 2264.3 KB (budget 2048, limit 2560), JS gzip 446.1 KB (budget 520).

## Not verified
- Full `npm run verify` timing and the GitHub CI run after this push.
- Pixel test on a real phone GPU (only software WebGL here).
- `?view=home` still boots Menu first by default (deliverable 4 pending); shots reach Home via the flag.

## Dist size (TO-AI-1 #3), numbers
- phaser chunk 1478 KB (65%): engine is locked; not shrinkable without a custom Phaser build.
- audio 492 KB (38 files; music_lofi_a.ogg 98 KB, amb_rain.ogg 92 KB, purr x3 39 KB).
- app JS 352 KB, atlas 80 KB, fonts 28 KB.
- Lazy loading does not reduce dist size, only first-load time.

## Requests
- Manager: decide: raise distMB budget to 2560 (the existing hard limit) or have AI-4 re-encode the two big loops at lower bitrate (public/audio is theirs; about 100 KB saving is not enough alone for 216 KB).
- AI-3: expose `scene.__e2e = { hotspots(), focus(room), overview() }` on Home under `?e2e=1` (focus exists today).
- Everyone: in sandboxes use `--use-angle=swiftshader --enable-unsafe-swiftshader` for WebGL.

## Next
Loader (src/core/assets.ts) + pack-atlas, Home boot path (?view=home minimal edit), CI cost, puzzle shells + hint ladder.

## Run recipe
`npm ci && npm run shots`. If Playwright cannot download Chromium: `SHOTS_CHROMIUM=/path/to/chrome npm run shots`.
