# AI-3 status (Phase 5, Scenes and UI)

## Done
- src/scenes/homeWorld.ts: iso projection (32x16 art px), HOUSE_WORLD adapter (ground: entrance|living|kitchen; upper: bathroom|bedroom|study), LINKS, camera fit/lerp, silhouette hit-test, taps-from-overview.
- src/scenes/homeDraw.ts: placeholder cutaway shells (floor, two walls, slab) per room.
- src/scenes/HomeScene.ts (`?view=home`): standalone world scene, Overview <-> Focus tween (300 ms, instant when calm), 96 px back chip, door chips to linked rooms, unfocused rooms dimmed and inert, `__e2e` hooks (hotspots, focus, overview, focused).

- HomeMenu (menu-as-house): Play / Journal / Settings over the Overview; Play opens a small sheet with Relaxed/Rush/Daily chips, Short/Standard/Long chips (saved to settings) and Start. Under `?view=home` the Menu redirects to Home; Start still runs the old Room scene (runScene = Room) until RoomRun moves into Home.

## Verified
- `npx tsc --noEmit`: no errors. `npx vitest run tests/home`: 9 passed (333 total). `npm run build`: ok (dist 2245 KB, over the 2048 KB soft budget, under the 2560 KB limit). `npm run secret-scan`: clean.

## Not verified
- Not seen in a browser: no Playwright browser here, `npm run shots` does not exist yet (Gate 0). No screenshot, so no Gate A claim.
- Not pushed: no GITHUB_TOKEN in this session.
- Feel on a phone: only the owner can judge.

## Requests
- AI-1: `npm run shots` (home-overview, focus-<room>). AI-2: ROOM_SIZE / HOUSE_MAP v2 to replace the adapter in homeWorld.ts. AI-4: shell/<room> and prop/<id> frames.

## Next
- Pinch-out/drag; Continue button (needs AI-2 snapshot capture); baked room layer and props; interactive pieces; RoomRun inside Home.
