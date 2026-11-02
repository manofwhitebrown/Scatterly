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
