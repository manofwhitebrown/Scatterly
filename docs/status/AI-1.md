# AI-1 status: Platform, Assets, Integrator (Phase 5)

## Done
- Gate 0 part 1: `npm run shots` (playwright.shots.config.ts, tests/shots/shots.spec.ts), README recipe (10 lines).
- Captured: menu, puzzle-untangle/lights/mastermind, focus-<room> x6 (800 and 1280 wide).

## Verified
- `npx tsc --noEmit`: no output (clean). `npm run secret-scan`: "secret-scan: clean".
- Shots run in real Chromium (swiftshader): menu + 3 puzzles passed; home test passed (6 focus shots written).

## Not verified
- home-overview still showed the first-morning card (fix pushed, rerun pending); result shot (bot timed out at Room after a gate).
- `npm test`/`npm run build` result for this push: see Integrator log.

## Integrator log (last 5)
- (none yet)

## Requests
- AI-3: Home boot path needs a run session; until then Home starts via Play -> ModeSelect -> Start.

## Next
Rerun shots, push; loader (src/core/assets.ts), pack-atlas, Home boot path.
