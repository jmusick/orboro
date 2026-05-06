import type { APIRoute } from "astro";
import { saveContent, type ContentStatus } from "../../../lib/content";
import { ensureRole, sanitizeSlug } from "../../../lib/http";
import { normalizeTemplateKeyForPageType } from "../../../lib/templates";

export const POST: APIRoute = async (context) => {
  const user = ensureRole(context, ["admin", "editor", "author"]);

  const form = await context.request.formData();
  const id = String(form.get("id") ?? "").trim() || undefined;
  const title = String(form.get("title") ?? "").trim();
  const slug = sanitizeSlug(String(form.get("slug") ?? ""));
  const excerpt = String(form.get("excerpt") ?? "").trim();
  const markdown = String(form.get("markdown") ?? "").trim();
  const pageType = String(form.get("pageType") ?? "post").trim().toLowerCase();
  const templateKeyRaw = String(form.get("templateKey") ?? "").trim();
  const templateDataJsonRaw = String(form.get("templateDataJson") ?? "").trim();
  const statusRaw = String(form.get("status") ?? "draft").trim().toLowerCase();

  const status: ContentStatus = statusRaw === "published" ? "published" : "draft";

  if (!title || !slug || !markdown) {
    return context.redirect("/admin/content?error=invalid");
  }

  let templateDataJson: string | undefined;
  if (templateDataJsonRaw) {
    try {
      JSON.parse(templateDataJsonRaw);
      templateDataJson = templateDataJsonRaw;
    } catch {
      return context.redirect("/admin/content?error=template-data-json-invalid");
    }
  }

  const templateKey = normalizeTemplateKeyForPageType(pageType, templateKeyRaw);

  const savedId = await saveContent(context.locals, {
    id,
    title,
    slug,
    excerpt,
    markdown,
    pageType,
    templateKey,
    templateDataJson,
    status,
    authorId: user.id,
  });

  return context.redirect(`/admin/content/${savedId}`);
};
