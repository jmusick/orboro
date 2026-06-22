import type { APIRoute } from "astro";
import { saveCategory } from "../../../lib/content";
import { ensureRole, sanitizeSlug } from "../../../lib/http";

export const POST: APIRoute = async (context) => {
  ensureRole(context, ["admin", "editor"]);
  const form = await context.request.formData();
  const id = String(form.get("id") ?? "").trim() || undefined;
  const name = String(form.get("name") ?? "").trim();
  const slug = sanitizeSlug(String(form.get("slug") ?? ""));

  if (!name || !slug) {
    return context.redirect("/admin/categories?error=invalid");
  }

  const savedId = await saveCategory(context.locals, { id, name, slug });
  return context.redirect(`/admin/categories/${savedId}?saved=1`);
};
