import type { APIRoute } from "astro";
import { saveContent, setContentCategories, type ContentStatus } from "../../../lib/content";
import { ensureRole, sanitizeSlug } from "../../../lib/http";

export const POST: APIRoute = async (context) => {
  const user = ensureRole(context, ["admin", "editor", "author"]);

  const form = await context.request.formData();
  const id = String(form.get("id") ?? "").trim() || undefined;
  const title = String(form.get("title") ?? "").trim();
  const slug = sanitizeSlug(String(form.get("slug") ?? ""));
  const markdown = String(form.get("markdown") ?? "").trim();
  const pageType = String(form.get("pageType") ?? "post").trim().toLowerCase();
  const statusRaw = String(form.get("status") ?? "draft").trim().toLowerCase();
  const status: ContentStatus = statusRaw === "published" ? "published" : "draft";

  if (!title || !slug || !markdown) {
    return context.redirect("/admin/content?error=invalid");
  }

  const savedId = await saveContent(context.locals, {
    id,
    title,
    slug,
    markdown,
    pageType,
    status,
    authorId: user.id,
  });

  const categoryIds = form.getAll("categoryId").map((v) => String(v)).filter(Boolean);
  await setContentCategories(context.locals, savedId, categoryIds);

  return context.redirect(`/admin/content/${savedId}`);
};
