import type { APIRoute } from "astro";
import { deleteCategoryById } from "../../../lib/content";
import { ensureRole } from "../../../lib/http";

export const POST: APIRoute = async (context) => {
  ensureRole(context, ["admin"]);
  const form = await context.request.formData();
  const id = String(form.get("id") ?? "").trim();
  if (!id) return context.redirect("/admin/categories");
  await deleteCategoryById(context.locals, id);
  return context.redirect("/admin/categories");
};
