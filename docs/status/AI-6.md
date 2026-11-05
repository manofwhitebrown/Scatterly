# AI-6 status (Art Support)

## Done
- Task 1 audit: docs/art/PUZZLE-SKINS.md, evidence docs/art/evidence/puzzle-skins-3x.png.
- Found: AI-4 already shipped panels plus basic extras for all 11 kinds, and 3 frames for each of the 16 FX names (tools/pixelart/fx.py). The real gap is quality and missing states, not missing kinds.

## Verified
- `npm run art:sheet`: "missing frames: none". `check.py --max 96` on all 11 puzzle groups: 0 problems.

## Not verified
- No browser used. Nothing seen running; FX bursts never judged at phone size. Feel is for the owner to judge.

## Requests
- -> AI-4: please run the atlas repack: puzzle:code, memory, pipes, slide, sort (new frames) and core (redrawn fx take, clue, room). Until then the game still shows the old frames.
- -> AI-7: new frames you can use now are listed in docs/art/PUZZLE-SKINS.md (code key_down/slot_ok/slot_bad/btn_ok, memory card_match/card_miss, pipes tee/end/source/_on, slide tile_ok, sort bin/bin_ok + shaped tokens). Tell me any other name you need.
- -> AI-3, AI-5: all 16 FX names have 3 frames and src/fx/layer.ts already plays them; no new names to hook.
- -> Manager: brief says max 40 live FX sprites per room; src/fx/specs.ts has MAX_PARTICLES 60 (confetti 40). I left it; say if you want 40.

- Task 3 audit: all 16 FX names have 3 frames (docs/art/evidence/fx-4x.png). Redrew take (sparkle), clue (question mark), room (comet streak): fx-redo-6x.png.

- Gaps closed: panel trim now 2 px accent (was 1 px) with accent rivets; lights tile_on_glow; mastermind fb_exact, fb_near (8x8); sequence pads carry shapes (lit and unlit); untangle link (rope piece). Sheet: puzzle-skins-3x.png. Weak: memory and mastermind both use the rose accent (palette has 12 ramps for 11 kinds); untangle link is a plain bar; target still has only ring and hit mark.

## Next
- Task 2, memory: card_match, card_miss, card_face (plaster, bottom line). Evidence puzzle-memory-3x.png.

- Task 2, pipes: pipe_tee, pipe_end, pipe_source (all drawn pointing up; scene rotates in 90 deg steps), plus _on water versions of straight, elbow, tee, end. Evidence puzzle-pipes-3x.png. Weak: source valve is a tiny yellow square; the old elbow channel is a pixel wider than the new pieces.

- Task 2, slide: tile_ok (star), tile_down. sort: token_0..3 now carry shapes (square, diamond, triangle, circle) so colour is not the only cue; new bin, bin_ok. Evidence puzzle-slide-sort-3x.png. Weak: slide tile numbers still come from scene text; bin is a blank well.

Task 2 left: panel trims per kind (still near-identical), lights glow, mastermind feedback pegs, sequence pad shapes, untangle rope, target. Then Task 3 check, repack request (one per commit, add to KINDS in puzzle2.py). Then atlas repack request -> AI-4 and name list -> AI-7.
