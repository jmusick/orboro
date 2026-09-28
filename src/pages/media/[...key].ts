import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

const ALLOWED_PREFIXES = ["uploads/", "images/"];

function safeKey(value: string | undefined): string | null {
  if (!value || value.startsWith("/") || value.includes("\\")) return null;
  const segments = value.split("/");
  if (segments.some((segment) => !segment || segment === "." || segment === "..")) return null;
  if (!ALLOWED_PREFIXES.some((prefix) => value.startsWith(prefix))) return null;
  return value;
}

function headersFor(object: R2Object): Headers {
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("ETag", object.httpEtag);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  headers.set("X-Content-Type-Options", "nosniff");
  return headers;
}

async function readMedia(key: string, method: "GET" | "HEAD"): Promise<Response> {
  if (method === "HEAD") {
    const object = await env.MEDIA.head(key);
    if (!object) return new Response("Not found", { status: 404 });
    return new Response(null, { headers: headersFor(object) });
  }

  const object = await env.MEDIA.get(key);
  if (!object) return new Response("Not found", { status: 404 });
  return new Response(object.body, { headers: headersFor(object) });
}

export const GET: APIRoute = async ({ params }) => {
  const key = safeKey(params.key);
  return key ? readMedia(key, "GET") : new Response("Not found", { status: 404 });
};

export const HEAD: APIRoute = async ({ params }) => {
  const key = safeKey(params.key);
  return key ? readMedia(key, "HEAD") : new Response("Not found", { status: 404 });
};
