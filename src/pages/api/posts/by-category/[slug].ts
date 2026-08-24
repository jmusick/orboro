import type { APIRoute } from "astro";
import { excerptFromMarkdown, getCategoryBySlug, getPublishedContentByCategory } from "../../../../lib/content";

// Public, read-only feed of published posts for a category — consumed by other
// sites (e.g. HiddenLodgeWebsite's /articles) that want to embed Orboro posts
// without scraping HTML. Cached at the edge since it's slow-moving and public.
const CACHE_TTL_SECONDS = 600;

export const GET: APIRoute = async ({ params, site, request, locals }) => {
  const slug = params.slug;
  if (!slug) {
    return new Response(JSON.stringify({ error: "Missing category slug" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const cache = (caches as CacheStorage & { readonly default: Cache }).default;
  const cacheKey = new Request(request.url);
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const category = await getCategoryBySlug(locals, slug);
  if (!category) {
    return new Response(JSON.stringify({ error: "Unknown category" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const posts = await getPublishedContentByCategory(locals, slug, "post");
  const origin = site?.origin ?? "https://orboro.net";

  const body = JSON.stringify({
    category: { name: category.name, slug: category.slug },
    posts: posts.map((post) => ({
      title: post.title,
      slug: post.slug,
      url: `${origin}/blog/${post.slug}`,
      excerpt: excerptFromMarkdown(post.markdown),
      publishedAt: post.publishedAt ? new Date(post.publishedAt).toISOString() : null,
      featuredImageUrl: post.featuredImageUrl
        ? new URL(post.featuredImageUrl, origin).toString()
        : null,
    })),
  });

  const res = new Response(body, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": `public, max-age=${CACHE_TTL_SECONDS}`,
      "Access-Control-Allow-Origin": "*",
    },
  });
  await cache.put(cacheKey, res.clone());
  return res;
};
