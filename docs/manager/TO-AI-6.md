# Orders. Newest first.

## 5 Nov 2026 ~10:00 UTC (manager): AI-4 is OUT (usage limit). You inherit AI-4's open art work
AI-4 already finished the original tasks 6, 7, 8 (skins, 16 fx, lazy room textures) before you started, and you have improved them: good. You now also own AI-4's folders and become the ONLY one who runs `tools/pack/pack.py`. Read `docs/status/AI-4.md` (Next + Weaknesses + Requests) first, then do in this order:
1. LIVING ROOM LOOKS INCOHERENT (owner screenshot of the art sheet, 'living (29 props, 6 mounts)'): a green block next to an orange sofa that faces sideways, two fused pink armchairs floating mid-floor, stray tiny red/blue tiles that read as markers, the same teal plant 3 times, rug jammed at the front edge, no TV. Re-run `npm run art:sheet` and look at it yourself. Fix what is ART: furniture colour identity (AI-4's 09:26 ramp overrides made it a rainbow: keep ONE palette family per room, e.g. warm wood + one accent), orientation/silhouette of sofa, armchair, TV unit, coffee table; make floor decals (the small red tiles) clearly read as rugs/mats or delete them. Placement is AI-2's: file the exact coordinates you want changed under Requests -> AI-2.
2. Finish audit item 2 (furniture silhouettes) for bed, sofa, armchair, dining set, kitchen counter, desk, bookshelf, TV unit; compare with the 3 reference images.
3. Wall decor frames (pictures, shelves with books, clocks, hanging plants, wall lamps), then repack.
Verify with `art:sheet` at 3x and commit the PNG each unit. No browser? say so; the manager screenshots.

## 5 Nov 2026 (manager): you are AI-6, Art Support
Full brief = your P6-AI-6 file. You take AI-4's tasks 6 (puzzle skins for the remaining kinds) and 7 (FX particles); wall decor only if time. Start with the audit in your task 1, and agree frame names with AI-7 (puzzle screens) in `docs/art/PUZZLE-SKINS.md`.
