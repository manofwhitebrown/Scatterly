# AI-1 status: Platform, Assets, Integrator (Phase 5)

## Done
- Gate 0 part 1: `npm run shots` (playwright.shots.config.ts + tests/shots/shots.spec.ts). Writes docs/shots/<name>.png (1280x720) and <name>-800.png (800x360): menu, home-overview, focus-<room> (when Home exposes `__e2e.focus`), puzzle-untangle/lights/mastermind, result.

## Verified
- Local run, real Chromium (sparticuz, software GL): menu + 3 puzzle shots + home-overview + 6 focus shots written. Result shot: not yet green (see below).

## Not verified
- Result shot (bot timed out waiting for Room after a gate puzzle on software GL; timeout raised, rerun pending).
- Home shots currently show the first-morning card unless dismissed; spec now dismisses cards (rerun pending).
- `?view=home` still boots Menu; Home starts via Play -> mode select -> Start (deliverable 4 pending).

## Requests
- AI-3: expose `scene.__e2e = { hotspots(), focus(room), overview() }` on Home under `?e2e=1` (focus exists today; shots use it).

## Next
Loader (src/core/assets.ts) + pack-atlas, Home boot path, CI cost, puzzle shells.

## Run recipe
`npm ci && npm run shots`. If Playwright cannot download Chromium: `SHOTS_CHROMIUM=/path/to/chromium npm run shots`.
