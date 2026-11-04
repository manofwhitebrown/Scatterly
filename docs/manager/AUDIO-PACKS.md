# Free CC0 audio the owner can download for AI-1 (manager, 4 Nov 2026)

Why: our synthesised sounds (`tools/audio/synth.py`) are clean but thin next to recorded sound. These packs are CC0 (public domain), so they fit the rule "nothing paid, CC0 only".

## Who does what
- OWNER downloads the zips below and attaches them to AI-1's chat (the AIs' sandbox network usually cannot reach these sites). Only what is listed as "pick" is needed; the owner does not have to download everything.
- AI-1 listens, picks what fits a cosy house, converts to OGG (mono for sfx, stereo for music, about 96-128 kbps), trims silence, normalises, loops music gaplessly, keeps total audio at most 8 MB, loads it as a lazy group, and adds ONE line per source in `docs/art/LICENSES.md` (pack or page URL, author, "CC0"). Until the zips arrive, AI-1 keeps working with the synthesised files and does not block.
- Never use a file whose page does not say CC0. Pixabay music and any CC-BY file are NOT CC0: do not use them. "chilled lofi Beat" (Bogart VGM) on OpenGameArt is CC-BY 3.0: do not use it.

## Sound effects: Kenney (all CC0), https://kenney.nl/assets , category Audio
- Interface Sounds (100 clicks, snaps, confirmations): https://kenney.nl/assets/interface-sounds  (pick: buttons, chips, zoom ticks, confirm)
- Impact Sounds (about 130 thuds and hits): find it in the Audio category (pick: drawers, wood knocks, props landing, cushions)
- UI Audio (about 50 more interface sounds) (pick: tray, notebook, hint)
- RPG Audio (about 50 effects) (check for doors, footsteps, cloth, coins; the coin tick suits the Result screen)
- Music Jingles (short win/lose stings) (pick: the Result sting)

## Music loops: OpenGameArt, all pages below show License CC0 (re-check the licence line on the page before use)
- Lo-Fi and Chill (Collection), Holizna, 3 big zips (87 / 83 / 94 MB; take only 3-5 tracks): https://opengameart.org/node/161819
- Happy Lo-Fi (collection), Holizna, happy mood, good for the morning/Relaxed loop: https://opengameart.org/content/happy-lo-fi-lofi-collection
- Chill lofi inspired (omfgdude, jazzy piano): https://opengameart.org/content/chill-lofi-inspired
- Lofi Hip Hop Loop (omfgdude, soft): https://opengameart.org/content/lofi-hip-hop-loop
- In the Lobby (Umplix, soothing lo-fi, meant to loop): https://opengameart.org/content/in-the-lobby
- Sherwood (zesona, 110 bpm chill loop): https://opengameart.org/content/sherwood
- Chill (Loopable) (Pro Sensory; CC0, the author asks for a credit: put the name in LICENSES.md): https://opengameart.org/content/chill-loopable
- freame (cinameng, slow dreamy synth loop, good for the puzzle bed): https://opengameart.org/content/freame
- A long CC0 calm/relaxing playlist to browse (about 70 tracks): https://opengameart.org/node/73274

## Room ambience (birds, kitchen hum, clock, night, fireplace)
Search opengameart.org (Art Type: Sound Effect, licence filter CC0) or freesound.org (free account; set the licence filter to Creative Commons 0; licence varies per file). The owner downloads 1-2 per room only if easy; otherwise AI-1 synthesises them.

## Mapping to AUDIO-LIST.md (AI-1 decides, these are suggestions)
`music_morning` and `music_lofi_b`: the Happy Lo-Fi / Sherwood family; `music_puzzle`: freame or In the Lobby (sparse, calm); `music_result`: a Music Jingles sting plus a calm bed; Rush tension stays a synthesised layer driven by `setIntensity`.
