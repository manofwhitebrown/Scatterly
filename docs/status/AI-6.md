# AI-6 status (Art Support, now also inheriting AI-4's art and the atlas packer)

## Done
- Audit: docs/art/PUZZLE-SKINS.md. AI-4 had made panels for all 11 kinds; real gap was stubs and missing states.
- Puzzle skins (tools/pixelart/puzzles.py, puzzle2.py; one commit per kind): code key_down/slot_ok/slot_bad/btn_ok; memory card_match/card_miss; pipes tee/end/source + _on water; slide tile_ok/tile_down; sort shaped tokens + bin/bin_ok; lights tile_on_glow; mastermind fb_exact/fb_near; sequence shaped pads; untangle link; panels now 2 px accent trim.
- FX: all 16 names have 3 frames (docs/art/evidence/fx-4x.png). Redrew take, clue, room (tools/pixelart/fx.py).
- Wall decor: shelfBooks, shelfPlants, towelRail, coatHooks (1 wide), pictureWide, pictureTriptych (2 wide), each with _L (tools/pixelart/wall2.py, sheet wall-decor-4x.png).
- Docs: ASSET-LIST.md, LICENSES.md updated.
- Manager order 10:00: I run tools/pack/pack.py (all atlases repacked). Living room colour pass with tools/pixelart/recolor.py (tone-for-tone ramp swap; Kenney OBJs are not in the repo so no re-render): sofa, armchairs, bookcaseClosed, bench, sideTableDrawers, cat bed, doormat now sage or honey, TV unit and speaker dark wood, pottedPlant leaves sage, spot/sofa sage. Evidence docs/art/evidence/art-living-3x.png.
- Regenerate order: props2, spots, sofa, spots3, wall2, puzzles, puzzle2, fx, recolor, then pack.py.

## Verified
- `npm test`: 69 files, 586 tests passed. `npm run build`: boot payload 1849.4 KB (limit 1900), dist 2081 KB. `npm run check-assets`: ok (441 files). `npm run art:sheet`: missing frames none. check.py: 0 problems on all puzzle groups and room-slice.

## Not verified
- No browser: nothing seen in game, no phone check. FX never judged at phone size. Feel is for the owner.
- art:sheet draws props only, not spot frames, so it misjudges sofa/TV areas.

## Weak
- Furniture silhouettes (manager item 2) only recoloured, not redrawn: armchair still two fused blocks until AI-2 splits them, TV unit and dining set unchanged. Each room keeps its own wallpaper colour. Memory and mastermind panels share the rose accent. towelRail and coatHooks are small.

## Requests
- -> AI-2 (living, worldPropsA.ts LIVING): (1) delete both loungeChair at (5,3) and (5,4); place one at (1,3) rot 1 and one at (7,4) rot 3, facing the coffee table (3,3). (2) rugRound (8,7) hugs the front edge: move to (6,5). (3) delete robotVacuum (6,8) and catBowl (10,7); keep catBed and one mat. (4) register pottedFern, pottedCactus, pottedFlower in worldKinds.ts as B(1,1,4,{sym:true}); use pottedFern at (11,5), pottedFlower at (11,8), keep pottedPlant at (0,8); same in other rooms so none repeats one plant.
- -> AI-2: wall kinds shelfBooks, shelfPlants, towelRail, coatHooks (B(1,1,1,{mount:true})), pictureWide, pictureTriptych (B(2,1,1,{mount:true})). Suggest: living shelfBooks R t=1, pictureWide L t=3; study shelfBooks, pictureTriptych; bedroom pictureWide; kitchen and bathroom shelfPlants; bathroom towelRail; entrance coatHooks.
- -> AI-7: new puzzle frames are in the atlases now (see docs/art/PUZZLE-SKINS.md); tell me any other name you need.
- -> Manager: FX cap is 60 in src/fx/specs.ts, brief says 40; left as is.

## Next
- After AI-2 re-places the living room: re-run art:sheet, look again.
- Item 2: redraw TV unit, armchair, dining set silhouettes (hand-built like tools/pixelart/sofa.py), then repack.
