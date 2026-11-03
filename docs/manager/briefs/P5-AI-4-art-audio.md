# Scatterly Rebuild (Phase 5) - read all of this, then your role at the end

Manager: Claude. Owner: the game's owner, who judges by screenshots and by playing on a phone. You are one of four NEW AIs (AI-1..AI-4) working in one repo. This brief overrides every older brief and the old docs/status files (stale: overwrite them with fresh ones). Do not redesign; if you disagree, write it under "Requests" in your status file and continue with the closest safe reading.

## 1. What the owner wants
The owner's verdict on the current build: it looks cheap, the Home screen and the "choose your morning" screen make no sense, and rooms are separate screens instead of a house.
Target: ONE cozy connected house seen from outside as an isometric cutaway (2 floors). Tap a room and the camera zooms in; inspect furniture, open drawers, solve locks; tap back and it zooms out. The owner's 3 reference images are warm pixel-art iso cutaways: dense (25-40 props per room), wood trim, striped wallpaper, window light, a pet, clean themed UI panels (no brown).
Device: phone, landscape, 1280x720 canvas (Scale FIT). Delivery: web (GitHub Pages) and Android APK (Capacitor).
Honest ceiling: free assets plus code reach "clean cozy indie", not hand-drawn reference quality. Close the gap with density, one strict palette, light, animation and sound.
Pillars: it feels like a place you could live in; every tap is satisfying (look, sound, motion); "one more morning" (about 30-minute cases, interesting puzzles); cosy, no dark patterns.

## 2. Repo and what to keep
Repo https://github.com/manofwhitebrown/Scatterly . Phaser 3.80, TypeScript strict, Vite, Capacitor, Node 20. Engine is locked.
Commands: `npm ci`, `npm test`, `npm run build`, `npm run verify` (secret-scan, tsc, tests, build, check-assets, e2e smoke), `npm run e2e`.
URL flags: `?view=home` (new world), `?view=iso` (old iso room), `?artdebug=1`, `?debug=1` (overlay), `?e2e=1` (test hooks).
KEEP and extend, do not rewrite: src/logic (scenario generator, clues, gates, solver, session, path, replay, snapshot), src/content, the 11 puzzle generators and scenes (src/puzzles), save v4 (src/core/save*, src/shared/types.ts), tests, e2e, CI, error policy, FX and audio engines.
REPLACE at Gate B, not before: MenuScene, ModeSelectScene, RoomScene, IsoRoomScene, HouseScene and the code-drawn art (src/art/iso*.ts). Until Gate B, main keeps working and the new world lives behind `?view=home`. A Home stub may exist (tests/home-scene.test.ts): read it first.

## 3. Working rules
- GitHub token: the owner puts it in your session. Keep it only in a shell variable (`export GITHUB_TOKEN=...`), use it only for git auth, and push with `git -c http.extraheader="Authorization: Basic $(printf 'x-access-token:%s' "$GITHUB_TOKEN" | base64 -w0)" push origin main`. Never write it into any file, commit, log, status doc or test; never print it; keep your brief file outside the repo tree. Before every commit run `npm run secret-scan` (it must pass). If you ever see it in the repo, stop and tell the owner. It expires in about a week, so push early and often.
- Push to main after every finished unit and at least every 30 minutes: `git pull --rebase`, then `npm test && npm run build`, push only if green. Never force-push. Commit messages `AI-N: <what>`. Never end a session with unpushed work.
- Strict TS, no `any`, no `@ts-ignore`, no TODO/FIXME, every source file under 400 lines, no console.log outside `?debug=1`.
- Every feature ships with a test (logic) or an e2e/screenshot step (visual) in the same push.
- Folder ownership is strict (your role section). Need a change in someone else's folder? Put it under "Requests" in your status file; the owner is that folder's AI-N.
- NOTHING PAID. Allowed sources: CC0/public-domain assets the owner supplies (the Kenney Furniture Kit zip), assets you build, OFL fonts. Every external asset gets a line in `docs/art/LICENSES.md`; `npm run check-assets` fails CI otherwise.
- Status file `docs/status/AI-N.md`, max 60 lines, replace stale text, sections: Done / Verified (command + pasted output) / Not verified / Requests / Next. Never write "should work".
- Token economy (the owner pays per token): read narrowly (`grep -n`, `sed -n`, `| tail -20`), edit with small patches, run only affected tests while iterating and the full suite once before each push, render screenshots once per milestone. If an approach fails 3 times, write the exact error under Requests and move on.
- No speculative features. Do only what is in your list and not on the freeze list.

## 4. Fixed interfaces (the manager decided these so nobody waits)
- Projection (art px): `sx = (gx - gy) * 16`, `sy = (gx + gy) * 8 - h`. One tile = 32x16 art px. ART.px = 3 (1 art px = 3 game px, integer only, no rotation or smoothing of sprites). Wall height 64 art px, floor slab 8, floor 1 is raised 72 art px. Back corner of a room is its (0,0); gx runs down-right (right back wall is gy=0), gy runs down-left (left back wall is gx=0).
- FACING (read twice): every placed object has `rot` = the direction its FRONT faces: 0 = +gy (down-left on screen), 1 = +gx (down-right), 2 = -gy (up-right, away from the camera), 3 = -gx (up-left). Against the right back wall (gy=0) use rot 0; against the left back wall (gx=0) use rot 1. Sofas, armchairs, beds, TVs, cabinets, stoves, fridges and shelves must face INTO the room, seats face the TV or the coffee table. The Kenney models natively face -z, so a naive render puts every front against the wall (the manager's first proof had exactly this bug). The render tool adds the 180 degree offset; AI-4 verifies the real front of each model once and records it in `tools/render3d/fronts.json`; nobody guesses.
- Layout (AI-2, src/content/layout*.ts): `HOUSE_MAP` (HouseSlot[] in world cells), `ROOM_SIZE[room] = { w, d }` in tiles, per-room spots, `PROPS` (decor placements) and a walkable grid. Proposed house: ground floor entrance | living | kitchen, upper floor bathroom | bedroom | study, one staircase living to bedroom. Existing room ids and the 55 spot ids and all decor ids never change.
- Art keys (AI-4, src/art/manifest.ts): `frame(key)` returns a frame or undefined (then use the procedural fallback). Keys: `shell/<room>/<floor|wallL|wallR|...>`, `prop/<id>`, `spot/<kind>/<closed|open>`, `ui/<name>`, `icon/<item>`, `avatar/<dir>/<anim>/<n>`, `pet/cat/<anim>/<n>`, `puzzle/<kind>/<n>`, `fx/<name>/<n>`.
- Loader (AI-1, src/core/assets.ts): `ensureGroup(scene, group): Promise<void>`, `prefetchGroups(scene, groups)`, `hasFrame(key)`. Groups: `core`, `house`, `room:<id>`, `puzzle:<kind>`. A failed load falls back to procedural art and never crashes.
- Test hooks under `?e2e=1` only (AI-3): `scene.__e2e = { hotspots(), focus(room), overview() }`.
- Screenshots (AI-1): `npm run shots` writes fixed-name PNGs to `docs/shots/` (menu, home-overview, focus-<room>, puzzle-<kind>, result) at 1280x720 and 800x360, overwritten each run, kept small. Every visual push must run it and commit the PNGs so the manager can see them.

## 4b. Decisions made after the first audit (final, do not reopen)
- Manager inbox: at the START of every session read `docs/manager/TO-AI-<your number>.md`, do its items in order, move finished ones to its "Done" section and say so in your status file. It overrides older text here.
- Navigation is tap-only: tap a room to zoom in, tap to search; the avatar walks to the piece automatically. No free movement.
- Focus view: only the focused room is readable. Neighbour rooms are dimmed to about 25%, drawn behind or beside it (never over it) and inert. The focused room is fitted and centred on screen.
- Padlocks: an icon appears on a piece only after the first tap on it; decoys get locks too; "Show tappables" never reveals lock state; the HUD counts only locks already found. Settings toggle "Show lock icons before tapping", default off.
- Theme: no dark brown fills in UI or backgrounds. Slate-teal panels, cream paper, teal secondary buttons, sun-orange primary button, terracotta danger. Furniture wood stays but lighter and warmer. AI-4 publishes the final values as a `theme` block in `docs/art/palette.json`; AI-3's `src/ui/theme.ts` is the only place UI colours live.
- It is a MORNING game: AI-3 draws a procedural morning sky behind the house (bands, sun, drifting clouds, hills); AI-4 draws a decorative exterior kit (porch, yard, fence, trees, mailbox) that AI-3 places around the ground floor. All non-interactive.

## 5. Gates (the owner approves each from screenshots and from the phone)
- Gate 0: `npm run shots` works; main green; each AI's status file started.
- Gate A0 (AI-4 first, before anyone builds on the art): one composed still of the living room, at least as good as `art-proof-living-room.png`, with 25-40 props, every piece facing the correct way, in `docs/shots/art-proof.png`. Pass: the manager says so. Fail: the owner decides whether to buy a pixel pack.
- Gate A (slice, `?view=home`): (1) the first screen is the house itself (2 floors, lit windows, the cat) with 3 buttons: Play, Journal, Settings; (2) Play opens a small sheet with Relaxed/Rush/Daily chips, not a full screen; (3) tapping a room zooms in within 350 ms and back or pinch zooms out; (4) living, kitchen and bedroom each show 25+ props and 6-10 tappable pieces; a drawer opens, a padlock opens a skinned puzzle (3 puzzles skinned); (5) no overlapping text, targets at least 96 px, smooth on a phone.
- Gate B: all 6 rooms; the 30-minute case with chained puzzles; Resume; all 11 puzzles skinned; Result with Evening Replay; Journal, Settings, real audio; default view flips to Home and the old scenes and art are deleted in one cleanup commit.
- Gate C: APK installs on the owner's phone, Back button, safe areas, background pause, perf checked.

## 6. How you are audited
After each batch the owner tells the manager "audit". The manager pulls main, runs the tests and build, views `docs/shots/`, compares against the owner's references and returns a defect list per AI. Fix the defects before starting new work. Miss the same gate twice and the manager rewrites your tasks or asks the owner to replace you. The owner checks only how it feels on a phone; you are responsible for everything else.

## 7. Freeze list (do NOT work on these until Gate B)
Chill mode, House Builder, photo mode, pet outfits, Tier 2/3 puzzle kinds, balcony/garden/laundry rooms, seasonal swaps, extra Settings options.

---

# YOUR ROLE: AI-4 Art Director, Technical Artist, Audio and FX

You own: src/art/*, src/audio/*, src/fx/*, assets/*, tools/*, docs/art/*, public/atlas/*, public/audio/*. The owner gives you with this brief: the Kenney Furniture Kit zip (CC0, 140 OBJ models plus prerendered iso PNGs), `art-proof-living-room.png` (the manager's proof of the target look from that pack), `kenney_room_proof.py` (the script that made it) and `orient_sheet.py` (shows each model from both sides to check which way it faces). The script is a SEED, not a finished tool: read it, move it to `tools/render3d/`, and improve it.

## The art route (decided)
OBJ models are rasterised offline (orthographic, yaw 45, elevation 30 = exact 2:1 tiles, 1 tile = 0.5 Kenney unit = 32x16 art px), flat-shaded in 3 steps plus a rim highlight, mapped onto palette ramps, with per-object 1 px outlines. Floors, walls, wainscot, trim, windows, rugs and stairs are generated procedurally. Everything the pack lacks (books on shelves, mugs, food, plants, frames, the cat, the avatar, UI, icons, puzzle skins) is hand-built with a small pixel-sprite DSL (rows of characters over named ramps). One global palette of at most 64 colours (reconcile with `docs/art/palette.json`); never ship off-palette colours or mixed pixel scales.
ORIENTATION: the seed script's `rot` already means "direction the front faces" and adds the 180 degree offset because Kenney models face -z. Do not trust that blindly: run `orient_sheet.py` (rendered both sides of each model) for every model you use, write the verified front into `tools/render3d/fronts.json`, and add a check to `check-frames` that every placed prop has an entry. A prop with its back to the room fails Gate A0.
Known weaknesses of the proof (fix them, this is your quality bar): flat empty bookcase and cabinets, busy repeating plank floor, rug blends into the floor, plain wall space, no small props, no light beyond one glow, no pet. Density, light and detail are what close the gap to the owner's references.

## Deliverables, in order
1. **Gate A0 (first, before anything else).** Commit the pipeline to `tools/render3d/`, then produce a living room at 25-40 props (hand-built small props, lamp glow, window light, a sleeping cat, wall decor) that clearly beats the proof, saved as `docs/shots/art-proof.png`. The manager audits it against the owner's references and decides whether this route continues. Until it passes, do not produce other art.
2. **Room shells and props, slice first.** After A0: living, kitchen and bedroom shells (`shell/<room>/floor|wallL|wallR|...`, windows, door frames, trim, stairs between floors) and the props from AI-2's `PROPS` lists as `prop/<id>` frames; add `docs/art/ASSET-LIST.md` entries marking each asset as Kenney-derived or built by us. Different rooms get different moods (palette per room). Pack with AI-1's `scripts/pack-atlas.mjs`.
3. **Interactive spot frames.** `spot/<kind>/closed|open` for every spot kind used by the slice rooms (drawer pulled out, door ajar, lid up), one padlock overlay, checked and marked overlays.
4. **UI kit and font.** Nine-slice slate-teal panels (no wood, no brown, see section 4b), buttons with pressed states, notebook paper, item tray shelf, 8 item icons, a pixel bitmap font (OFL; reuse what already exists in src/art, record the licence). AI-3 needs this early: push a first usable set right after A0.
5. **Avatar and cat.** Avatar idle and 6-frame walk in two iso directions (mirror the rest); cat sleep, idle, walk, react.
6. **Light.** Baked window light patches and lamp glow, plus one day/night multiply overlay (4 key colours: morning, noon, dusk, night) with window art switching.
7. **Tools.** `tools/check-frames` (palette conformity, size, anchor, naming), `npm run art:sheet` (composes a room contact sheet from the manifest without a browser) and an evidence PNG with an honest weakness list in `docs/art/evidence/` with every art push.
8. **Phase 2.** Remaining rooms (entrance, bathroom, study), puzzle skins for the 11 kinds (`puzzle/<kind>/*`), pixel particles for the 16 FxNames, then audio: music loops, ambience, at least 40 sfx, mixer buses with ducking and a limiter, adaptive `setIntensity`; sources are CC0 files the owner supplies or audio you synthesise offline to OGG in `tools/audio/`; loops gapless; total audio at most 8 MB; keep the procedural synth as fallback.

## Definition of done
Gate A0 passed; the slice rooms look like the proof or better in `docs/shots`; every manifest key resolves or has a fallback; palette check, atlas and audio budgets (images in dist at most 8 MB, GPU textures at most 48 MB) pass; ledger complete; status lists Verified vs Not verified (how it looks and sounds is judged by the owner: say so).

## Watch-outs
Do not add, move or remove interactive pieces (layout is AI-2's; send a Request if a footprint must change). Do not edit src/shared/types.ts (Request to AI-1). Be your own harshest critic and say honestly where it still looks weak compared with the references. Prop and spot ids are art keys: agree names with AI-2 first.
