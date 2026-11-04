# Scatterly, Phase 6 (the finish). Read ALL of this, then your role at the end.

You are AI-4, one of four NEW AIs (AI-1 to AI-4) taking over a half-built game. Four earlier AIs built about 60 percent of it and ran out of usage. The manager is Claude (it reviews your pushes and writes defect lists). The owner owns the game, is NOT technical, and judges only by screenshots in `docs/shots/` and by playing on a phone. When you write to the owner, use plain language, no jargon.

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

# YOUR ROLE: AI-4 Art and FX

You own: `src/art/*`, `src/fx/*`, `assets/*`, `tools/*` (except `tools/audio`), `docs/art/*`, `public/atlas/*`. The owner attaches to your chat: the 3 reference images, the Kenney Furniture Kit zip (CC0) if you need to render new models, and (from the earlier work) `art-proof-living-room.png`. Existing pipeline, read it first: `tools/render3d/` (OBJ to isometric sprites, orientation in `fronts.json`, check with `npm run check-fronts`), `tools/pixelart/` (hand-built pixel sprites: `props*.py`), `tools/artsheet/` (`npm run art:sheet` composes all 6 rooms into `docs/art/evidence/art-sheet.png` without a browser), `tools/check-frames/`, `scripts/pack-atlas.mjs` (AI-1's) and `docs/art/ASSET-LIST.md`, `LICENSES.md`, `palette.json` (max 64 colours; never ship off-palette colours or mixed pixel scales).
State now: every one of the 66 decor kinds has a `prop/<kind>` frame, all 6 shells exist at `ROOM_SIZE`, spot closed/open frames exist for the living room, kitchen and bedroom, lit-window frames, an exterior kit, stairs, cat frames, 3 puzzle panels. It still reads as "boxes with a texture" next to the references. Your job is the polish that makes the owner say "that is a house I could live in".

## Tasks, in this order (push after each; commit an honest evidence PNG with a weakness list each time)
1. **Owner's screenshot fixes (bedroom and every other room).** (a) Bed: a real bed with headboard, pillow and blanket fold (it is a flat pink slab). (b) Rug: smaller (at most about 3x2 tiles), patterned, low-contrast warm tone, thin; it is a huge saturated orange-red diamond that dominates the floor. (c) Plants: at least 3 variants, each used at most twice per room; the same teal spiky plant appears six times and looks like a dry agave in rooms where it makes no sense. (d) Windows: frame, sill, curtains, a soft light patch on the floor (today flat pale-blue squares). (e) Wall decor and small props density so every room really reads 25-40 pieces; contact shadows under props. (f) Per room, view the real composition in a Focus screenshot (`npm run shots`) and in the Overview, and write what still looks weak. Order: living, kitchen, bedroom, then entrance, bathroom, study.
2. **Spot frames for the rest.** `spot/<kind>/closed|open` for every spot kind in the entrance, bathroom and study (AI-2 posts the list and footprints in status; ask if missing), plus the padlock overlay, checked tick and hunch mark if not complete. Where a spot is a piece of furniture the spot frame REPLACES the decor frame, so the player sees one object.
3. **Avatar and cat finish.** Avatar: idle and 6-frame walk in two iso directions (mirror the rest), outlined, same palette (the current flat block figure is a stand-in). Cat: sleep, idle, walk, react, eat; verify it reads at Overview size.
4. **UI finish.** Verify the pixel bitmap font covers every character the game's text uses (digits, accents, punctuation) and is legible at body size 28 game px; extend it if not (OFL, licence line). The 8 item icons must read at 96 px in the tray (the owner saw unreadable dark blobs for undiscovered items: deliver both discovered and silhouette variants). Finish the nine-slice wood panels and button states.
5. **Light.** One day/night multiply overlay with 4 key colours (morning, noon, dusk, night) plus window art switching (`fx/windowGlow/*` day and night exist); expose the key colours in the manifest so AI-3 applies them to Overview and Focus.
6. **Puzzle skins for the remaining 8 kinds.** `puzzle/<kind>/panel` (nine-slice 32x32, slice 8, cream paper in honey-wood trim, a different accent line per kind) plus tiles/buttons/markers in the same style, matching the 3 existing ones (untangle, lights, mastermind). Kinds are in `src/puzzles/manifest.ts` (`IMPLEMENTED`). AI-2 consumes them and needs them as a pack: push per kind.
7. **FX particles.** Pixel particle frames for the 16 FxNames in `src/fx/names.ts` (`fx/<name>/<n>`), small and cheap (at most 40 live sprites per room); AI-3 hooks them.
8. **Boot cost.** `generateAllTextures` bakes everything at boot (about 2 s of a 3.4 s start): drop it as atlas art replaces code-drawn textures, or bake lazily per `room:<id>` group, as you retire each procedural texture (AI-1 will ask).

## Definition of done
The three slice rooms look like the references in density and warmth (the manager judges from `docs/shots/` at laptop and phone sizes); every manifest key resolves or has a fallback; `check-frames` and `check-fronts` pass; palette, atlas and memory budgets pass (images in dist at most 8 MB, GPU textures at most 48 MB); the ledger is complete; status lists Verified (command + output) vs Not verified, with an honest weakness list. How it looks is judged by the owner: say so.

## Watch-outs
Do not add, move or remove interactive pieces (layout is AI-2's): send a Request if a footprint must change. Do not edit `src/shared/types.ts` (Request to AI-1). Prop and spot ids are art keys: agree names with AI-2 first. Be your own harshest critic. Do not start sound (AI-1 owns audio).
