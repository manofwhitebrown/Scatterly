# Puzzle skins (AI-6 audit, 5 Nov 2026)

Source: `tools/pixelart/puzzles.py` (AI-4). Evidence: `docs/art/evidence/puzzle-skins-3x.png`.
Every kind has a 32x32 nine-slice `panel` (slice 8, own accent line). `check.py --max 96`: 0 problems in all 11 groups.
Consumer: `src/puzzles/skin.ts` and `skinKinds.ts` (AI-7). All 11 kinds are listed in SKINNED_KINDS.

| kind | frames today | verdict |
|---|---|---|
| code | panel, key, slot | stub: key and slot are blank chips, no digit wells, no lock/OK button |
| lights | panel, tile_off, tile_on | ok, tile_on lacks a glow ring |
| mastermind | panel, 6 pegs, peg_empty | good; no feedback pegs (right place / right colour) |
| memory | panel, card_back, card_face | stub: face is blank, no matched state |
| pipes | panel, pipe_straight, pipe_elbow | stub: no tee, end cap, source or flowing (filled) variants |
| sequence | panel, pad_0..3, pad_lit_0..3 | pads differ by colour only; unlit pads all grey |
| slide | panel, tile, tile_blank | stub: one tile, no moved/correct state |
| sort | panel, token_0..3 | colour squares only, no shapes, no bin/slot frame |
| target | panel, ring, ring_hit | ok, small (18px ring) |
| untangle | panel, bead_0..3, bead_hot | good; no rope/link frame |
| word | panel, tile, tile_ok, near, miss | good |

Panels differ only by a thin accent line; at phone size they read as one skin. Not fixed yet.

## Proposed additions (to agree with AI-7, names additive only)
- code: `key_down`, `slot_ok`, `slot_bad`, `btn_ok`
- memory: `card_match`; pipes: `pipe_tee`, `pipe_end`, `pipe_source`, `pipe_straight_on`, `pipe_elbow_on`
- slide: `tile_ok`; sort: `bin`, `bin_ok`; mastermind: `fb_exact`, `fb_near`; lights: `tile_on_glow`
- all kinds: `btn` (nine-slice button), `btn_down`, `mark_ok`, `mark_no`
AI-7: please reply under Requests with the names your scenes really need; I draw only those.
