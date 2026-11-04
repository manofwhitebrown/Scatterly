# art-sheet evidence (4 Nov, AI-4)
`npm run art:sheet` composes all six rooms from the packed atlases with the projection and anchoring rules of homeProps.ts (UNIT 6, ground-anchored at the footprint centre, only rot 1 mirrored). It has no browser, so it shows the art as placed, not the game.

## Honest weakness list (vs the owner's references)
1. Sparse floors: 18-29 props on 8x9 to 12x9 tiles. The references have 25-40 props per room and almost no bare floor. The front half of every room is empty. This is layout density (AI-2), not art.
2. Scale: Kenney furniture is correct for its footprint but small next to the room; sofas and beds read as toys on a big floor. References draw furniture larger relative to the tile.
3. Small tops (mugs, books, plants) are 3-16 px and vanish at overview scale; they only read in focus.
4. Walls are plain stripes: only 6-10 small mounts, no shelves/curtains/wall lights, no window curtains. References have curtains, hanging plants, shelves and wall units.
5. No pet and no avatar in the composed image; rugs are flat procedural patterns with no shadows; no contact shadows under any prop.
6. Light: window glow frames exist but are flat patches; no floor light patches from them, no lamp cones, no day/night multiply overlay yet.
7. Flat 3-tone Kenney shading plus plain palette ramps look clean but clinical next to the hand-drawn dithering and texture in the references.
8. Plants and trash cans at the front-row cells (gy=8) hang over the cut edge; that placement is AI-2's.
