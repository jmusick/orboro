# Orboro.net

Orboro.net is JD's personal site and Markdown CMS, built with Astro 7 and deployed
as the Cloudflare Worker `orboro-net`. Content and account records live in D1;
uploaded images live in R2. See `package.json` for the current version.

JD is the only user, with an admin account. The schema and route guards also
support `editor` and `author`, but there is no public registration or user-management
UI. Author ownership restrictions are not implemented; review those permissions
before adding non-admin users.

## Requirements

- Node.js `>=22.12.0`
- npm
- Cloudflare account + Wrangler CLI access for D1 operations

## Features

- Astro SSR configured for Cloudflare (`@astrojs/cloudflare`)
- D1 schema + migrations for users, sessions, content, media, categories, and nav items
- Initial admin setup flow (`/admin/setup`)
- Custom email/password auth with PBKDF2 password hashes and D1-backed sessions; no JWT or third-party auth service
- CMS content editor for markdown posts/pages with live preview; EasyMDE and its toolbar fonts are pinned npm dependencies bundled locally
- Shortcode system for rich, self-contained widgets embedded in markdown (e.g. an external bookmarks list, featured-links cards) — see `src/lib/shortcodes.ts` and [AGENTS.md](AGENTS.md)
- Blog routes (`/blog`, `/blog/[slug]`, `/blog/category/[slug]`), plus a homepage feed of recent posts — both the homepage feed and `/blog` cards show each post's featured image (`content.featured_image_url`) as a thumbnail, and posts are attributed to JD in the visible byline and JSON-LD author field
- Generic page route (`/pages/[slug]`), plus a static `/privacy-policy` page
- Category management with content tagging (`/category/[slug]`)
- Dynamic navigation builder with unlimited nesting
- Basic media library records (URL + alt + caption)
- `sitemap.xml` (generated from published D1 content) and SEO meta tags; `robots.txt` is a static file in `public/`
- RSS at `/rss.xml`, with WebSub update notifications, and IndexNow notifications for published content
- Public read-only JSON at `/api/posts/by-category/[slug]`, with published post summaries and a ten-minute cache
- Safe inline JSON/JSON-LD serialization through `src/lib/json.ts`
- Accessible filter selection and polite result/verdict feedback; shared form errors focus a summary with links to relevant fields, including EasyMDE. Invalid content/category submissions return to the editor but do not retain unsaved values.
- Opt-in Google Analytics (gtag.js) through `ConsentBanner.astro`, with Accept/Decline, footer Cookie preferences, and manual page views across Astro View Transitions (see [AGENTS.md](AGENTS.md))
- Security response headers (HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`, and a report-only CSP) set in `src/middleware.ts` for all SSR'd routes, plus `public/_headers` for static assets — see [AGENTS.md](AGENTS.md)

## Quick Start

1. Install dependencies:

```bash
npm ci
```

2. Create D1 DB (one-time):

```bash
npx wrangler d1 create orboro-db
```

3. Update `database_id` in `wrangler.toml`. For a separate deployment, also
   provision an R2 bucket for `MEDIA` and configure its public custom domain;
   local development simulates the binding. Production image URLs currently
   use `https://media.orboro.net` in `src/lib/media-upload.ts`.

4. Apply migrations:

```bash
npm run d1:migrate:local
```

5. Start local dev with the full Cloudflare runtime:

```bash
npm run dev
```

Open `http://127.0.0.1:8787`. This builds first and does not hot-reload;
restart it after changes. For faster work that does not depend on Cloudflare
runtime behavior, Astro's dev server runs at `http://127.0.0.1:4321`:

```bash
npm run dev:astro
```

6. Open `/admin`, then run initial setup at `/admin/setup` if prompted. This
   creates an admin in local D1 only. A fresh instance's setup route is public
   until the first user exists; initialize it before exposing that instance.

## Scripts

- `npm run dev` - Build, then serve via `wrangler dev` (full Cloudflare runtime: D1 bindings, Cache API, secrets)
- `npm run dev:astro` - Run Astro dev server directly (fast, hot-reloading, but doesn't fully mirror the Cloudflare runtime)
- `npm run check` - Type-check `.astro` and TypeScript files
- `npm run test:markdown` - Verify code highlighting and plain-text escaping
- `npm run test:dates` - Verify page update dates and rejection of implausible timestamps
- `npm run test:feed` - Verify feed URLs, widget excerpts, CDATA, sitemap dates, and single-segment slugs
- `npm run test:json` - Verify inline JSON cannot inject HTML and preserves original values
- `npm run test:consent` - Verify analytics gating, saved choices, navigation/page views, current-page nonces, withdrawal, and storage restrictions
- `npm run build` - Production build
- `npm run preview` - Preview build
- `npm run deploy` - Build and `wrangler deploy` (manual deploy; normally a push to `master` does it)
- `npm run astro` - Astro CLI passthrough
- `npm run cf:types` - Regenerate Cloudflare worker types
- `npm run data:assisted-combat` - Rebuild assisted-combat data from external research inputs; requires `ASSISTED_COMBAT_RESEARCH_ROOT` and `ASSISTED_COMBAT_VAULT_ROOT`
- `npm run data:midnight-s2-interrupts` - Rebuild the interrupt reference data from its public Google Sheets source
- `npm run data:spec-icons` - Download vendored WoW spec icons; `-- --resolve` refreshes the ID map and `-- --force` refreshes images
- `npm run media:migrate` - Preview content-image migration to R2; see the local/remote and `--apply` notes below
- `npm run d1:migrate:local` - Apply local migrations
- `npm run d1:migrate:remote` - Apply remote migrations

Deploy note:

- Hosted as the Cloudflare Worker `orboro-net` (Workers Builds, git-integrated with GitHub `jmusick/orboro`): pushing to `master` runs `npm run build` then `npx wrangler deploy`. `astro build` writes the real deploy config to `dist/server/wrangler.json`, which `wrangler deploy`/`wrangler dev` pick up.
- Repository bindings are `DB` (D1), `MEDIA` (R2), and `ASSETS` (static assets). Custom domains are configured outside the repo. Wrangler enables Workers logs and sampled traces; provider retention and dashboard security rules must be checked in the Cloudflare account.
- Apply any new schema migrations locally, verify them, then apply them remotely before deploying code that requires them. SQL content seeds are a separate step: pushing code does not copy local content into production.

## Database Schema

Migration files:

- `migrations/0001_initial.sql`
- `migrations/0002_content_templates.sql`
- `migrations/0003_drop_excerpt_template_data.sql`
- `migrations/0004_drop_template_key.sql`
- `migrations/0005_categories_nav.sql`
- `migrations/0006_nav_categories.sql`
- `migrations/0007_content_parent.sql`
- `migrations/0008_nav_parent_item.sql`
- `migrations/0009_drop_content_parent_id.sql`
- `migrations/0010_drop_nav_category_columns.sql`
- `migrations/0011_content_featured_image.sql`

Tables:

- `users`
- `sessions`
- `content`
- `media`
- `categories`
- `content_categories`
- `nav_items`

## Secrets

None — the app currently needs no runtime secrets. If you add one, put it in `.dev.vars` for local dev (gitignored) and set it in production with `wrangler secret put <NAME>`.

## Notes

- Content markdown is stored in D1 (`content.markdown`). Reusable, re-runnable seed scripts for individual pages/posts (content row + categories + nav) live in `scripts/content/*.sql` — see [AGENTS.md](AGENTS.md) for the pattern.
- Pages and posts render fenced code through `src/lib/markdown.ts` using server-side Highlight.js and a bundled GitHub Dark theme. Add a language after the opening fence (e.g. `js`, `ts`, `bash`, `json`, `html`, `css`, `sql`, `python`, `lua`, `yaml`, or `markdown`). Unlabeled and unsupported languages stay escaped plain text; inline code is unchanged. RSS keeps plain Markdown rendering, converts relative links/images to absolute URLs, and omits scripts/styles. Posts containing shortcodes use an excerpt and link to the full article instead of expanding widgets into the feed.
- Sitemap modification dates come from published content changes; the privacy page and sitemap share a single policy date. Article sidebars and adjacent-post links query lightweight summaries instead of full Markdown bodies.
- Accordions use native `details`/`summary` behavior so open content can reflow without a fixed height. Public/admin layouts respect reduced motion; shortcode filters have explicit keyboard focus outlines.
- The media library accepts direct image uploads (PNG, JPEG, GIF, WebP, or AVIF, up to 10 MB) into the `orboro-net-media` R2 bucket through the `MEDIA` binding. New uploads are saved in D1 with `https://media.orboro.net/...` URLs. That custom domain is connected to the bucket; the `r2.dev` development URL remains disabled.
- `wrangler dev` uses a separate local R2 store. Local uploads get `/media/...` URLs and are read back through the app's `/media/[...key]` route; they do not write to the production bucket. Use `npm run dev` for Cloudflare bindings.
- `npm run media:migrate -- --local` previews migrating new content-referenced files from `public/images` into local R2. Add `--apply` to copy the files and rewrite local D1 URLs. Use `--remote` to target production only after reviewing its dry-run manifest; `--remote --apply` copies objects and updates production D1. Previously migrated images now live in R2 and are no longer bundled in `public/images`; the script skips their URLs on repeat runs.
- Existing image URLs can still be added to the media library. Deleting a media record removes its D1 metadata only; it does not delete the R2 object or update pages that reference the URL.
- To support additional content types later, add new values in `content.page_type` and build matching routes.
- `/privacy-policy` (`src/pages/privacy-policy.astro`) describes what tracking is active. Update it whenever you add, remove, or change a tracking/analytics script.

## Current security and privacy boundaries

- Admin login is password-only. Sessions last 14 days and logout revokes the current session. The app has no MFA, password recovery, or built-in login throttling; any edge protection is configured separately.
- CSP is Report-Only and has no reporting endpoint. Inline JSON is safely encoded, but authored Markdown still permits raw HTML. Publishing is currently a trusted-admin capability; these controls do not establish safe untrusted publishing.
- `ConsentBanner.astro` loads Google Analytics only after acceptance, including a saved choice. It appears on `BaseLayout` pages, including unauthenticated login/setup; the authenticated admin layout does not load analytics. Without acceptance or JavaScript, the Google tag is not fetched. Accepted page views send the full URL, including query strings.
- The analytics choice is stored in this browser's localStorage under `orboro-analytics-consent` until changed or cleared. Footer **Cookie preferences** reopens the banner. Declining after acceptance disables analytics, clears GA cookies on the current host and parent domains, and reloads the page. Changes propagate to other open tabs through storage events; if localStorage is unavailable, the choice lasts only until a full reload.
- The tag's consent configuration grants analytics storage only after acceptance and keeps advertising storage, advertising user data, and advertising personalization denied. This preference does not gate necessary admin session cookies, Cloudflare hosting requests, or external images/favicons.
- Analytics retention, Google advertising/data-sharing settings, Cloudflare log retention, and live edge rules cannot be established from this repo. Check those dashboards before making claims about their settings in the privacy policy.
- `TODO.md` is a local, gitignored review backlog, not a shipped project file.

## Troubleshooting

- If content/admin changes are not showing up in local dev, make sure your local D1 DB has migrations applied: `npm run d1:migrate:local`.
- `npm run dev` uses your configured Cloudflare bindings and local D1 simulation, while `npm run dev:astro` runs Astro directly and may not mirror Cloudflare runtime behavior exactly (e.g. `caches.default`, secrets from `.dev.vars`).
- Apply production/staging schema updates with `npm run d1:migrate:remote` before testing against remote data.
- Content edited locally (via the admin UI or `wrangler d1 execute DB --local`) only exists in local D1 — it does not appear on the live site until reproduced against remote D1.
- To verify the consent banner, use footer **Cookie preferences** to change a saved choice. In browser developer tools, confirm no `gtag.js` request before acceptance or after declining, then check acceptance, reloads, in-site navigation, and withdrawal. Check the banner at desktop and phone widths; `npm run test:consent` verifies controller behavior but does not establish visual layout.

## More

For architecture notes, coding conventions, and known gotchas (the shortcode system, Astro View Transitions, D1 local-vs-remote pitfalls, etc.), see [AGENTS.md](AGENTS.md).
