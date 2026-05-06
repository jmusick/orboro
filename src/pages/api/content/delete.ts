import type { APIRoute } from "astro";
import { deleteContentById } from "../../../lib/content";
import { ensureRole } from "../../../lib/http";

export const POST: APIRoute = async (context) => {
  ensureRole(context, ["admin", "editor"]);

  const form = await context.request.formData();
  const id = String(form.get("id") ?? "").trim();
  if (!id) {
    return context.redirect("/admin/content?error=invalid");
  }

  await deleteContentById(context.locals, id);
  return context.redirect("/admin/content");
};
