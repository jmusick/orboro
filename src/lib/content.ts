import { ensureDB, getDB } from "./db";

export type ContentStatus = "draft" | "published";

export interface ContentRecord {
  id: string;
  slug: string;
  title: string;
  markdown: string;
  pageType: string;
  status: ContentStatus;
  authorId: string;
  publishedAt: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface MediaRecord {
  id: string;
  url: string;
  altText: string;
  caption: string | null;
  createdBy: string;
  createdAt: number;
}

function mapContentRow(row: any): ContentRecord {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    markdown: row.markdown,
    pageType: row.page_type,
    status: row.status,
    authorId: row.author_id,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getUserCount(locals: App.Locals): Promise<number> {
  const db = getDB(locals);
  if (!db) return 0;
  const row = await db.prepare("SELECT COUNT(1) AS count FROM users").first<{ count: number }>();
  return row?.count ?? 0;
}

export async function getPublishedContentByType(
  locals: App.Locals,
  pageType: string,
  limit = 20
): Promise<ContentRecord[]> {
  const db = getDB(locals);
  if (!db) return [];

  const result = await db
    .prepare(
      `SELECT * FROM content
       WHERE page_type = ? AND status = 'published'
       ORDER BY COALESCE(published_at, created_at) DESC
       LIMIT ?`
    )
    .bind(pageType, limit)
    .all();

  return (result.results ?? []).map(mapContentRow);
}

export function excerptFromMarkdown(markdown: string, maxLen = 155): string {
  const plain = markdown
    .replace(/```[\s\S]*?```/g, "")
    .replace(/#{1,6}\s+[^\n]*/g, "")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[(.+?)\]\(.*?\)/g, "$1")
    .replace(/[*_`~]+/g, "")
    .replace(/^\s*[-*+>|]\s*/gm, "")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > maxLen ? plain.slice(0, maxLen).trimEnd() + "…" : plain;
}

export async function getPublishedBySlugAndType(
  locals: App.Locals,
  slug: string,
  pageType: string
): Promise<ContentRecord | null> {
  const db = getDB(locals);
  if (!db) return null;

  const row = await db
    .prepare("SELECT * FROM content WHERE slug = ? AND page_type = ? AND status = 'published' LIMIT 1")
    .bind(slug, pageType)
    .first();

  return row ? mapContentRow(row) : null;
}

export async function listAdminContent(locals: App.Locals): Promise<ContentRecord[]> {
  const db = ensureDB(locals);
  const result = await db
    .prepare("SELECT * FROM content ORDER BY updated_at DESC LIMIT 200")
    .all();
  return (result.results ?? []).map(mapContentRow);
}

export async function getContentById(locals: App.Locals, id: string): Promise<ContentRecord | null> {
  const db = ensureDB(locals);
  const row = await db.prepare("SELECT * FROM content WHERE id = ? LIMIT 1").bind(id).first();
  return row ? mapContentRow(row) : null;
}

export async function saveContent(
  locals: App.Locals,
  input: {
    id?: string;
    slug: string;
    title: string;
    markdown: string;
    pageType: string;
    status: ContentStatus;
    authorId: string;
  }
): Promise<string> {
  const db = ensureDB(locals);
  const now = Date.now();
  const publishedAt = input.status === "published" ? now : null;

  if (input.id) {
    await db
      .prepare(
        `UPDATE content
         SET slug = ?, title = ?, markdown = ?, page_type = ?, status = ?, published_at = ?, updated_at = ?
         WHERE id = ?`
      )
      .bind(input.slug, input.title, input.markdown, input.pageType, input.status, publishedAt, now, input.id)
      .run();
    return input.id;
  }

  const id = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO content
      (id, slug, title, markdown, page_type, status, author_id, published_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(id, input.slug, input.title, input.markdown, input.pageType, input.status, input.authorId, publishedAt, now, now)
    .run();

  return id;
}

export async function deleteContentById(locals: App.Locals, id: string): Promise<void> {
  const db = ensureDB(locals);
  await db.prepare("DELETE FROM content WHERE id = ?").bind(id).run();
}

export async function listMedia(locals: App.Locals): Promise<MediaRecord[]> {
  const db = ensureDB(locals);
  const result = await db
    .prepare("SELECT * FROM media ORDER BY created_at DESC LIMIT 300")
    .all();

  return (result.results ?? []).map((row: any) => ({
    id: row.id,
    url: row.url,
    altText: row.alt_text,
    caption: row.caption,
    createdBy: row.created_by,
    createdAt: row.created_at,
  }));
}

export async function saveMedia(
  locals: App.Locals,
  input: { url: string; altText: string; caption?: string; createdBy: string }
): Promise<void> {
  const db = ensureDB(locals);
  await db
    .prepare(
      "INSERT INTO media (id, url, alt_text, caption, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .bind(crypto.randomUUID(), input.url, input.altText, input.caption ?? null, input.createdBy, Date.now())
    .run();
}

export async function deleteMediaById(locals: App.Locals, id: string): Promise<void> {
  const db = ensureDB(locals);
  await db.prepare("DELETE FROM media WHERE id = ?").bind(id).run();
}

// ─── Categories ───────────────────────────────────────────────

export interface CategoryRecord {
  id: string;
  name: string;
  slug: string;
  createdAt: number;
}

export async function listCategories(locals: App.Locals): Promise<CategoryRecord[]> {
  const db = getDB(locals);
  if (!db) return [];
  const result = await db.prepare("SELECT * FROM categories ORDER BY name ASC").all();
  return (result.results ?? []).map((row: any) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    createdAt: row.created_at,
  }));
}

export async function getCategoryById(locals: App.Locals, id: string): Promise<CategoryRecord | null> {
  const db = ensureDB(locals);
  const row = await db.prepare("SELECT * FROM categories WHERE id = ? LIMIT 1").bind(id).first<any>();
  if (!row) return null;
  return { id: row.id, name: row.name, slug: row.slug, createdAt: row.created_at };
}

export async function saveCategory(
  locals: App.Locals,
  input: { id?: string; name: string; slug: string }
): Promise<string> {
  const db = ensureDB(locals);
  if (input.id) {
    await db
      .prepare("UPDATE categories SET name = ?, slug = ? WHERE id = ?")
      .bind(input.name, input.slug, input.id)
      .run();
    return input.id;
  }
  const id = crypto.randomUUID();
  await db
    .prepare("INSERT INTO categories (id, name, slug, created_at) VALUES (?, ?, ?, ?)")
    .bind(id, input.name, input.slug, Date.now())
    .run();
  return id;
}

export async function deleteCategoryById(locals: App.Locals, id: string): Promise<void> {
  const db = ensureDB(locals);
  await db.prepare("DELETE FROM categories WHERE id = ?").bind(id).run();
}

export async function getContentCategoryIds(locals: App.Locals, contentId: string): Promise<string[]> {
  const db = ensureDB(locals);
  const result = await db
    .prepare("SELECT category_id FROM content_categories WHERE content_id = ?")
    .bind(contentId)
    .all<{ category_id: string }>();
  return (result.results ?? []).map((r) => r.category_id);
}

export async function setContentCategories(
  locals: App.Locals,
  contentId: string,
  categoryIds: string[]
): Promise<void> {
  const db = ensureDB(locals);
  await db.prepare("DELETE FROM content_categories WHERE content_id = ?").bind(contentId).run();
  for (const categoryId of categoryIds) {
    await db
      .prepare("INSERT INTO content_categories (content_id, category_id) VALUES (?, ?)")
      .bind(contentId, categoryId)
      .run();
  }
}

export async function listContentCategoryNames(locals: App.Locals): Promise<Record<string, string[]>> {
  const db = getDB(locals);
  if (!db) return {};
  const result = await db
    .prepare(
      `SELECT cc.content_id, c.name
       FROM content_categories cc
       INNER JOIN categories c ON c.id = cc.category_id
       ORDER BY c.name ASC`
    )
    .all<{ content_id: string; name: string }>();
  const map: Record<string, string[]> = {};
  for (const row of result.results ?? []) {
    if (!map[row.content_id]) map[row.content_id] = [];
    map[row.content_id].push(row.name);
  }
  return map;
}

export async function getCategoryBySlug(locals: App.Locals, slug: string): Promise<CategoryRecord | null> {
  const db = getDB(locals);
  if (!db) return null;
  const row = await db.prepare("SELECT * FROM categories WHERE slug = ? LIMIT 1").bind(slug).first<any>();
  if (!row) return null;
  return { id: row.id, name: row.name, slug: row.slug, createdAt: row.created_at };
}

export async function getPublishedContentByCategory(
  locals: App.Locals,
  categorySlug: string,
  pageType?: string
): Promise<ContentRecord[]> {
  const db = getDB(locals);
  if (!db) return [];
  const result = pageType
    ? await db
        .prepare(
          `SELECT c.* FROM content c
           INNER JOIN content_categories cc ON cc.content_id = c.id
           INNER JOIN categories cat ON cat.id = cc.category_id
           WHERE cat.slug = ? AND c.status = 'published' AND c.page_type = ?
           ORDER BY COALESCE(c.published_at, c.created_at) DESC LIMIT 60`
        )
        .bind(categorySlug, pageType)
        .all()
    : await db
        .prepare(
          `SELECT c.* FROM content c
           INNER JOIN content_categories cc ON cc.content_id = c.id
           INNER JOIN categories cat ON cat.id = cc.category_id
           WHERE cat.slug = ? AND c.status = 'published'
           ORDER BY COALESCE(c.published_at, c.created_at) DESC LIMIT 60`
        )
        .bind(categorySlug)
        .all();
  return (result.results ?? []).map(mapContentRow);
}

// ─── Navigation ───────────────────────────────────────────────

export interface NavItemRecord {
  id: string;
  label: string;
  contentId: string | null;
  url: string;
  sortOrder: number;
  parentItemId: string | null;
}

function contentPageUrl(pageType: string, slug: string): string {
  return pageType === "post" ? `/blog/${slug}` : `/pages/${slug}`;
}

export async function listNavItems(locals: App.Locals): Promise<NavItemRecord[]> {
  const db = getDB(locals);
  if (!db) return [];
  const result = await db
    .prepare(
      `SELECT nav_items.id, nav_items.label, nav_items.content_id,
              nav_items.sort_order, nav_items.parent_item_id,
              content.slug AS content_slug, content.page_type AS content_page_type
       FROM nav_items
       LEFT JOIN content ON content.id = nav_items.content_id
       ORDER BY nav_items.sort_order ASC`
    )
    .all<any>();
  return (result.results ?? []).map((row) => ({
    id: row.id,
    label: row.label,
    contentId: row.content_id ?? null,
    url: contentPageUrl(row.content_page_type ?? "page", row.content_slug ?? ""),
    sortOrder: row.sort_order,
    parentItemId: row.parent_item_id ?? null,
  }));
}

export async function saveNavItems(
  locals: App.Locals,
  items: {
    clientId: string;
    contentId?: string;
    label: string;
    sortOrder: number;
    parentClientId: string | null;
  }[]
): Promise<void> {
  const db = ensureDB(locals);
  const now = Date.now();

  await db.prepare("DELETE FROM nav_items").run();

  const idMap = new Map<string, string>();
  for (const item of items) idMap.set(item.clientId, crypto.randomUUID());

  const inserted = new Set<string>();
  async function insertItem(item: typeof items[0]) {
    if (inserted.has(item.clientId)) return;
    if (item.parentClientId) {
      const parent = items.find(i => i.clientId === item.parentClientId);
      if (parent) await insertItem(parent);
    }
    const realId = idMap.get(item.clientId)!;
    const parentRealId = item.parentClientId ? (idMap.get(item.parentClientId) ?? null) : null;
    await db
      .prepare(
        `INSERT INTO nav_items (id, label, content_id, parent_item_id, sort_order, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .bind(realId, item.label, item.contentId ?? null, parentRealId, item.sortOrder, now)
      .run();
    inserted.add(item.clientId);
  }

  for (const item of items) await insertItem(item);
}
