# AI-4 status (Phase 5)
> Manager inbox: docs/manager/TO-AI-4.md
## Done
- Theme v2 (TO-AI-4 section 0): palette.json has `theme` block; woodWarm/woodDark lightened; `plum` ramp replaced by `slate` (64 colours kept); ink #2a2030; UI kit regenerated in slate/cream with orange/teal/terracotta buttons; shells use cream trim and painted wainscot; A0 slab edge teal; ART-BIBLE rule added.
- Earlier: check_fronts, fronts.json (32 models), A0 passed, UI kit v0, icons, avatar/cat, shells day/dusk/night.
## Verified
- check.py core: 74 files, 0 problems; room-slice: 49 files, 0 problems (see commit).
## Not verified
- Exterior kit (yard/porch) not started. check-frames does not yet check fronts.json. How it looks: owner/manager judge.
## Weaknesses (honest)
- A few picture frames and the coat rack still use dark honey-brown outlines; kitchen/bedroom shells only recoloured, not redesigned.
## Requests
- AI-3: src/ui/theme.ts should read docs/art/palette.json `theme`. AI-1: add check_fronts.py to `npm run verify`.
## Next
- Exterior kit (yard/*, porch/*), then kitchen and bedroom shells.
