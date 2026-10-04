import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { saveMedia } from "../../../lib/content";
import { identifyImage, MAX_MEDIA_BYTES, mediaUrlForRequest } from "../../../lib/media-upload";

export const POST: APIRoute = async (context) => {
  const user = context.locals.user;
  if (!user) return context.redirect("/admin");
  if (user.role !== "admin" && user.role !== "editor") {
    return context.redirect("/admin?error=forbidden");
  }
  const contentLength = Number(context.request.headers.get("content-length"));
  if (contentLength > MAX_MEDIA_BYTES + 20_000) {
    return context.redirect("/admin/media?form=upload&error=too-large");
  }

  const form = await context.request.formData();
  const file = form.get("file");
  const altText = String(form.get("altText") ?? "").trim();
  const caption = String(form.get("caption") ?? "").trim();

  if (!(file instanceof File) || !altText || altText.length > 500 || caption.length > 1000) {
    return context.redirect("/admin/media?form=upload&error=invalid");
  }
  if (file.size === 0) {
    return context.redirect("/admin/media?form=upload&error=invalid");
  }
  if (file.size > MAX_MEDIA_BYTES) {
    return context.redirect("/admin/media?form=upload&error=too-large");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const image = identifyImage(bytes);
  if (!image) {
    return context.redirect("/admin/media?form=upload&error=unsupported");
  }

  const now = new Date();
  const key = `uploads/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${crypto.randomUUID()}.${image.extension}`;
  const url = mediaUrlForRequest(context.url, key);

  try {
    await env.MEDIA.put(key, bytes, {
      httpMetadata: {
        contentType: image.contentType,
        cacheControl: "public, max-age=31536000, immutable",
      },
    });
    try {
      await saveMedia(context.locals, { url, altText, caption, createdBy: user.id });
    } catch (error) {
      await env.MEDIA.delete(key);
      throw error;
    }
  } catch (error) {
    console.error("Media upload failed", { error });
    return context.redirect("/admin/media?form=upload&error=upload-failed");
  }

  return context.redirect("/admin/media?uploaded=1");
};
