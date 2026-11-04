# AI-3 status (Phase 5, Scenes and UI)
> Manager inbox: docs/manager/TO-AI-3.md (items 0-3 and 5 done, 4 blocked)

## Done
- HomeScene (`?view=home`): world on the global iso grid, Overview <-> Focus tween, 96 px back chip, door and stairs chips, `__e2e` hooks.
- Menu-as-house (Play sheet, chips), RoomRun inside Home with HomeSpots, deduction badges, camera push on locks.
- TO-AI-3 0: theme tokens swapped to teal/orange/cream (src/ui/theme.ts).
- TO-AI-3 1: Focus shows only the focused room on top; neighbours dark and behind; room fitted and centred.
- TO-AI-3 2: house fits above a bottom button band; stairs visible and tappable (src/scenes/homeStairs.ts).
- TO-AI-3 3: padlock only after first tap (markTried/wasTried in caseProgress.ts); HUD Locks = locks found; Settings toggle `showLockIcons`.
- TO-AI-3 5: morning sky (src/scenes/homeSky.ts), code only; exterior kit baked behind the house from `house` atlas frames (homeYardPlan.ts plan, homeYard.ts bake): lawn, path, porch, fence+gate, trees, bushes, flowers, mailbox; missing frames skipped.
- Theme mirrored from palette.json `theme` by tests/home-yard.test.ts (dim text now #b3c9c6).

- Room layer uses baked art: decor draws `prop/<kind>` frames (ground-anchored at the footprint centre, rot 1 mirrored) where AI-4 has them (13 of 66 kinds today, atlas `room:slice`), a box otherwise; stairs use `prop/stairsUp` / `shell/house/stairwell`. Rooms rebuild when the atlases arrive.

- "Show tappables" chip (bottom-left in Focus during a run): rings every piece for 2 s, identical for all so lock state is never revealed. Idle shimmer: after 10 s without input one unopened piece pulses every 2 s, cycling (none when calm). Files homeHints.ts, homeShimmer.ts.

- Gestures (homeGesture.ts): Overview drag-pan and two-finger pinch zoom (0.85x-2x of fitted, centre clamped to the house); pinch-out in Focus returns to the Overview. A drag never counts as a tap.

- Avatar (homeActors.ts): walks `pathTo` to a cell beside the tapped container, at most 600 ms, instant when calm, Rush, walkAnim off or no frames; the action runs on arrival. Cat (lives in the living room): sleeps, wanders every 8-14 s, reacts to a tap at no cost. Frames from the core atlas (avatar se/sw idle/walk/reach, pet/cat).

## Verified
- `npm test`: 45 files, 406 tests passed (new: tests/home-geometry.test.ts; updated ui-caseprogress).
- `npx tsc --noEmit`: no errors. `npm run build`: ok, dist 2269.5 KB (over 2048 soft budget, under 2560 limit). `npm run secret-scan`: clean.

## Not verified
- Avatar/cat never seen: walk path uses legacy `LAYOUTS` obstacles (not the world decor), frame pivots assumed identical across an animation, cat sits at a fixed start cell.
- Gestures never tried on a touch device (multi-touch pointer2 path unverified).
- Prop frame placement (pivot/flip) is assumed, never seen.
- NO screenshots: this session has no Playwright browser (install fails: download blocked), so `npm run shots` was not run and the committed PNGs are still the old ones. No Gate A claim. Please run `npm run shots` where a browser exists.
- Yard bake never seen rendered (frame anchors/pivots assumed ground-anchored).
- Sky, dimming, stairs and padlock icon look: never seen rendered. Feel on a phone: only the owner can judge.
- Show tappables / shimmer never seen rendered; the chip may collide with HUD panels at the bottom-left (unchecked).

## Requests
- AI-4: `shell/<room>/full` (room-slice) is a 10x8 room but ROOM_SIZE is 12x9 (living), so I do NOT use it; need frames per ROOM_SIZE or the sizes agreed. 53 of 66 decor kinds still have no `prop/<kind>` frame. Please confirm the pivot is the base centre of the footprint and rot 1 = mirrored rot 0.
- AI-2 (layout): at floor raise 72 art px an upper room's front corner sits at (w+d)*8-64 above its origin, so it ALWAYS covers the ground room below it (living 12x9 under bedroom 12x9 overlaps by about 100 art px). No-overlap would need raise >= (w+d)*8+72. Options: much shallower upper rooms (d <= 3), or stagger the upper floor, or the manager allows the cutaway overlap. Needs a decision.
- AI-1: save v4 gained `settings.showLockIcons` (types.ts, saveFields.ts); please check the migration test is happy.
- AI-4: `theme` block in docs/art/palette.json (interim values are in theme.ts).

## Next
- Screenshots once a browser exists; baked room layer and `prop/<id>` frames; interactive piece states; checked/marked piece states; Result/Journal v2.
