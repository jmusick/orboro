import type { APIRoute } from "astro";
import { MEDIA_ORIGIN } from "../../lib/media-upload";

// Keep old image links working after removing their copies from public/images.
const MIGRATED_IMAGES = new Set([
  "about-header.webp",
  "bis-lists-are-bait-header.webp",
  "development-header.webp",
  "gaming-header.webp",
  "midnight-season-2-mythic-plus-interrupt-utility-cheat-sheet-header.webp",
  "path-of-exile-ii-header.webp",
  "what-wow-creators-think-is-strong-in-mythic-plus-for-midnight-season-2-header.jpg",
  "which-wow-creators-predicted-midnight-season-2-mythic-plus-meta-best-header.webp",
  "why-arpgs-use-leagues-and-seasons-header.jpg",
  "why-the-best-great-vault-reward-in-midnight-season-2-isnt-an-item-header.webp",
  "world-of-warcraft-header.webp",
]);

const redirectMigratedImage: APIRoute = ({ params, request }) => {
  const key = params.key;
  if (!key || !MIGRATED_IMAGES.has(key)) {
    return new Response("Not found", { status: 404 });
  }

  const query = new URL(request.url).search;
  return Response.redirect(`${MEDIA_ORIGIN}/images/${key}${query}`, 301);
};

export const GET = redirectMigratedImage;
export const HEAD = redirectMigratedImage;
