# AGENTS.md

Conventions and gotchas for anyone (human or agent) working on this codebase. See `README.md` for setup/scripts.

## Architecture

- Astro v6, `output: "server"`, deployed to Cloudflare Pages via `@astrojs/cloudflare`.
- All content (pages, posts, categories, nav) lives in Cloudflare D1, not markdown files in the repo. `src/lib/content.ts` is the data-access layer.
- Auth is custom (PBKDF2 password hashing, session cookie), not a third-party library. See `src/lib/auth.ts`, `src/middleware.ts`.
- Styling is hand-written scoped CSS per component using the CSS variables defined in `BaseLayout.astro` (`--bg`, `--surface`, `--text`, `--muted`, `--accent`, `--accent-2`, `--accent-3`, `--line`). No Tailwind, no component library.

## The shortcode system

Page/post markdown can embed rich, self-contained widgets via `{{token}}` or `{{token attr="value"}}` syntax, processed by `src/lib/shortcodes.ts` after `marked.parse()`. Each shortcode is a hardcoded, page-specific TS module in `src/lib/*.ts` (e.g. `atlas-farming-strategies.ts`, `bookmarks.ts`, `poe2-featured.ts`) that returns a self-contained HTML string with its own inline `<style>` (and `<script>` if interactive), registered in the `SHORTCODES` map in `shortcodes.ts`.

**Gotcha:** `marked` HTML-escapes quotes in paragraph text before shortcode processing runs, so `{{token attr="value"}}` becomes `{{token attr=&quot;value&quot;}}` in the parsed HTML. The attribute regex in `shortcodes.ts` decodes entities before parsing — don't "simplify" that away.

**Gotcha — Astro View Transitions breaks unguarded scripts:** this site has View Transitions enabled sitewide (`ClientRouter` in `BaseLayout.astro`). Astro does not reliably re-run inline `<script>` tags after a client-side (in-site link) navigation — only on a hard load. Any shortcode with interactive JS (click handlers, filters, etc.) **must** follow the pattern already used in `atlas-farming-strategies.ts` and `expedition-rumours.ts`:

```js
(function(){
  function init(){
    var root = document.getElementById('some-root');
    if (!root || root.dataset.someInit) return;
    root.dataset.someInit = '1';
    // ... wire up listeners ...
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  document.addEventListener('astro:page-load', init);
})();
```

Skipping this means the widget silently does nothing for any visitor who navigated in via the nav bar instead of a fresh page load — easy to miss when testing by typing the URL directly.

## Content model

- `content` table holds both pages and posts, distinguished by `page_type` (`"page"` renders at `/pages/[slug]`, `"post"` at `/blog/[slug]`). Markdown lives in `content.markdown`; shortcodes (see above) get expanded at render time, not stored expanded.
- `nav_items` drives the header nav. Each row has `content_id` (what it links to) and an optional `parent_item_id` (self-referencing FK) for one level of dropdown nesting — e.g. the "Path of Exile II" nav item is the parent of "Atlas Farming Strategies", "Expedition Rumours Cheat Sheet", and "Useful POE2 Links". A page doesn't need a `nav_items` row to be reachable at its slug; nav is purely presentational.
- `categories` / `content_categories` are a separate tagging system from nav nesting — used by `/category/[slug]`, not the same thing as the nav dropdown parent/child relationship above. Don't conflate the two when adding a new sub-page.

## Editing D1 content directly

For scripted or agent-driven edits (as opposed to the admin UI at `/admin`), write the SQL to a file and run it — safer than inlining a long `UPDATE ... SET markdown = '...'` on the command line, and avoids shell-quoting problems with the markdown body:

```bash
wrangler d1 execute DB --local --file=./scratch.sql
```

SQL-escape single quotes in markdown content as `''` (not `\'`) — it's SQLite. Drop `--local` (and add `--remote`) to target production; do that deliberately, per the local-vs-remote section below.

## Verifying a change without a browser

There's no headless browser available (see below), so the practical loop for confirming a page/shortcode change actually renders right is:

```bash
npm run build
npx wrangler pages dev dist --ip 127.0.0.1 --port 8787 &
curl -s http://127.0.0.1:8787/pages/some-slug | grep -o 'expected-class-or-text'
# ... then kill the wrangler pages dev process
```

This confirms the HTML/CSS/JS came out as expected (and that shortcodes didn't leave a literal `{{token}}` in the output because a fetch or shortcode registration failed). It does **not** confirm visual layout, spacing, or hover states — for those, a human needs to look at it in an actual browser. Say so explicitly rather than claiming a visual change "looks right" from curl output alone.

## D1: local vs. remote

- Local dev D1 lives in `.wrangler/state/v3/d1` and is completely separate from the production database. Content created/edited via `wrangler d1 execute DB --local` (or the admin UI while running locally) does **not** exist in production.
- To ship content changes, either recreate them through the admin UI against production, or mirror the same `wrangler d1 execute DB --remote --file=...` statement.
- Migrations: `npm run d1:migrate:local` / `npm run d1:migrate:remote`. Apply local first, verify, then remote.
- Local and remote row IDs (especially `users.id` / `author_id`) are not guaranteed to match — don't copy a locally-observed ID into a remote insert without checking.

## Local dev

- Prefer `127.0.0.1` over `localhost` — some integrations (OAuth redirect URIs, etc.) require an exact literal match, and `localhost` vs `127.0.0.1` are different origins to a browser even though they resolve to the same place. `dev:astro` runs `astro dev --host 127.0.0.1`, and `.vscode/launch.json` points at `http://127.0.0.1:4321`.
- `npm run dev:astro` (Astro dev server, fast, hot-reloading) vs `npm run dev` (builds, then `wrangler pages dev dist` — full Cloudflare runtime: D1 bindings, secrets, Cache API, but no hot reload, re-run after each change). Use the latter when testing anything that touches D1, `caches.default`, or `cloudflare:workers` env/secrets, since `astro dev` may not mirror that runtime exactly. (`npm run dev` used to shell out to plain `wrangler dev`, which fails on a Pages project — if you see that error from an old muscle-memory command, this is why.)
- Secrets for local dev go in `.dev.vars` (gitignored, never commit). Production secrets: `wrangler pages secret put <NAME>`.
- No headless browser tooling is set up in this repo (Playwright was deliberately removed — see git history). There's no automated way to screenshot or click-test the app in this environment; visual changes need a human to check in an actual browser.

## External API calls from shortcodes/pages

When a shortcode or page fetches an external API server-side (see `bookmarks.ts` for tagsta.sh, or the git history around the Spotify integration that was later removed), cache the response with the Cloudflare Workers Cache API:

```js
const cache = caches.default;
const cacheKey = new Request(url); // or a synthetic Request for a non-fetchable key
let res = await cache.match(cacheKey);
if (!res) {
  res = await fetch(url);
  if (res.ok) {
    const cacheable = new Response(res.body, res);
    cacheable.headers.set("Cache-Control", `public, max-age=${TTL_SECONDS}`);
    await cache.put(cacheKey, cacheable.clone());
    res = cacheable;
  }
}
```

Always fail gracefully (return a small `<p><em>…</em></p>` fallback, not a thrown error) — these run inline in page content, and a broken shortcode shouldn't 500 the whole page.
