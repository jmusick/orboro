import { ensureDB, getDB } from "./db";
import { getDefaultTemplateKeyForPageType } from "./templates";

export type ContentStatus = "draft" | "published";

export interface ContentRecord {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  markdown: string;
  pageType: string;
  templateKey: string;
  templateDataJson: string | null;
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
  const pageType = row.page_type;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    markdown: row.markdown,
    pageType,
    templateKey: row.template_key ?? getDefaultTemplateKeyForPageType(pageType),
    templateDataJson: row.template_data_json ?? null,
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
    excerpt?: string;
    markdown: string;
    pageType: string;
    templateKey: string;
    templateDataJson?: string;
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
         SET slug = ?, title = ?, excerpt = ?, markdown = ?, page_type = ?, template_key = ?, template_data_json = ?, status = ?, published_at = ?, updated_at = ?
         WHERE id = ?`
      )
      .bind(
        input.slug,
        input.title,
        input.excerpt ?? null,
        input.markdown,
        input.pageType,
        input.templateKey,
        input.templateDataJson ?? null,
        input.status,
        publishedAt,
        now,
        input.id
      )
      .run();

    return input.id;
  }

  const id = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO content
      (id, slug, title, excerpt, markdown, page_type, template_key, template_data_json, status, author_id, published_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      input.slug,
      input.title,
      input.excerpt ?? null,
      input.markdown,
      input.pageType,
      input.templateKey,
      input.templateDataJson ?? null,
      input.status,
      input.authorId,
      publishedAt,
      now,
      now
    )
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
