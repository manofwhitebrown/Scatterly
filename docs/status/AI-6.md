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
- -> AI-4: please repack puzzle:code (new frames). I edit tools/pixelart/puzzles.py and fx.py (AI-4 files, now mine per the brief) and need a repack after each kind.

- Task 2, code: key (keycap look), key_down, slot, slot_ok, slot_bad, btn_ok (tools/pixelart/puzzle2.py, run after puzzles.py). Evidence docs/art/evidence/puzzle-code-3x.png.

## Weak
- slot_ok/slot_bad are colour only (no mark), so colour-blind players get no cue unless the scene adds one. Panel trims still near-identical across kinds.

## Next
- Task 2, memory: card_match, card_miss, card_face (plaster, bottom line). Evidence puzzle-memory-3x.png.

- Task 2, pipes: pipe_tee, pipe_end, pipe_source (all drawn pointing up; scene rotates in 90 deg steps), plus _on water versions of straight, elbow, tee, end. Evidence puzzle-pipes-3x.png. Weak: source valve is a tiny yellow square; the old elbow channel is a pixel wider than the new pieces.

Task 2 next: slide, sort (one per commit, add to KINDS in puzzle2.py). Then atlas repack request -> AI-4 and name list -> AI-7.
