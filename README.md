> **New AI? Start at `docs/manager/START-HERE.md`.**

# Scatterly ("Where'd I Put It?")

A cosy deduction puzzle for web and Android. You wake up late and your keys, wallet and phone are missing.
The house remembers last evening: read the clues, work out where things went, then tidy up for tomorrow.

**Play in the browser:** https://manofwhitebrown.github.io/Scatterly/

## Build progress

| AI | % done | last pushed file | blockers/notes |
| --- | --- | --- | --- |
| AI-1 Foundation | 100% ✅ | .github/workflows/android.yml | Pages + APK green; live site and latest release verified |
| AI-2 Logic | 100% ✅ | tests/logic.test.ts | all logic + content + tests pushed; 20/20 tests pass locally |
| AI-3 Face | 95% | docs/status/AI-3.md | build+tests pass locally; needs on-device fps/visual check (gates a, c) |
| AI-4 Art | 95% | src/puzzles/WordScene.ts | all files pushed; build + Pages green; fps gate (?debug=1) not yet checked on a device |

## Get the APK

1. On GitHub open **Releases** and choose the **latest** release (pre-release).
2. Download `app-debug.apk` on your phone.
3. Allow **Install unknown apps** for your browser or file manager when Android asks, then open the file.

The APK is rebuilt on every push to `main` (debug-signed, which is fine for personal use).

## Develop

Needs Node 20.

```
npm ci            # install
npm run dev       # dev server
npm test          # vitest
npm run build     # typecheck + production build + size check (dist/)
npm run preview   # serve dist/
npm run cap:sync  # sync dist/ into the Android project
```

Add `?debug=1` to the URL for an FPS and object-count overlay.

## One-time owner steps

1. **Settings -> Pages -> Source = GitHub Actions**
2. **Settings -> Actions -> General -> Workflow permissions = Read and write**
3. Push to `main`. Pages deploys and the APK release updates automatically.

## Folder map

```
index.html, package.json, tsconfig.json, vite.config.ts, capacitor.config.ts   build setup
.github/workflows/    pages.yml (web deploy), android.yml (APK + rolling "latest" release)
scripts/              size-check.mjs (fails the build if the bundle is too big)
src/main.ts           Phaser game config and boot
src/shared/types.ts   shared contract: types, constants, scene and texture keys
src/core/             BootScene, save (localStorage profile), perf (low-fx detection)
src/logic/, content/  scenario generator, evening simulation, clues, progression, house data
src/scenes/, ui/      menu, mode select, room, result, settings, shared UI widgets
src/puzzles/          untangle, sort and word puzzle scenes
src/organise/         house organising and decorating
src/art/, audio/      procedural textures and WebAudio sound (no asset files)
tests/                vitest tests
docs/status/          one status file per contributor
```

## Notes

- Budget: initial JS <= 450 KB gzip, whole `dist` <= 2 MB. `npm run build` warns at budget and fails at 600 KB JS gzip or 2.5 MB dist.
- The `android/` folder is git-ignored: CI regenerates it with `npx cap add android` and patches it
  (landscape, fullscreen, app name). To build locally run `npx cap add android` once, then `npm run build && npm run cap:sync`.
- Never commit tokens or credentials.

## Flags and verification (Phase 3)
- `?debug=1` debug overlay, `?e2e=1` test hooks (never changes gameplay), `?view=iso` selects the isometric Room/House (default stays the flat view until the Parity flip).
- `npm run secret-scan` fails if a `github_pat_` / `ghp_` string is in the tree (also a CI step).
- `npm run verify` = secret-scan + tsc + unit tests + build + e2e smoke. JS gzip budget 520 KB (hard fail 600).

## Screenshots (`npm run shots`)
1. `npm ci` once. Playwright needs Chromium: `npx playwright install chromium` (software GL is fine).
2. If the download is blocked, point `SHOTS_CHROMIUM` at any Chromium binary (e.g. from `@sparticuz/chromium`).
3. `npm run shots` builds, serves `vite preview` on :4174 and writes PNGs to `docs/shots/`.
4. Names: `menu`, `home-overview`, `focus-<room>`, `puzzle-<kind>`, `result`; each at 1280x720 and `-800` (800x360).
5. Files are overwritten every run; commit them with every visual push.
6. Run one shot only: `npx playwright test -c playwright.shots.config.ts -g home`.
7. Home shots use `?view=home`; focus shots need the Home scene's `__e2e.focus(room)` hook and are skipped without it.
8. Software GL is slow (a few fps): the spec polls, it never sleeps on game time.
9. The full run takes about 5-8 minutes locally.
10. Never put tokens in specs or output.
