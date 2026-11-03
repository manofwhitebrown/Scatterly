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

# YOUR ROLE: AI-2 Logic, Content, World Layout, Case Builder

You own: src/logic/*, src/content/*, tests/logic*.test.ts, tests/puzzles/*, tests/sim/*. Pure TypeScript, deterministic, no Phaser, proved by tests over thousands of seeds. Room ids, spot ids and decor ids are saved by players: additive changes only.

## Deliverables, in order
1. **First push (small).** Verify `ENABLED` in `src/content/puzzleRoster.ts` lists every puzzle kind that has a scene (compare with `IMPLEMENTED` in `src/puzzles/manifest.ts`); run the 5000-seed fairness test with all enabled kinds and fix what it finds. Apply the rule: at most 12 interactive pieces per room including bought storage.
2. **World layout v2 (the big one, everyone is waiting on it).** Section 4 interface for 6 rooms: `HOUSE_MAP`, `ROOM_SIZE`, stairs and door cells, a walkable grid per room. Start from the proposed house; adjust only if the geometry needs it and say so in your status. Per room: 6-10 interactive spots (reuse the existing 55 spot ids for the 5 existing rooms; the new `study` gets its own spots, templates, clues, evening steps and `lockable` flags) and 25-40 decor `PROPS` (`kind`, `gx`, `gy`, `rot` = facing direction per section 4, optional `onTop` of another prop, wall-mounted items with wall + t + h). Prop `kind` names come from the Kenney model names AI-4 lists in `docs/art/ASSET-LIST.md` (for example loungeSofa, bookcaseOpen, lampRoundFloor); agree names with AI-4 before adding. Add a one-line theme note per room (mood, palette, story props) for AI-4. Layout tests: no overlaps, every prop touching a back wall faces into the room (rot 0 on the right wall, rot 1 on the left wall), seats face a TV or table, in bounds, doors and stairs connect, every spot has a free adjacent cell, all walkable cells connected per floor. Push the layout FIRST in a minimal form (rooms, sizes, HOUSE_MAP) so AI-3 can start, then fill props.
3. **Path.** Check `src/logic/path.ts` (`pathTo`, `pathLengthCells`) works on the new walkable grids; extend tests for unreachable and blocked cases.
4. **Case builder for 30-minute sessions (Phase 2).** A Standard case: 4-6 target items across 4+ rooms, 8-12 padlocked containers (about half decoys), 2-3 chained puzzles, a finale compound gate that needs facts from several clues. `sessionLength` short/standard/long scales counts (about 15/30/45 min). Day ramp: day 1 at most 10 min, day 2 about 15, day 3 about 20, day 4 about 25, day 5+ about 30. Rush stays 10-15 min. Day 1 and 2 stay gentle; never block progress behind a level 5 puzzle.
5. **Session sim.** `tests/sim` bots with a puzzle time model; a test fails when the median Standard case from day 5 leaves 25-35 min; deterministic sampling keeps `npm test` under about 25 s.
6. **Resume.** Verify and extend `src/logic/snapshot.ts` (round trip, corrupt snapshot falls back to a fresh case, kill-and-reload e2e is AI-1's).
7. **Puzzle levels 1-5 and hint ladder (Phase 2, existing 11 kinds only).** Each generator takes `level` 1-5 with documented parameters, a `hint(spec, progress, step)` with 3 steps, a written "aha" line and one hard variant; chained outputs (a code derived from a sequence) and compound gates (`Gate.chain`) with validator and solver tests; no kind repeats back to back; level 4-5 only from day 5 / day 10.

## Definition of done
Fairness (5000 seeds x 3 modes x 3 profiles incl. gates) and layout tests green; session sim passes; no Phaser import in logic or content; API changes listed under "Notes for AI-1/3/4"; status lists Verified vs Not verified.

## Watch-outs
Daily mode stays reproducible by date. Do not write new puzzle generators (frozen). Do not edit src/shared/types.ts: send AI-1 a Request.
