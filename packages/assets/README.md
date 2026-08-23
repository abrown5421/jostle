# @jostle/assets

Single source of truth for every static asset (images, fonts, audio, and
whatever else comes later). Raw files live in `public/`; app code never
imports or references them directly — it goes through the typed registry
in `src/`, so every consumer stays decoupled from where the bytes
actually live.

## Adding an asset

1. Drop the file in the matching `public/` subfolder (`images/`, `fonts/`,
   `audio/`).
2. Add a named entry in the matching `src/<type>/index.ts` registry,
   building the path from `ASSET_BASE_URL` (see `base-url.ts`).
3. For fonts specifically, also add the `@font-face` rule in
   `src/fonts/fonts.css` (exported as `@jostle/assets/fonts.css`) before
   adding the registry entry.

Consuming code then does `import { images } from '@jostle/assets'` (or
`fonts`/`audio`) — never a raw `/images/whatever.png` string.

## How assets are served

Static files today, from `apps/web`'s own origin — its Vite config points
`publicDir` straight at this package's `public/` folder, so there's no
copy step and no second source of truth. That's the right fit for
build-time-known branding assets on Render's Static Site hosting (CDN-backed,
no compute cost per request), as opposed to `apps/api`, which stays
scoped to actual data. If a genuinely dynamic asset need shows up later
(user-uploaded avatars, etc.), that's a different problem — a
database/object-storage-backed API endpoint — not something this package
should try to cover.

If the serving strategy ever needs to change (a CDN, a different host),
update `ASSET_BASE_URL` in `base-url.ts` — every registry entry is built
from it, so no consumer code changes.

## Deploying to Render

Render's Static Site rewrite rule for client-side routing (`/* →
/index.html`, needed since the app uses react-router with real URL paths)
is dashboard-only — there's no `_redirects` file or `render.yaml`
equivalent for it. Configure it under the service's Redirects/Rewrites
tab when setting up the Render deploy.
