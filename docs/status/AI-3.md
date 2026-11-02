# AI-3 Scenes and UI: status

## Phase 4 (High-End Cozy), as of this push
Phase 0 prerequisites NOT yet on main (checked at f0e8bef): Contract v4 (`SCENE.Home/Chill/Builder`, `ART`, save v4), `src/art/manifest.ts`, `src/core/assets.ts`, `src/logic/path.ts|builder.ts|replay.ts`. HomeScene, Builder, Chill and the manifest-driven UI kit are blocked on them (no stubs added: they cannot be registered without `SCENE.Home`, and I do not edit `src/shared/types.ts`).

### Done this push
- Journal achievements: all 15 achievements listed with name + description, earned = amber star, locked = muted (`scenes/achievementBook.ts`, tested in tests/ui-journal.test.ts). Header shows `earned / total`.
- Reduced-motion audit (scenes + ui): every tween site checked. Item hop and clue flutter are already skipped when `isCalm`; Button press-scale was the only unguarded motion, now set instantly when calm. Toast fades are alpha only (kept). Room zoom, shimmer, tutorial ring pulse, mark badges already guarded.

### Carried over from Phase 2/3 (still true)
- `RoomRun` holds the rules (session, clock, gates, marks, feel, finish); `RoomScene` and `IsoRoomScene` plug in through `RunView`/`RunHost`. All feel rows wired in `RoomFeel`; `sfx.setIntensity` (Rush urgency) and `sfx.setRoomAmbience` (room switch, run start/end) are called.
- Iso room, Dollhouse overlay, Menu backdrop, Result story, Puzzle Book (19 kinds), first-morning tutorial (relaxed), hit areas >= 96 px via `ui/hit.pickSpot`.

## Verified (commands run)
- `npm test` 213/213 (21 files), `npx tsc --noEmit` clean, `npm run build` green, JS 427.9 KB gzip (budget 520), `node scripts/secret-scan.mjs` run before push.

## Not verified
- Anything visual or tactile (feel, fps, haptics, Journal layout of the longer achievement list): never seen on a device; owner checks with `?debug=1`.
- `?view=iso` and the Dollhouse have not been run in a browser by me. Playwright browsers are not installed here.
- G4 leak counts not measured.

## Requests
- AI-1: land Contract v4 (SCENE.Home/Chill/Builder, ART, ISO 96x48, save v4) so HomeScene can be registered; add `?view=home`.
- AI-4: `src/art/manifest.ts` + core atlas (bitmap font, nine-slice panels, icons) so the UI kit can replace `drawPlate` and system-font text.
- AI-2: `ACHIEVEMENTS` needs `target` + `progress(profile)` per entry for progress bars (today only `test`); `Clue.facts` on number clues; `path.ts`, `builder.ts`, `replay.ts`, `useTreat`.
