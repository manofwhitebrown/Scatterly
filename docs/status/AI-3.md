# AI-3 status (Phase 5, Scenes and UI)
> **Manager inbox: read docs/manager/TO-AI-3.md first.**

## Done
- src/scenes/homeWorld.ts: iso projection (32x16 art px), HOUSE_WORLD adapter (ground: entrance|living|kitchen; upper: bathroom|bedroom|study), LINKS, camera fit/lerp, silhouette hit-test, taps-from-overview.
- src/scenes/homeDraw.ts: placeholder cutaway shells (floor, two walls, slab) per room.
- src/scenes/HomeScene.ts (`?view=home`): standalone world scene, Overview <-> Focus tween (300 ms, instant when calm), 96 px back chip, door chips to linked rooms, unfocused rooms dimmed and inert, `__e2e` hooks (hotspots, focus, overview, focused).

- HomeMenu (menu-as-house): Play / Journal / Settings over the Overview; Play opens a small sheet with Relaxed/Rush/Daily chips, Short/Standard/Long chips (saved to settings) and Start. Under `?view=home` the Menu redirects to Home; Start still runs the old Room scene (runScene = Room) until RoomRun moves into Home.
- Play now starts the morning INSIDE Home: HomeScene runs RoomRun (HUD, clock, inspect, gates, puzzles) with HomeSpots as its view (placeholder iso boxes, open state, nearest-centre taps at 112 px, long-press marks, only the focused room's pieces tappable). ROOM_SIZE adapter now matches the legacy room layouts so all spots fit (tested).
- Home run polish: HUD house button zooms back to the Overview (RunHost.onHouse), deduction badges (x / ?) in Home, camera pushes onto a lock before its puzzle opens and resets after.
- Home now uses AI-2's world layout (ROOM_SIZE, HOUSE_MAP_V2, WORLD_DOORS + stairs as links) and draws every WORLD_DECOR prop as a facing-aware placeholder box (front face lighter), windows, door gaps and wall mounts (src/scenes/homeProps.ts).

## Verified
- `npx tsc --noEmit`: no errors. `npx vitest run tests/home`: 10 home tests; 340 total. `npm run build`: ok (dist 2245 KB, over the 2048 KB soft budget, under the 2560 KB limit). `npm run secret-scan`: clean.

## Not verified
- Not seen in a browser: no Playwright browser here, `npm run shots` does not exist yet (Gate 0). No screenshot, so no Gate A claim.
- Not pushed: no GITHUB_TOKEN in this session.
- Feel on a phone: only the owner can judge.

## Requests
- AI-1: tests/shots/shots.spec.ts still goes Play -> ModeSelect; under `?view=home` Menu now redirects to Home and Play opens a sheet, so the committed home-overview/focus-* PNGs show the OLD room. New path: openGame('&view=home'), tap 'Play' (sheet), tap 'Start', wait scene Home; overview shot = before Play (scene Home, no data).
- AI-1: `npm run shots` (home-overview, focus-<room>). AI-2: ROOM_SIZE / HOUSE_MAP v2 to replace the adapter in homeWorld.ts. AI-4: shell/<room> and prop/<id> frames.

## Design note for manager
- With floor 1 raised 72 art px and rooms 8 deep, an upper room covers the back half of the ground room below it (upper wins hit-tests). Needs a layout decision (shallower upper rooms or a set-back).

## Next
- Pinch-out/drag; Continue button (needs AI-2 snapshot capture); baked room layer and props; interactive pieces; RoomRun inside Home.
