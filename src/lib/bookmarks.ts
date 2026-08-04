const TAGSTASH_USER = "JD";
const CACHE_TTL_SECONDS = 600;

interface TagstashTag {
  id: number;
  name: string;
}

interface TagstashBookmark {
  id: number;
  title: string;
  url: string;
  description: string | null;
  favicon_url: string | null;
  tags?: TagstashTag[];
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
  const cache = (caches as CacheStorage & { readonly default: Cache }).default;
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

  // The tag this list was fetched by is never useful as a category — every bookmark
  // here has it by definition. Beyond that, which tags count as "noise" rather than a
  // real category varies per page (e.g. poe2 links are all tagged arpg/gaming), so that's
  // left to the page author via the exclude_categories attribute rather than guessed.
  const excludedTagNames = new Set(
    [tag, ...(attrs.exclude_categories ?? "").split(",")]
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );

  const tagNameLists = sorted.map((b) => (b.tags ?? []).map((t) => t.name));
  const categoriesByBookmark = tagNameLists.map((names) =>
    names.filter((name) => !excludedTagNames.has(name.toLowerCase())).sort((a, b) => a.localeCompare(b))
  );

  const categoryCounts = new Map<string, number>();
  categoriesByBookmark.forEach((names) => {
    for (const name of names) categoryCounts.set(name, (categoryCounts.get(name) ?? 0) + 1);
  });
  const categories = [...categoryCounts.keys()].sort((a, b) => a.localeCompare(b));

  const itemsHtml = sorted.map((b, i) => {
    const favicon = b.favicon_url
      ? `<img class="bml-favicon" src="${esc(b.favicon_url)}" alt="" loading="lazy" referrerpolicy="no-referrer" />`
      : `<span class="bml-favicon bml-favicon--placeholder" aria-hidden="true"></span>`;
    const description = b.description
      ? `<span class="bml-desc">${esc(b.description)}</span>`
      : "";
    const cats = categoriesByBookmark[i];
    const dataCats = esc(cats.join(" "));

    return (
      `<a class="bml-item" data-categories="${dataCats}" href="${esc(b.url)}" target="_blank" rel="noopener noreferrer">` +
      favicon +
      `<span class="bml-body">` +
      `<span class="bml-title">${esc(b.title)}</span>` +
      description +
      `</span>` +
      `</a>`
    );
  }).join("");

  const categoryChips = categories.length > 0
    ? `<div class="bml-cats">` +
      `<button type="button" class="bml-cat bml-cat--active" data-category="">All <span class="bml-cat__count">${sorted.length}</span></button>` +
      categories
        .map((c) => `<button type="button" class="bml-cat" data-category="${esc(c)}">${esc(c)} <span class="bml-cat__count">${categoryCounts.get(c)}</span></button>`)
        .join("") +
      `</div>`
    : "";

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

.bml-item[hidden]{display:none;}

.bml-cats{display:flex;flex-wrap:wrap;gap:.4rem;margin-bottom:.7rem;}
.bml-cat{display:inline-flex;align-items:center;gap:.35rem;background:transparent;border:1px solid var(--line,#1f2b46);color:var(--muted,#97a8c4);padding:.3rem .65rem;border-radius:999px;font:inherit;font-size:.78rem;font-weight:600;cursor:pointer;transition:all .15s ease;}
.bml-cat:hover{color:var(--text,#e8f3ff);border-color:var(--muted,#97a8c4);}
.bml-cat--active{color:#04141a;background:var(--accent,#00e5ff);border-color:var(--accent,#00e5ff);}
.bml-cat--active:hover{color:#04141a;}
.bml-cat__count{font-size:.72rem;opacity:.75;}

#bml-root hr.bml-divider{border:none;border-top:1px solid var(--line,#1f2b46);margin:1.25rem 0;}

#bml-root p.bml-credit{display:flex;align-items:center;gap:.7rem;margin:0;padding:.75rem 1rem;border:1px solid rgb(0 229 255 / 25%);border-radius:8px;background:linear-gradient(90deg,rgb(0 229 255 / 8%) 0%,transparent 70%);font-size:.85rem;color:var(--text,#e8f3ff);}
.bml-credit-icon{flex:none;color:var(--accent,#00e5ff);}
.bml-credit a{display:inline-flex;align-items:center;gap:.3rem;color:var(--accent,#00e5ff);text-decoration:none;font-weight:700;}
.bml-credit a:hover{text-decoration:underline;}
.bml-credit-favicon{width:16px;height:16px;border-radius:3px;}
`;

  const credit =
    `<p class="bml-credit">` +
    `<svg class="bml-credit-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>` +
    `This list is powered by ` +
    `<a href="https://tagsta.sh/?utm_source=orboro.net&utm_medium=referral&utm_campaign=bookmarks_credit" target="_blank" rel="noopener noreferrer">` +
    `<img class="bml-credit-favicon" src="https://www.google.com/s2/favicons?sz=64&domain=tagsta.sh" alt="" loading="lazy" referrerpolicy="no-referrer" />Tagstash</a>` +
    ` — organize and share your own bookmarks, try it out!` +
    `</p>`;

  const js = categories.length > 0
    ? `
(function(){
  function init(){
    var root=document.getElementById('bml-root');
    if(!root||root.dataset.bmlInit)return;
    root.dataset.bmlInit='1';
    root.querySelectorAll('.bml-cat').forEach(function(chip){
      chip.addEventListener('click',function(){
        root.querySelectorAll('.bml-cat').forEach(function(c){c.classList.remove('bml-cat--active');});
        chip.classList.add('bml-cat--active');
        var category=chip.dataset.category;
        root.querySelectorAll('.bml-item').forEach(function(item){
          var cats=(item.dataset.categories||'').split(' ');
          item.hidden=!!category&&cats.indexOf(category)===-1;
        });
      });
    });
  }
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',init);
  } else {
    init();
  }
  document.addEventListener('astro:page-load',init);
})();
    `.trim()
    : "";

  const script = js ? `<script>${js}<\/script>` : "";

  return `<div id="bml-root"><style>${css}</style>${categoryChips}<div class="bml-list">${itemsHtml}</div><hr class="bml-divider" />${credit}${script}</div>`;
}
