import type { APIRoute } from "astro";
import { deleteMediaById } from "../../../lib/content";
import { ensureRole } from "../../../lib/http";

export const POST: APIRoute = async (context) => {
  ensureRole(context, ["admin", "editor"]);

  const form = await context.request.formData();
  const id = String(form.get("id") ?? "").trim();
  if (!id) {
    return context.redirect("/admin/media?error=invalid");
  }

  await deleteMediaById(context.locals, id);
  return context.redirect("/admin/media");
};
