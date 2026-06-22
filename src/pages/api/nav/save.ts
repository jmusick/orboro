import type { APIRoute } from "astro";
import { saveNavItems } from "../../../lib/content";
import { ensureRole } from "../../../lib/http";

export const POST: APIRoute = async (context) => {
  ensureRole(context, ["admin"]);
  const form = await context.request.formData();
  const raw = String(form.get("navItems") ?? "[]").trim();

  let items: Parameters<typeof saveNavItems>[1] = [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      items = parsed
        .map((item: any, i: number) => ({
          clientId: String(item.clientId ?? i),
          contentId: item.contentId ? String(item.contentId) : undefined,
          label: String(item.label ?? "").trim(),
          sortOrder: Number(item.sortOrder ?? i),
          parentClientId: item.parentId ? String(item.parentId) : null,
        }))
        .filter((item) => item.label && item.contentId);
    }
  } catch {
    return context.redirect("/admin/nav?error=invalid");
  }

  await saveNavItems(context.locals, items);
  return context.redirect("/admin/nav?saved=1");
};
