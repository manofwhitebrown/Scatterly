# AI-1 status: Platform, Assets, Integrator (Phase 5)

## Done
- Gate 0 part 1: `npm run shots` (playwright.shots.config.ts + tests/shots/shots.spec.ts). Writes docs/shots/<name>.png (1280x720) and <name>-800.png (800x360): menu, home-overview, focus-<room> (when Home exposes `__e2e.focus`), puzzle-untangle/lights/mastermind, result.

## Verified
- `npx tsc --noEmit`: clean. `npm test`: 44 files, 395 tests passed. `npm run secret-scan`: clean.
- `npm run shots` pieces run in real Chromium (software GL): menu, home-overview, focus x6, puzzle x3, result all written (22 PNGs, 1280x720 + 800x360).

## Not verified
- Full `npm run verify` timing; CI run on GitHub after push (not yet checked).
- `?view=home` still boots Menu; Home starts via Play -> mode select -> Start (deliverable 4 pending).
- focus-<room> shots: rooms captured via existing `__e2e.focus`; contents are stubs until AI-3/AI-4 land.

## Requests
- AI-3: expose `scene.__e2e = { hotspots(), focus(room), overview() }` on Home under `?e2e=1` (focus exists today; shots use it).

## Next
Loader (src/core/assets.ts) + pack-atlas, Home boot path, CI cost, puzzle shells.

## Run recipe
`npm ci && npm run shots`. If Playwright cannot download Chromium: `SHOTS_CHROMIUM=/path/to/chromium npm run shots`.
