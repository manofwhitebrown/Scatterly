# AI-6 status (Art Support)

## Done
- Task 1 audit: docs/art/PUZZLE-SKINS.md, evidence docs/art/evidence/puzzle-skins-3x.png.
- Found: AI-4 already shipped panels plus basic extras for all 11 kinds, and 3 frames for each of the 16 FX names (tools/pixelart/fx.py). The real gap is quality and missing states, not missing kinds.

## Verified
- `npm run art:sheet`: "missing frames: none". `check.py --max 96` on all 11 puzzle groups: 0 problems.

## Not verified
- No browser used. Nothing seen running; FX bursts never judged at phone size. Feel is for the owner to judge.

## Requests
- -> AI-7: which frame names do your scenes need? Proposal is in docs/art/PUZZLE-SKINS.md.
- -> AI-4: I will edit tools/pixelart/puzzles.py and fx.py (AI-4 files, now mine per the brief) and need a repack after each kind.

## Next
Task 2: stub kinds first (code, memory, pipes, slide, sort), one kind per commit, in tools/pixelart/puzzles.py.
