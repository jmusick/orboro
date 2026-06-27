import type { APIRoute } from 'astro';
import { getDB } from '../lib/db';

export const GET: APIRoute = async ({ site, locals }) => {
  const BASE = (site ?? new URL('https://orboro.net')).origin;
  const today = new Date().toISOString().slice(0, 10);

  const staticPages = [
    { loc: `${BASE}/`, lastmod: today },
    { loc: `${BASE}/blog`, lastmod: today },
    { loc: `${BASE}/privacy-policy`, lastmod: '2026-06-01' },
  ];

  const contentPages: { loc: string; lastmod: string }[] = [];
  const categoryPages: { loc: string; lastmod: string }[] = [];

  const db = getDB(locals);
  if (db) {
    const contentResult = await db
      .prepare(
        "SELECT slug, page_type, updated_at FROM content WHERE status = 'published' ORDER BY updated_at DESC"
      )
      .all<{ slug: string; page_type: string; updated_at: number }>();

    for (const row of contentResult.results ?? []) {
      const path = row.page_type === 'post' ? `/blog/${row.slug}` : `/pages/${row.slug}`;
      contentPages.push({
        loc: `${BASE}${path}`,
        lastmod: new Date(row.updated_at).toISOString().slice(0, 10),
      });
    }

    const catResult = await db
      .prepare(
        `SELECT DISTINCT cat.slug
         FROM categories cat
         INNER JOIN content_categories cc ON cc.category_id = cat.id
         INNER JOIN content c ON c.id = cc.content_id
         WHERE c.status = 'published'
         ORDER BY cat.slug ASC`
      )
      .all<{ slug: string }>();

    for (const cat of catResult.results ?? []) {
      categoryPages.push({ loc: `${BASE}/blog/category/${cat.slug}`, lastmod: today });
      categoryPages.push({ loc: `${BASE}/category/${cat.slug}`, lastmod: today });
    }
  }

  const allPages = [...staticPages, ...contentPages, ...categoryPages];

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...allPages.map(p =>
      `  <url>\n    <loc>${p.loc}</loc>\n    <lastmod>${p.lastmod}</lastmod>\n  </url>`
    ),
    '</urlset>',
  ].join('\n');

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
