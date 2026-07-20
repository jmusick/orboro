# Orboro.net

Astro + Cloudflare starter for a markdown-first CMS/blog with role-based auth and D1 storage.

## Requirements

- Node.js `>=22.12.0`
- npm
- Cloudflare account + Wrangler CLI access for D1 operations

## What This Scaffold Includes

- Astro SSR configured for Cloudflare (`@astrojs/cloudflare`)
- D1 schema + migrations for users, sessions, content, media, categories, and nav items
- Initial admin setup flow (`/admin/setup`)
- Email/password auth with role-based permissions (`admin`, `editor`, `author`)
- CMS content editor for markdown posts/pages with live preview
- Blog routes (`/blog`, `/blog/[slug]`, `/blog/category/[slug]`)
- Generic page route (`/pages/[slug]`)
- Category management with content tagging
- Dynamic navigation builder with unlimited nesting
- Basic media library records (URL + alt + caption)

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Create D1 DB (one-time):

```bash
npx wrangler d1 create orboro-db
```

3. Update `database_id` in `wrangler.toml`.

4. Apply migrations:

```bash
npm run d1:migrate:local
```

5. Start local dev:

```bash
npm run dev:astro
```

or build and run through the full Cloudflare runtime (Wrangler Pages, D1 bindings, Cache API — closer to production, but won't hot-reload; re-run after each change):

```bash
npm run dev
```

6. Open `/admin`, then run initial setup at `/admin/setup` if prompted.

## Scripts

- `npm run dev` - Build, then serve via `wrangler pages dev` (full Cloudflare runtime: D1 bindings, Cache API, secrets)
- `npm run dev:astro` - Run Astro dev server directly (fast, hot-reloading, but doesn't fully mirror the Cloudflare runtime)
- `npm run build` - Production build
- `npm run preview` - Preview build
- `npm run astro` - Astro CLI passthrough
- `npm run cf:types` - Regenerate Cloudflare worker types
- `npm run d1:migrate:local` - Apply local migrations
- `npm run d1:migrate:remote` - Apply remote migrations

Build note:

- `npm run build` runs `astro build` and then `fix-wrangler.js` to patch the generated worker entry for Cloudflare Pages.

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

Tables:

- `users`
- `sessions`
- `content`
- `media`
- `categories`
- `content_categories`
- `nav_items`

## Notes

- Content markdown is stored in D1 (`content.markdown`).
- Media management currently stores metadata and source URLs.
- To support uploads later, pair this with Cloudflare R2 and add upload endpoints.
- To support additional content types later, add new values in `content.page_type` and build matching routes.

## Troubleshooting

- If content/admin changes are not showing up in local dev, make sure your local D1 DB has migrations applied: `npm run d1:migrate:local`.
- `npm run dev` uses your configured Cloudflare bindings and local D1 simulation, while `npm run dev:astro` runs Astro directly and may not mirror Cloudflare runtime behavior exactly (e.g. `caches.default`, secrets from `.dev.vars`).
- Apply production/staging schema updates with `npm run d1:migrate:remote` before testing against remote data.
- Content edited locally (via the admin UI or `wrangler d1 execute DB --local`) only exists in local D1 — it does not appear on the live site until reproduced against remote D1.

## More

For architecture notes, coding conventions, and known gotchas (the shortcode system, Astro View Transitions, D1 local-vs-remote pitfalls, etc.), see [AGENTS.md](AGENTS.md).
