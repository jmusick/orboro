# Orboro.net

Astro + Cloudflare starter for a markdown-first CMS/blog with role-based auth and D1 storage.

## Requirements

- Node.js `>=22.12.0`
- npm
- Cloudflare account + Wrangler CLI access for D1 operations

## What This Scaffold Includes

- Astro SSR configured for Cloudflare (`@astrojs/cloudflare`)
- D1 schema + migration for users, sessions, content, and media metadata
- Initial admin setup flow (`/admin/setup`)
- Email/password auth with role-based permissions (`admin`, `editor`, `author`)
- CMS content editor for markdown posts/pages
- Per-content custom templates (template key + optional template JSON data)
- Basic markdown preview in admin editor
- Blog routes (`/blog`, `/blog/[slug]`)
- Generic page route (`/pages/[slug]`)
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

or run through Wrangler/Cloudflare runtime:

```bash
npm run dev
```

6. Open `/admin`, then run initial setup at `/admin/setup` if prompted.

## Scripts

- `npm run dev` - Run via `wrangler dev`
- `npm run dev:astro` - Run Astro dev server directly
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

Tables:

- `users`
- `sessions`
- `content`
- `media`

## Notes

- Content markdown is stored in D1 (`content.markdown`).
- Template selection is stored in D1 (`content.template_key`) with optional JSON payload in `content.template_data_json`.
- Media management currently stores metadata and source URLs.
- To support uploads later, pair this with Cloudflare R2 and add upload endpoints.
- To support additional content types later, add new values in `content.page_type` and build matching routes/templates.

## Troubleshooting

- If content/admin changes are not showing up in local dev, make sure your local D1 DB has migrations applied: `npm run d1:migrate:local`.
- `npm run dev` (Wrangler) uses your configured Cloudflare bindings and local D1 simulation, while `npm run dev:astro` runs Astro directly and may not mirror Cloudflare runtime behavior exactly.
- Apply production/staging schema updates with `npm run d1:migrate:remote` before testing against remote data.
