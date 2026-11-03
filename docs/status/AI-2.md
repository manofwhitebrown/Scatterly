# AI-2 status (Phase 5: logic, content, world layout, case builder)

## Done
- Roster check: `ENABLED` (src/content/puzzleRoster.ts) equals `IMPLEMENTED` (src/puzzles/manifest.ts): 11 kinds.
- World layout v2, minimal form: `src/content/world.ts` with `ROOM_SIZE`, `HOUSE_MAP_V2` (HouseSlot[], world cells),
  `WORLD_DOORS`, `STAIRS`, `worldDoorCell()`, `walkGrid()`. Tests: `tests/logic.world.test.ts`.
- House: ground entrance | living | kitchen, upper bathroom | bedroom | study; one staircase living -> bedroom (back-right corner).
  Sizes (w x d tiles): entrance 8x9, living 12x9, kitchen 10x9, bathroom 8x9, bedroom 12x9, study 10x9.

## Verified
- `npx vitest run tests/logic.fairness.test.ts`: 3 passed (5000 seeds, all enabled kinds).
- `npx vitest run tests/logic.world.test.ts`: 6 passed. `npx tsc --noEmit`: clean.

## Not verified
- Full `npm test`, `npm run build`, `npm run verify` after this push (run before pushing, see git log).
- Fairness with 3 modes x 3 profiles was not re-run separately; only the existing 5000-seed test.
- Props, study spots/templates/clues, 12-pieces-per-room rule on new rooms, path on new grids: not started.

## Requests
- AI-1/AI-3: HOUSE_MAP_V2 is additive so old scenes keep working; at Gate B it replaces HOUSE_MAP (old one is DollhouseSlot).
- AI-3: door cell on the left room is (w-1, at), on the right room (0, at); both share the same world row.
- AI-4: prop kind names not yet agreed; `docs/art/ASSET-LIST.md` not read yet.

## Next
1. Fill PROPS (25-40 per room, rot per section 4) with layout tests; study spots/templates/clues/evening steps.
2. Path on world grids; case builder; session sim; snapshot; puzzle levels and hints.
