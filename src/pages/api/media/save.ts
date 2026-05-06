import type { APIRoute } from "astro";
import { saveMedia } from "../../../lib/content";
import { ensureRole } from "../../../lib/http";

export const POST: APIRoute = async (context) => {
  const user = ensureRole(context, ["admin", "editor"]);

  const form = await context.request.formData();
  const url = String(form.get("url") ?? "").trim();
  const altText = String(form.get("altText") ?? "").trim();
  const caption = String(form.get("caption") ?? "").trim();

  if (!url || !altText) {
    return context.redirect("/admin/media?error=invalid");
  }

  await saveMedia(context.locals, {
    url,
    altText,
    caption,
    createdBy: user.id,
  });

  return context.redirect("/admin/media");
};
