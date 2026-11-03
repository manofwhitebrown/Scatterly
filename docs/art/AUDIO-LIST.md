# Scatterly Audio List v1 (AI-4): a target list, not a shopping list

Status key: **S** = synthesised by `tools/audio/synth.py` (exists in `public/audio/`), **T** = target, still to synthesise, **U** = owner-supplied CC0 (none yet). Format OGG Vorbis 32 kHz mono, peak -3 dBFS (sfx) / -9 dBFS (loops), loops gapless (tail wrapped onto head, seam measured). Total budget 8 MB; current 397 KB.

## Music (6-8 loops)
| File | Mood | Status |
|---|---|---|
| music_lofi_a | cosy lofi, 72 bpm, 8 bars | S |
| music_morning | bright pluck + pad, 84 bpm | T |
| music_puzzle | calm, sparse, 64 bpm | T |
| music_chill | slow pads, no percussion (Chill Corner) | T |
| music_lofi_b | variation of A, other key | T |
| music_rush_tension | layer on top of any loop (`setIntensity`) | T |
| music_result | 6 s win sting + 6 s calm bed | T |

## Ambience loops (6)
amb_rain **S**; amb_birds T; amb_kitchen_hum T; amb_clock T; amb_night T; amb_fireplace T.

## SFX (>= 60 with 2-3 variations; 12 base sounds x 3 exist)
Existing (S, `sfx_<name>_1..3`): drawer, door, lock, paper, ceramic, keys, cushion, step, purr, tap, ok, meow.
Target (T), each 2-3 variants: drawer_close, door_close, lock_open, lock_fail, key_jingle_pick, cupboard, fridge_open, fridge_close, tap_water, kettle_click, cushion_lift, wardrobe, hanger, bag_zip, shoe_drop, switch_lamp, tv_on, charger_plug, bin_lid, basket_rustle, rug_flap, coin, coin_spend, star, unlock_room, item_found, item_take, clue_note, hint, mark_ruled_out, mark_hunch, ui_back, ui_open_panel, ui_toggle, ui_slider, puzzle_ok, puzzle_wrong, puzzle_tick, puzzle_dial, puzzle_slide, puzzle_flip_card, puzzle_gear, puzzle_mirror, puzzle_pipe, timer_urgent, win_fanfare, lose_sting, build_place, build_rotate, build_invalid, cat_meow2, cat_happy, footstep_wood_2, footstep_stairs.

## Honest note
Synthesised sound is clean but thin next to recorded foley: wood/paper/ceramic are filtered noise plus sine partials. I verified the files decode, their lengths, peak levels and loop seams by script; I have NOT listened to them on a device, so balance and taste are unverified. If the owner supplies CC0 recordings (Kenney audio packs etc.), they replace the matching S files and go in the ledger.
