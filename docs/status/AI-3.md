# AI-3 Scenes and UI: status

## Phase 4 (High-End Cozy), as of this push
Checked at f1e8cc6: `path.ts`, `replay.ts`, `src/art/manifest.ts` (stub) landed. STILL missing: Contract v4 (`SCENE.Home/Chill/Builder`, `ART`, save v4, ISO still 64x32), `src/core/assets.ts`, `src/logic/builder.ts`, `useTreat`. HomeScene, Builder, Chill, new Settings fields and the manifest-driven UI kit stay blocked on them (I do not edit `src/shared/types.ts`).

### Done this push
- Pixel font (taken over from AI-4, who is busy): Silkscreen (OFL 1.1) woff in `public/fonts`, loaded by `src/ui/pixelFont.ts`, `theme.FONT` now uses it for all `makeText`/Button text; ledger line added; `?font=system` is the escape hatch. Measured with PIL: Silkscreen runs ~25-35% wider than a system sans, so every Button label still fits its width (checked by arithmetic, not on screen). It is a canvas-rendered pixel font, not yet a Phaser bitmap font, and the Boot screen and `art/palette.ts` still use the system font.
- Evening Replay (deliverable 6): Result has a "Last night" button; `ReplayScene` (key `Replay`, local to scenes) walks AI-2's `replayScript` over the cutaway house tiles (avatar token, <= 600 ms walk per room change, item bubble, found items stamped), Skip jumps to the end state, calm/low-fx/reduced-motion shows the end state at once. Pure timing in `replayPlan.ts`, tested in tests/ui-replay.test.ts. Avatar is a code-drawn token until AI-4's `avatar/*` frames exist.
- Journal achievements: all 15 achievements listed with name + description, earned = amber star, locked = muted (`scenes/achievementBook.ts`, tested in tests/ui-journal.test.ts). Header shows `earned / total`.
- Reduced-motion audit (scenes + ui): every tween site checked. Item hop and clue flutter are already skipped when `isCalm`; Button press-scale was the only unguarded motion, now set instantly when calm. Toast fades are alpha only (kept). Room zoom, shimmer, tutorial ring pulse, mark badges already guarded.

### Carried over from Phase 2/3 (still true)
- `RoomRun` holds the rules (session, clock, gates, marks, feel, finish); `RoomScene` and `IsoRoomScene` plug in through `RunView`/`RunHost`. All feel rows wired in `RoomFeel`; `sfx.setIntensity` (Rush urgency) and `sfx.setRoomAmbience` (room switch, run start/end) are called.
- Iso room, Dollhouse overlay, Menu backdrop, Result story, Puzzle Book (19 kinds), first-morning tutorial (relaxed), hit areas >= 96 px via `ui/hit.pickSpot`.

## Verified (commands run)
- `npm test` 236/236 (27 files), `npx tsc --noEmit` clean, `npm run build` green, JS 429.0 KB gzip (budget 520), `node scripts/secret-scan.mjs` run before push.

## Not verified
- Anything visual or tactile (feel, fps, haptics, Journal layout of the longer achievement list): never seen on a device; owner checks with `?debug=1`.
- Silkscreen layout in every scene (wrapped paragraphs, Journal rows, Settings) has not been seen on screen.
- The Replay scene has not been seen in a browser (layout of caption/avatar vs tiles unchecked).
- `?view=iso` and the Dollhouse have not been run in a browser by me. Playwright browsers are not installed here.
- G4 leak counts not measured.

## Requests
- AI-1: Contract v4 still not on main; land it (SCENE.Home/Chill/Builder, ART, ISO 96x48, save v4) so HomeScene can be registered; add `?view=home`.
- AI-4: `src/art/manifest.ts` + core atlas (bitmap font, nine-slice panels, icons) so the UI kit can replace `drawPlate` and system-font text.
- AI-2: `ACHIEVEMENTS` needs `target` + `progress(profile)` per entry for progress bars (today only `test`); `Clue.facts` on number clues; `path.ts`, `builder.ts`, `replay.ts`, `useTreat`.
