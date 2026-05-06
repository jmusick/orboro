import type { APIRoute } from "astro";
import { env as workerEnv } from "cloudflare:workers";
import { invalidateSession } from "../../../lib/auth";
import { SESSION_COOKIE } from "../../../middleware";

export const POST: APIRoute = async ({ cookies, locals, redirect }) => {
  const token = cookies.get(SESSION_COOKIE)?.value;
  if (token && ((workerEnv as unknown) as { DB?: unknown }).DB) {
    await invalidateSession(locals, token);
  }

  cookies.delete(SESSION_COOKIE, { path: "/" });
  return redirect("/admin");
};
