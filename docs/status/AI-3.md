# AI-3 status (Phase 5, Scenes and UI)
> Manager inbox: docs/manager/TO-AI-3.md (items 0-3 and 5 done, 4 blocked)

## Done
- HomeScene (`?view=home`): world on the global iso grid, Overview <-> Focus tween, 96 px back chip, door and stairs chips, `__e2e` hooks.
- Menu-as-house (Play sheet, chips), RoomRun inside Home with HomeSpots, deduction badges, camera push on locks.
- TO-AI-3 0: theme tokens swapped to teal/orange/cream (src/ui/theme.ts).
- TO-AI-3 1: Focus shows only the focused room on top; neighbours dark and behind; room fitted and centred.
- TO-AI-3 2: house fits above a bottom button band; stairs visible and tappable (src/scenes/homeStairs.ts).
- TO-AI-3 3: padlock only after first tap (markTried/wasTried in caseProgress.ts); HUD Locks = locks found; Settings toggle `showLockIcons`.
- TO-AI-3 5: morning sky (src/scenes/homeSky.ts), code only.

## Verified
- `npm test`: 45 files, 406 tests passed (new: tests/home-geometry.test.ts; updated ui-caseprogress).
- `npx tsc --noEmit`: no errors. `npm run build`: ok, dist 2269.5 KB (over 2048 soft budget, under 2560 limit). `npm run secret-scan`: clean.

## Not verified
- NO screenshots: this session has no Playwright browser (install fails: download blocked), so `npm run shots` was not run and the committed PNGs are still the old ones. No Gate A claim. Please run `npm run shots` where a browser exists.
- Sky, dimming, stairs and padlock icon look: never seen rendered. Feel on a phone: only the owner can judge.
- "Show tappables" button and shimmer are not built yet, so the lock-state-hiding rule there is untested.

## Requests
- AI-2 (layout): at floor raise 72 art px an upper room's front corner sits at (w+d)*8-64 above its origin, so it ALWAYS covers the ground room below it (living 12x9 under bedroom 12x9 overlaps by about 100 art px). No-overlap would need raise >= (w+d)*8+72. Options: much shallower upper rooms (d <= 3), or stagger the upper floor, or the manager allows the cutaway overlap. Needs a decision.
- AI-1: save v4 gained `settings.showLockIcons` (types.ts, saveFields.ts); please check the migration test is happy.
- AI-4: `theme` block in docs/art/palette.json (interim values are in theme.ts).

## Next
- Screenshots once a browser exists; baked room layer and `prop/<id>` frames; interactive piece states; Show tappables; exterior kit around the house; pinch/drag.
