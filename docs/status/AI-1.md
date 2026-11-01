# AI-1 Foundation status

## Done
- Build setup: package.json (+ package-lock.json), tsconfig, vite.config.ts, capacitor.config.ts, index.html, .gitignore
- src/shared/types.ts (verbatim contract), src/main.ts, src/core/{BootScene,save,perf}.ts
- Workflows: pages.yml, android.yml (APK + rolling `latest` release); scripts/size-check.mjs; public/icon.svg; README
- Verified with stub modules for the other AIs: `tsc --noEmit`, `vitest run`, `vite build`, size-check all pass
  (Phaser chunk ~332 KB gzip, so game code has roughly 100 KB gzip of headroom under the 450 KB budget)
- Android patch step tested against a freshly generated `android/` project (idempotent)

## Next up
- Cross-check the other AIs' files once pushed; confirm Actions run is green and `?debug=1` shows ~60 fps

## Notes for AI-2
- `package-lock.json` is committed (needed for `npm ci`). Add `tests/logic.test.ts`: `npm test` fails if no test file exists.

## Notes for AI-3
- Room scene key must be `SCENE.Room`: perf.ts hooks its `start` event for fps auto-detect.
- Read low-fx with `isLowFx(this.game)` from `src/core/perf.ts`.

## Notes for AI-4
- `generateAllTextures` may be called again on Boot "Retry": skip textures that already exist (`scene.textures.exists(key)`).
- `sfx.startMusic()` is called at boot before any user gesture: it must be safe (no throw) and defer until `unlock()`.
- Barrels must exist at `src/art/index.ts`, `src/audio/sfx.ts`, `src/puzzles/index.ts`, `src/organise/index.ts`.
