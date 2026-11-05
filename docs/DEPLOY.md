# Deploy options

## Today: public repo + GitHub Pages
`.github/workflows/pages.yml` builds on every push to `main` and publishes `dist/` to GitHub Pages. Nothing to do while the repo is public. Android: `android.yml` publishes the APK to the rolling `latest` release.

## When the owner makes the repo private (after release, Phase C)
GitHub Pages from a private repo needs a paid GitHub plan, and free Actions minutes are limited (check GitHub's plans page; Free was 2,000 min/month when this was written). Move hosting BEFORE flipping the repo to private:

1. **Cloudflare Pages (recommended, free):** create a project, connect no repo; deploy from CI with Wrangler.
   - Repo secrets: `CLOUDFLARE_API_TOKEN` (Pages:Edit), `CLOUDFLARE_ACCOUNT_ID`.
   - Step after `npm run build`: `npx wrangler pages deploy dist --project-name scatterly`.
2. **Netlify (alternative):** secrets `NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID`; step: `npx netlify deploy --dir=dist --prod`.
3. Set `base` in `vite.config.ts` to `/` (Pages project sites use `/Scatterly/`; Cloudflare/Netlify serve from the root).
4. Disable `pages.yml` (delete or `workflow_dispatch` only). Keep the secret scan; secrets live only in repo secrets, never in files.
5. CI cost: path filters, cached installs and browsers, cancel-in-progress and heavy e2e on `main` only are already in `ci.yml`.

No change is needed until the owner decides to go private.

## Android platform behaviour (Gate C)
- **Back button:** `src/core/platform.ts` (native only, plugin `@capacitor/app` loaded lazily). Back is offered to the running scenes top-most first via the `scatterly:back` scene event (`src/core/back.ts`); a scene consumes it with `ctx.handled = true`. Puzzles: rules card, then skip prompt, then leave the puzzle. Unhandled: `history.back()` when the WebView can go back (legacy Room), else "Press Back again to exit" (second press within 2 s exits).
- **Safe areas:** `#game` is inset by `env(safe-area-inset-*)` (index.html, `viewport-fit=cover`), so the FIT canvas scales inside the cutout/gesture areas. `android.yml` already sets `windowLayoutInDisplayCutoutMode=shortEdges` and sensor landscape.
- **Background:** `src/core/lifecycle.ts` `setBackground()` sleeps the loop (clock shifted on wake, no timer drift) and suspends audio; called by `visibilitychange` and Android `appStateChange`. Idempotent.
- **Test hooks (`?e2e=1`):** `__scatterly.pressBack()`, `setBackground(hidden)`, `backgrounded()`.
- **Not verifiable without a device:** real Back button and gesture navigation, notch/gesture-bar insets, audio really stopping in the background, battery and fps. Check these on the phone after the next APK.

## Install the Android app (owner)
1. On the phone, open the repo's **Releases** page and the release named **Scatterly latest APK**.
2. Download the single file `Scatterly-<version>-build<number>.apk` (the number goes up with every build, so you can tell which one you have).
3. Open it and allow "install from this source" once. It installs over the previous build, no uninstall needed.
The app is landscape only and fullscreen; the page background is teal so no bars show. Sound files download on first use, so the first tap on a
fresh install may be quiet for a second.
