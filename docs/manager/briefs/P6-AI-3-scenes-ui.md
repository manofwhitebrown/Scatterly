# Scatterly, Phase 6 (the finish). Read ALL of this, then your role at the end.

You are AI-3, one of four NEW AIs (AI-1 to AI-4) taking over a half-built game. Four earlier AIs built about 60 percent of it and ran out of usage. The manager is Claude (it reviews your pushes and writes defect lists). The owner owns the game, is NOT technical, and judges only by screenshots in `docs/shots/` and by playing on a phone. When you write to the owner, use plain language, no jargon.

## 0. Your first 20 minutes (do exactly this, in order)
1. Set the token and clone the repo (section 3).
2. `npm ci` then `npm run verify`. Write down the real numbers (tests passed, dist size). One test file may be red when you arrive (see section 2): AI-3 fixes it first; others do not touch it.
3. Read: `docs/status/AI-*.md` (what the old AIs did and left open), `docs/art/ASSET-LIST.md`, `docs/art/ART-BIBLE.md`, and the first 60 lines of the files you own. `docs/manager/*.md` are the OLD orders: history only. Everything in THIS brief overrides them; items that are still open there are copied into your role section.
4. `npm run shots` (see section 4 for the sandbox flags), then look at the PNGs in `docs/shots/` yourself. Compare with the owner's 3 reference images (the owner attaches them to your chat: warm pixel-art iso cutaway houses). You are responsible for what is on screen in your area; say plainly in your status file where it still looks weak.
5. Create `docs/status/AI-N.md` (replace the old text, max 60 lines).

## 1. The game and what the owner wants
Scatterly is a cosy "where did I put it?" game: each morning, find 3-6 lost things (keys, phone, wallet...) by searching a house, opening drawers, solving small locks and puzzles, in about 30 minutes. Modes: Relaxed (default), Rush (timer), Daily (same case for everyone that day).
Target: ONE connected cosy house seen from outside as an isometric cutaway with 2 floors (ground: entrance | living | kitchen; upper: bathroom | bedroom | study, one staircase living to bedroom). Tap a room: the camera zooms in; inspect furniture, open drawers, solve locks; tap back and it zooms out. The references are dense (25-40 props per room), wood trim, striped wallpaper, window light, a pet, wooden UI panels.
Device: phone, landscape. Delivery: web (GitHub Pages: https://manofwhitebrown.github.io/Scatterly/) and Android APK (Capacitor). Engine: Phaser 3.80, TypeScript strict, Vite, Node 20. The engine is locked.
Honest ceiling: free assets plus code reach "clean cozy indie", not hand-drawn reference quality. We close the gap with density, one strict palette, light, small animation and sound.
Pillars: it feels like a place you could live in; every tap is satisfying (look, sound, motion); "one more morning" (about 30-minute cases, interesting puzzles); cosy, no dark patterns.

## 2. Where the build stands (measured by the manager, 4 Nov 2026, about 09:20 UTC)
Works: Home is the default view (plain URL); legacy screens only via `?view=legacy` / `?view=iso`. House overview with sky and yard, Overview/Focus zoom, pinch and drag, Play sheet (Relaxed/Rush/Daily + session length), cat, avatar walking, spot pieces with closed/open art for living, kitchen and bedroom, 66 decor kinds all have art frames, shells for all 6 rooms, lit-window frames, 3 puzzle panels, asset loader and atlases, Back button router, background pause, how-to cards and 3-rung hint ladder UI in puzzles, case builder with day ramp, session sim bots, 457 tests passing, build 2400 KB (budget raised to 2560 KB hard limit; the size script may still say 2048: fix it).
Red or open on arrival: (a) `tests/home-geometry.test.ts` fails ("window is not defined": it imports Phaser in node) so `npm test` is red; AI-3 fixes it first. (b) The 30-minute case is not 30 minutes: AI-2's own sim shows median casual time 9-15 min; the test is marked `it.fails`. (c) Audio is thin (12 synthesised base sounds x 3, one music loop, one ambience).
Owner playtest defects (from screenshots, all still to be verified fixed or fixed by you):
- HUD buttons overlap: "< HOUSE" covers the pause button; room-nav buttons (BATHROOM, LIVING) cover top-right buttons; the progress strip text is faint over the wall; "Show tappables" is a giant slab; item tray icons are unreadable dark blobs.
- Focus view: neighbouring rooms are dimmed unevenly; the room below shows bright props under the focused room's floor edge; the staircase is huge and stands outside the room on its front edge.
- Overview: rooms looked EMPTY from outside on the newest build (no props, no cat); older builds had rooms overlapping each other (fixed by the upper floor set-back (-6,-6), verify).
- Art: bed is a flat pink slab; rug is a huge saturated diamond; the same teal spiky plant six times; windows are flat pale squares; avatar is a flat block person that does not match the art; tappable pieces were plain boxes (now partly fixed).
- Puzzle screens look like a generic web app (system font, default rounded buttons, Hint/Notes/Skip hanging off the panel, black backdrop).
- Purple bars at the left and right on laptops and phones (the game is fixed 16:9). Measured: 20 percent of a 20:9 phone screen wasted.

## 3. Repo, token and git (read twice)
Repo: https://github.com/manofwhitebrown/Scatterly , branch `main`. Everyone pushes to `main` (no branches, no PRs).
GitHub token (owner's, expires in about a week, access to this repo only):
`<TOKEN: the owner gives it to you in your session, never in a file>`
Token rules, no exceptions:
- Use it ONLY as a shell variable: `export GITHUB_TOKEN='<token>'` (re-export it in every new shell). Never write it into any file, commit, log, status doc, test, comment or chat message. Never print or echo it.
- THIS BRIEF FILE CONTAINS THE TOKEN. Keep it outside the repo folder (for example `/tmp`). Never copy it, or any text from the token line, into the repo tree.
- Clone: `git clone https://github.com/manofwhitebrown/Scatterly && cd Scatterly` (public repo, no token needed to clone).
- Push with exactly: `git -c http.extraheader="Authorization: Basic $(printf 'x-access-token:%s' "$GITHUB_TOKEN" | base64 -w0)" push origin main`. Pull with the same `-c http.extraheader=...` before `pull --rebase`.
- Set your identity once per clone: `git config user.name "AI-N"` and `git config user.email "ai-N@scatterly.invalid"` (N = your number).
- Before EVERY commit run `npm run secret-scan` (must pass). If you ever see the token in the repo or in a commit, stop and tell the owner immediately.
Git rhythm: PUSH FREQUENTLY. After every finished unit and at least every 30 minutes: `git pull --rebase`, then `npm test && npm run build`, push only if both are green. Never force-push. Commit messages `AI-N: <what>`. Never end a session with unpushed work. Several AIs push to the same `main` all day: pull before you start each unit and expect other people's commits.

## 4. Working rules
- Strict TypeScript, no `any`, no `@ts-ignore`, no TODO/FIXME, every source file under 400 lines, no `console.log` outside `?debug=1`.
- Every feature ships with a test (logic) or an e2e/screenshot step (visual) in the same push.
- Folder ownership is strict (section 7). Need a change in someone else's folder? Write it under "Requests" in your status file, addressed `-> AI-M`. EXCEPTIONS: (1) if `main` is red and the fix is tiny, any AI may patch it and note it in status; (2) a one-line wiring change is fine if the owner of that folder is out of reach for more than a few hours, noted in status.
- At the START of every unit of work: `git pull --rebase`, then read the "Requests" sections of `docs/status/AI-*.md` and answer every request addressed to you (do it, or reply under Requests why not). Old AIs lost days because requests went unread.
- NOTHING PAID. Allowed sources: CC0/public-domain assets the owner supplies (for example the Kenney Furniture Kit zip), assets you build or synthesise yourself, OFL fonts. Every external asset gets a line in `docs/art/LICENSES.md`; `npm run check-assets` fails CI otherwise. Never commit non-CC0 material.
- Status file `docs/status/AI-N.md`, max 60 lines, replace stale text, sections: Done / Verified (command + pasted output) / Not verified / Requests / Next. Never write "should work". How a thing FEELS can only be judged by the owner on a phone: say so.
- Token economy (the owner pays per token): read narrowly (`grep -n`, `sed -n 1,60p`, `| tail -20`), edit with small patches, run affected tests while iterating and the full suite once before each push, render screenshots once per milestone. If an approach fails 3 times, write the exact error under Requests and move on.
- No speculative features. Do only what is in your list and not on the freeze list. Prop ids, spot ids, room ids and decor ids are saved by players and are art keys: additive changes only, never rename or remove.
- Sandbox notes: `npm run shots` needs WebGL. If Playwright cannot download Chromium use `SHOTS_CHROMIUM=/path/to/chrome npm run shots` with the flags `--use-angle=swiftshader --enable-unsafe-swiftshader`; without WebGL Phaser silently falls back to Canvas and pixel tests lie. Do not start a local server with `pkill -f` patterns that match your own command line.
- Useful commands: `npm test`, `npm run build`, `npm run verify` (secret-scan, tsc, tests, build, check-assets, e2e smoke), `npm run e2e`, `npm run shots`, `npm run art:sheet`, `npm run pack-atlas`, `npm run check-fronts`, `npm run secret-scan`. URL flags: `?view=legacy`, `?view=iso`, `?debug=1` (overlay), `?e2e=1` (test hooks), `?artdebug=1`.

## 5. Fixed interfaces (do not redesign; read the code, do not hard-code numbers)
- Projection (art px): `sx = (gx - gy) * 16`, `sy = (gx + gy) * 8 - h`. One tile = 32x16 art px. ART.px = 3 (1 art px = 3 game px, integer only, no rotation or smoothing of sprites). Wall height 64 art px, floor slab 8, floor 1 is raised 72 art px. A room's back corner is its local (0,0); gx runs down-right (the right back wall is gy=0), gy runs down-left (the left back wall is gx=0).
- World layout (`src/content/world.ts`): `ROOM_SIZE` (entrance 8x9, living 12x9, kitchen 10x9, bathroom 8x9, bedroom 12x9, study 10x9), `HOUSE_MAP_V2` (world cell origin per room; the upper floor is shifted back by (-6,-6) so it does not cover the ground floor), `WORLD_DOORS`, `STAIRS` (staircase footprint 1 wide x 3 deep). Decor: `src/content/worldProps.ts`, `worldKinds.ts`, `worldPropsA/B.ts`. Spots (the tappable pieces, 6-12 per room) live in `src/content/layoutSpots.ts` and `spot.iso = { gx, gy, w, d, h, gz }`. Walk grid: `worldGrid.ts`, paths: `src/logic/worldPath.ts`.
- FACING: every placed object has `rot` = the direction its FRONT faces: 0 = +gy (down-left on screen), 1 = +gx (down-right), 2 = -gy (up-right), 3 = -gx (up-left). Against the right back wall (gy=0) use rot 0, against the left back wall (gx=0) use rot 1. Sofas, beds, TVs, cabinets, stoves, fridges and shelves face INTO the room; seats face the TV or table. Kenney models natively face -z; `tools/render3d/fronts.json` holds the verified fronts. Nobody guesses.
- Art keys (`src/art/manifest.ts`): `frame(key)` returns a frame or undefined (then use the procedural fallback). Keys: `shell/<room>/...`, `prop/<kind>` (+ `_L` for left-wall mounts), `spot/<kind>/closed|open`, `ui/<name>`, `icon/<item>`, `avatar/<dir>/<anim>/<n>`, `pet/cat/<anim>/<n>`, `puzzle/<kind>/<n>`, `fx/<name>/<n>`. One global palette of at most 64 colours (`docs/art/palette.json`); `theme` block drives UI colours.
- Loader (`src/core/assets.ts`): `ensureGroup(scene, group)`, `prefetchGroups`, `hasFrame(key)`. Groups: `core`, `house`, `room:<id>`, `puzzle:<kind>`. A failed load falls back to procedural art and never crashes. New art and audio must be lazy-loaded groups, never part of the boot payload.
- Test hooks under `?e2e=1` only: `scene.__e2e = { hotspots(), focus(room), overview(), ... }`. Hooks must never exist without the flag and never change gameplay.
- Screenshots: `npm run shots` writes fixed-name PNGs to `docs/shots/` (kept small, overwritten each run). Every visual push runs it and commits the PNGs so the manager can see them. Shots must assert the scene before capturing.
- Save format v4 (`src/core/save*`, `src/shared/types.ts`): additive only.

## 6. Gates and how you are audited
- Gate A (first playable slice, mostly reached; closes when verified): Home first, Play sheet, zoom within 350 ms, 25+ props and 6-10 tappable pieces in living/kitchen/bedroom, a drawer opens, a padlock opens a skinned puzzle (3 skinned), NO overlapping text, targets at least 96 px (game px), smooth on a phone.
- Gate B (finished game): all 6 rooms; the 30-minute case with chained puzzles; Resume; all 11 puzzles skinned and restyled; Result with Evening Replay; Journal v2, Settings, real audio; the old scenes and art deleted in ONE cleanup commit.
- Gate C: APK installs on the owner's phone, Back button, safe areas, background pause, perf checked.
- Audit: after each batch the owner says "audit". The manager pulls main, runs tests and build, views `docs/shots/` at laptop and phone sizes, compares with the references and returns a defect list per AI. Fix the defects before starting new work. Miss the same gate twice and the manager rewrites your tasks.
- You cannot test on a real phone. Say what you could not verify.

## 7. Ownership map (strict)
- AI-1 Platform, Audio, Integrator: root build files, `.github/`, `scripts/`, `README`, `docs/DEPLOY.md`, `android/`, `capacitor.config.*`, `src/main.ts`, `src/core/*`, `src/shared/types.ts`, `src/audio/*`, `public/audio/*`, `tools/audio/*`, `tests/e2e/*`, `playwright*.config.ts`, `tests/shots/*`.
- AI-2 Logic, Content, Puzzles: `src/logic/*`, `src/content/*`, `src/puzzles/*`, `tests/logic*.test.ts`, `tests/puzzles/*`, `tests/sim/*`.
- AI-3 Scenes and UI: `src/scenes/*`, `src/ui/*`, `tests/home-*.test.ts` and other scene tests.
- AI-4 Art and FX: `src/art/*`, `src/fx/*`, `assets/*`, `tools/*` (except `tools/audio`), `docs/art/*`, `public/atlas/*`.
Docs: each AI owns its own `docs/status/AI-N.md`. The manager owns `docs/manager/*`.

## 8. Freeze list (do NOT work on these)
Chill mode, House Builder, photo mode, pet outfits, Tier 2/3 puzzle kinds, balcony/garden/laundry rooms, seasonal swaps, extra Settings options, new puzzle generators.

## 9. If you are running low on usage
The four earlier AIs all hit their limit mid-work. So: keep commits small, push every unit, keep `docs/status/AI-N.md` current (especially "Next": exact file and function you were in the middle of). Before you stop, `git status` must be clean and everything pushed. Another AI will continue from your status file.

---

# YOUR ROLE: AI-3 Scenes and UI (Home world, HUD, all screens)

You own: `src/scenes/*`, `src/ui/*` and scene tests (`tests/home-*.test.ts` etc.). You are accountable for what is ON SCREEN: if a screenshot looks bad, that is your defect to chase even when the cause is art (file a Request to AI-4 with the screenshot path). Reuse the run controller `RoomRun` so game rules exist in one place. The Home scene already exists (`HomeScene.ts`, `HomeSpots.ts`, `homeProps.ts`, `homeStairs.ts`, `homeSky.ts`, `homeYard*.ts`, `homeGesture.ts`, `homeActors.ts`, `HomeMenu.ts`): extend it, do not rewrite it.

## Tasks, in this order
0. **Main is red: fix first (about 10 minutes).** `tests/home-geometry.test.ts` imports Phaser (through a module that pulls it in) and fails with "window is not defined". Move the pure geometry math into a file with no Phaser import and test that. Run the full `npm test` before you push; never push red.
1. **HUD without collisions (owner complaint).** Fixed grid, nothing overlaps at 1280x720, 1200x540 and 800x360: top-left = pause + house button side by side with a gap; top-right = Clues + Hint; room navigation (BATHROOM, LIVING...) = a column at bottom-right; item tray = bottom centre; "Show tappables" = a compact 96 px chip bottom-left (it is a giant slab now); the case progress strip ("ROOMS 1/5 FOUND 1/3 LOCKS 0") goes on a small dark pill, at least 28 game px text, or is removed from Focus. All targets at least 96 px, platform safe-area insets respected. Item tray: show the `icon/<item>` frames; undiscovered items as a readable cream outline, not a dark blob. Add `__e2e.hud()` returning the rect of every HUD element; AI-1 builds the overlap e2e on it.
2. **Focus view clean-up.** Everything outside the focused room dims the same amount (props, yard, sky) or is hidden; no bright props from the room below or beside may show over the focused floor. Centre the focused room with an even margin. The staircase (`prop/stairsUp` 1x3, `shell/house/stairwell`) is drawn INSIDE the floor at the STAIRS cells, scaled like the room, and its top meets the upper floor; coordinate the landing cell with AI-2's `worldGrid`.
3. **Overview that sells the house.** The rooms must be furnished from outside: draw the baked prop layer (static, no live sprites) in the Overview too (on the 4 Nov build the rooms looked EMPTY after boot: find out if props are only drawn in Focus or if loading failed, fix it, tell the manager what it was). Show the cat (sleeping or wandering), lit windows (`fx/windowGlow/*`), the day/night tint, and a small pixel title "Scatterly" that does not overlap the house. Keep Play (or Continue when a snapshot exists), Journal, Settings as three big buttons in the bottom band.
4. **Full width (needs AI-1's `LAYOUT`).** Once `src/core/layout.ts` exists: extend sky, hills, grass and trees across the whole `LAYOUT.w` (no hard edge at 1280); anchor HUD buttons to the left and right edges inside the safe-area inset; keep the house, the Play sheet and the 3 buttons centred in the central 1280 box. Until it lands, code against a `LAYOUT` default of 1280.
5. **Pieces and feel.** Tappable pieces use `frame('spot/<kind>/<state>')` per state (closed, open, padlocked overlay, checked, marked) with the box as fallback; hit area 112 px, nearest centre wins; where a spot frame exists, hide the decor prop under it so one object shows. Decor taps react cutely (bounce and tick), never at a cost; three decor taps with no spot opened shows the Show-tappables ring once. Idle shimmer after 10 s. Avatar and cat use `avatar/*` and `pet/cat/*` frames when AI-4 delivers them; until then replace the flat block figure with a small outlined pixel figure from the palette (about 1.5 tiles tall). Avatar walks `pathTo` at most 600 ms (instant in Rush or when `walkAnim` is off). In `?debug=1` show `props with art X/66` and `spots with art X/N`.
6. **Screens (Gate B).** (a) Result: stars stamp, coins count-up, the Evening Replay (AI-2's `replayScript`, skippable). (b) Journal v2: Puzzle Book and achievements with progress (data from AI-2's `puzzleBook`, `achievements`). (c) Case checkpoints after each room ("continue / take a break"), a Resume button on Play when a snapshot exists, the finale camera push. (d) Settings: only the existing options, restyled. All use the theme tokens, the pixel font, 96 px targets.
7. **Audio and FX hooks.** Wire AI-1's audio API to every row of the "player action -> sound" table in `docs/art/AUDIO-LIST.md` (`setRoomAmbience` on focus change and `setIntensity` in Rush's last 20 s already exist); wire AI-4's FX particles. Reduced-motion audit (no zoom tweens, shimmer, walking, particles when on). Per-scene leak counts return to baseline.
8. **Gate B sign-off.** When 6 is done, write "READY FOR CLEANUP" under Requests so AI-1 can delete the legacy scenes in one commit; afterwards fix whatever the cleanup touched.

## Definition of done
Gate A items 1-5 pass on your screenshots at laptop and phone sizes; Overview and Focus smooth at 4x CPU throttle; no overlapping text anywhere; per-scene leak counts at baseline; status lists Verified vs Not verified (how it FEELS can only be judged by the owner on a phone: say so).

## Watch-outs
Never branch gameplay on `__e2e`. Puzzle scenes call `onDone` once then `scene.stop()`; the run controller resumes inside `onDone`. Do not edit `src/puzzles` (AI-2) or `src/art` (AI-4): file Requests. Do not delete old scenes before AI-1's cleanup commit. Chill, Builder, photo mode and extra Settings are frozen.
