# Scatterly audio (AI-1, Phase 6)

Everything is **original, synthesised by script** (`tools/audio/`): no samples, no downloads, nothing licensed. Re-make it all with
`python3 tools/audio/render.py` (needs numpy, scipy, matplotlib, ffmpeg). Files land in `public/audio/` (shipped, 5.4 MB of the 8 MB cap),
extra music takes in `tools/audio/candidates/` (NOT shipped), evidence in `docs/art/evidence/audio-*.png` and `audio-report.json`.

## What exists
| Kind | Count | Files |
|---|---|---|
| Sound effects | 77 names x 3 variants | `sfx_<name>_1..3.ogg`, mono 32 kHz; names in `src/audio/manifest.ts` (`SFX_GROUPS`) |
| Music loops | 5 | `music_morning` (86 bpm, bright), `music_lofi_a` (72 bpm, Am), `music_lofi_b` (70 bpm, Bm), `music_puzzle` (64 bpm, sparse, no drums), `music_result` (68 bpm calm bed) |
| Music extras | 2 | `music_rush_tension` (loop layer over any track), `music_result_sting` (6 s one shot) |
| Ambience loops | 6 | `amb_rain`, `amb_birds`, `amb_kitchen`, `amb_clock`, `amb_night`, `amb_fireplace` (24 s) |

Loops are whole bars (16, the result bed 8) with a circular reverb and wrapped tails: the loop point measures as no click
(seam ratio about 1; see `audio-report.json`). Loudness: music -16 LUFS, ambience -26 LUFS (ffmpeg ebur128), sfx gated RMS -19 dBFS
(too short for LUFS); nothing above -1.5 dBFS.

## Mixer (src/audio/engine.ts)
Buses into one limited master: **music** (through a duck node), **sfx** (samples), **ui** (never ducked), **ambience**, plus the old synth sfx bus.
Sliders: music / sfx (also drives ui) / ambience. Ducking: `win, fanfare, star_stamp, unlock_room, found, lose` dip the music to 45% for 0.7 to 1.6 s.
Voice cap 12 total (music 5, ambience 2, sfx 5), oldest stolen. If a file is missing or will not decode, the old synthesised sound/music/bed plays instead.

## Loading (never boot payload)
`sfx.unlock()` (first tap) fetches the `core` group (25 sounds, about 0.3 MB). `house`, `puzzle`, `result`, `cat` load when first played
or on `sfx.preload(group)`. A music track and a room's ambience load when first asked for. Max 3 downloads at once.

## What plays when (call these from the scenes)
| Moment | Call |
|---|---|
| First tap anywhere | `sfx.unlock()` (already wired) |
| Home overview / Play sheet | `sfx.startMusic(); sfx.setTrack('morning'); sfx.setRoomAmbience('overview')` |
| Morning run (Home focus) | `sfx.setTrack(trackForDay(day))` (`src/audio/logic.ts`: lofi_a / lofi_b alternate) |
| Enter a room | `sfx.setRoomAmbience(roomId)` (entrance birds, living clock+fireplace, kitchen hum, bedroom night, bathroom rain, study clock) |
| Puzzle opens / closes | `sfx.setTrack('puzzle')` / back to the day track |
| Rush mode | `sfx.setIntensity(0..1)` as time runs down; `timer_urgent` in the last 10 s |
| Buttons, panels, back | `click` `tap` `open` `close` `ui_back` `ui_toggle` `ui_slider` `swoosh` |
| Search | drawer / cupboard / wardrobe / fridge_open / bin_lid / basket_rustle / rug_flap / cushion / paper per spot kind, `item_take`, `found` |
| Doors | `door` `door_close` `lock` `lock_open` `lock_fail` `key_jingle` |
| Walking | `step` (hall), `step_stairs`, `stairs` |
| Clues | `clue` `clue_note` `hint` `mark_ruled_out` `mark_hunch` |
| Puzzles | `puzzle_ok` `puzzle_wrong` `puzzle_tick` `puzzle_dial` `puzzle_slide` `puzzle_flip` `puzzle_gear` `puzzle_pipe` `puzzle_mirror` |
| Result | `sfx.resultMoment()` (sting, then calm bed), `star_stamp` per star, `coin_tick` counting, `win` / `lose` |
| Rewards, rooms | `coin` `coin_spend` `star` `unlock` `unlock_room` `bell` `fanfare` |
| Cat | `meow` `meow2` `cat_happy` `purr` |

## Honest notes
- **Not listened to on a device.** I checked decoding in Chromium, lengths, peak levels, loudness and loop seams by measurement. Taste, balance and
  whether the synthesised wood, paper and ceramic sound convincing are unverified. Synthesis is cleaner but thinner than recorded foley.
- Mixer constants (`MUSIC_LEVEL 0.55`, `SAMPLE_GAIN 0.8`, ambience levels in `manifest.ts`) are calculated, not tuned by ear.
- **Candidates for the owner:** `tools/audio/candidates/` has two more takes of each music loop (`_v2` tempo -4 bpm, `_v3` +4 bpm, different note choices, 64 kbps).
  To swap one in: copy it over the matching `public/audio/music_<name>.ogg` and tell AI-1.
- Callers still use the old 18 names in most scenes; those now play the new recorded versions automatically where the name matches
  (`tap click open close found clue error win lose tick pop swoosh coin snap success unlock bell fanfare`).
