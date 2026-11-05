# AI-7 Puzzle Screens: status (5 Nov 2026)

## Done
- Shell (`src/puzzles/PuzzleShell.ts`): dim backdrop and skip-confirm dim now span `LAYOUT.w` (full width, no side bars). Solved state shows the `ahaLine(kind)` line on a plate above the button bar. Calm mode (lowFx or reducedMotion, via `isCalm`) skips the celebration particles.
- Already in place when I arrived (not mine, checked by reading): Hint/Notes/Skip row inside the panel, 3-rung hint ladder, difficulty marks, close button, nine-slice skin hook, `onDone` once then `scene.stop()`.
- Levels wiring (brief task 3): `WordScene`, `SortScene`, `UntangleScene` now call `PUZZLES.<kind>.generate(seed, this.level, ...)`. Word plays cipher at 3 and 6-9 letter words at 4-5. Untangle plays 4x4/5x4 graphs at 4-5. Local word lists, graph builders and scrambles removed.
- Guard tests `tests/puzzle-scenes/levels-wired.test.ts`.
- Sort text enlarged (piece labels 12 -> 18 px, rule 19 -> 24 px, bin labels 16 -> 21 px). Checked on screen at 1280x720.
- Shots of all 11 puzzles at 1280x720 and 1200x540: `docs/shots/ai7/<kind>.png`, `<kind>-1200.png` (own folder, so the shared shots stale check is untouched). Taken with `SHOTS_CHROMIUM=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` (software GL).
- Sort, Word, Untangle now have `hintLine` (3-rung ladder via `hintArgs`) and `e2eSolve` (test bot), so the e2e bot can solve all three.

## Verified
- `npm run secret-scan` -> `secret-scan: clean`
- `npm test` -> `Test Files 69 passed (69), Tests 586 passed (586)`
- `npm run build` -> `Boot payload: 1848.6 KB (limit 1900.0 KB)`
- `npx tsc --noEmit` -> no output
- Pushed to main (8230be1).

## Not verified
- 800x360 not shot by me; 1200x540 shots exist but I only eyeballed 1280x720 contact sheets.
- Shots test gap (AI-1): `dismissHowTo` does not close the how-to card in software GL, so `docs/shots/puzzle-*.png` show the card, not the puzzle. A held press (down, 150 ms, up) closes it; an instant click does not.
- The new levels 4-5 are only reached if the run controller passes `level` (AI-2 request to AI-1/AI-3 still open). Until then real runs still play 1-3.
- The guard test reads source text because Phaser cannot load in node; it does not run a scene.
- Feel, motion and sound are the owner's to judge on a phone.

## Honest notes
- Code and Sort have no harder variant above level 3 (Sort level 4-5 repeats the 'combo' mode). AI-2 owns that logic; I did not invent any.
- Seen on screen: the cream wooden panel, pixel font, Hint/Notes/Skip row inside the panel and the close button are consistent across all 11, nothing overlaps at 1280x720. Weakest: Word key legend (tiny), Slide and Memory grids small and off-centre, Mastermind history box empty and blank, close X sticks out of the panel corner,.
- Text is still small: `makeText` in `src/puzzles/ui.ts` scales every size by 0.8, so body text is 14-27 px, below the 28 px target. Fixing it means re-fitting each scene's layout.

## Requests
- -> AI-2: Untangle level 3 starts with about 54 crossings (generator keeps the first shuffle with >= minCross). Cap it near 2-3x minCross so it is not daunting.
- -> AI-1: make `dismissHowTo` in tests/e2e/helpers.ts hold the press (see Not verified).
- -> AI-6: no frame requests yet (restyle of the 11 scenes not started, so I have not yet listed missing `puzzle/<kind>/*` frames).
- -> AI-1: shots for puzzles (`tests/shots/*` is yours). I need a step that opens each of the 11 puzzles at 1280x720, 1200x540 and 800x360.
- -> AI-5: `src/scenes/soundHooks.ts` when it exists; until then scenes call `sfx.play`.

## Next (exact)
1. Task 1 remainder: `src/puzzles/PuzzleShell.ts` `create()`: title/Hint/Notes/Skip use pixel font at the small scale; raise text sizes, check rects at the 3 sizes, add Back wording beside the X.
2. Task 2: restyle scenes one per commit. Start with `CodeScene.ts` (130 lines).
3. Task 4: sound ids and motion per tap (`SortScene.tryPlace`, `WordScene.addCell`).
4. Task 5: real per-scene tests (open, solve, hint rung, overlap rects, leak count) need a browser; source-guard tests are all I can run.
5. Task 6: write "PUZZLES READY (AI-7)" only after the 11 shots exist.
