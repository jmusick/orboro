const TAGSTASH_USER = "JD";
const CACHE_TTL_SECONDS = 600;

interface TagstashBookmark {
  id: number;
  title: string;
  url: string;
  description: string | null;
  favicon_url: string | null;
}

interface TagstashResponse {
  bookmarks: TagstashBookmark[];
}

function esc(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function fetchBookmarks(tag: string): Promise<TagstashBookmark[]> {
  const url = `https://tagsta.sh/api/profiles/${encodeURIComponent(TAGSTASH_USER)}?tag=${encodeURIComponent(tag)}`;
  const cache = caches.default;
  const cacheKey = new Request(url);

  let res = await cache.match(cacheKey);
  if (!res) {
    res = await fetch(url);
    if (res.ok) {
      const cacheable = new Response(res.body, res);
      cacheable.headers.set("Cache-Control", `public, max-age=${CACHE_TTL_SECONDS}`);
      await cache.put(cacheKey, cacheable.clone());
      res = cacheable;
    }
  }

  if (!res.ok) {
    throw new Error(`tagsta.sh responded with ${res.status}`);
  }

  const data = (await res.json()) as TagstashResponse;
  return data.bookmarks ?? [];
}

export async function generateBookmarksList(attrs: Record<string, string>): Promise<string> {
  const tag = attrs.tag;
  if (!tag) {
    return `<p><em>Bookmark list error: missing "tag" attribute.</em></p>`;
  }

  let bookmarks: TagstashBookmark[];
  try {
    bookmarks = await fetchBookmarks(tag);
  } catch {
    return `<p><em>Couldn't load bookmarks for "${esc(tag)}" right now. Try again later.</em></p>`;
  }

  if (bookmarks.length === 0) {
    return `<p><em>No bookmarks tagged "${esc(tag)}" yet.</em></p>`;
  }

  const sorted = [...bookmarks].sort((a, b) => a.title.localeCompare(b.title));

  const itemsHtml = sorted.map((b) => {
    const favicon = b.favicon_url
      ? `<img class="bml-favicon" src="${esc(b.favicon_url)}" alt="" loading="lazy" referrerpolicy="no-referrer" />`
      : `<span class="bml-favicon bml-favicon--placeholder" aria-hidden="true"></span>`;
    const description = b.description
      ? `<span class="bml-desc">${esc(b.description)}</span>`
      : "";

    return (
      `<a class="bml-item" href="${esc(b.url)}" target="_blank" rel="noopener noreferrer">` +
      favicon +
      `<span class="bml-body">` +
      `<span class="bml-title">${esc(b.title)}</span>` +
      description +
      `</span>` +
      `</a>`
    );
  }).join("");

  const css = `
#bml-root{font-family:inherit;margin:0;}
#bml-root *{box-sizing:border-box;}

.bml-list{display:grid;grid-template-columns:repeat(2,1fr);gap:.4rem;}
@media (max-width:640px){.bml-list{grid-template-columns:1fr;}}

.bml-item{display:flex;align-items:center;gap:.6rem;padding:.5rem .75rem;border:1px solid var(--line,#1f2b46);border-left:3px solid var(--accent,#00e5ff);border-radius:6px;background:linear-gradient(90deg,rgb(0 229 255 / 5%) 0%,transparent 60%);text-decoration:none;color:var(--text,#e8f3ff);transition:all .18s ease;min-width:0;}
.bml-item:hover{border-color:var(--accent,#00e5ff);background:linear-gradient(90deg,rgb(0 229 255 / 10%) 0%,transparent 60%);box-shadow:0 0 .8rem rgb(0 229 255 / 15%);}

.bml-favicon{width:16px;height:16px;flex:none;border-radius:3px;}
.bml-favicon--placeholder{background:var(--surface,#0c1324);border:1px solid var(--line,#1f2b46);}

.bml-body{display:flex;flex-direction:column;gap:.1rem;min-width:0;}

.bml-title{font-weight:600;font-size:.9rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}

.bml-desc{color:var(--muted,#97a8c4);font-size:.78rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
`;

  return `<div id="bml-root"><style>${css}</style><div class="bml-list">${itemsHtml}</div></div>`;
}
