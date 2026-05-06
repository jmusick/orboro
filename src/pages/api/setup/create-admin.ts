import type { APIRoute } from "astro";
import { createSession, hashPassword } from "../../../lib/auth";
import { ensureDB } from "../../../lib/db";
import { getUserCount } from "../../../lib/content";
import { SESSION_COOKIE } from "../../../middleware";

export const POST: APIRoute = async ({ request, locals, cookies, url, redirect }) => {
  try {
    const existingCount = await getUserCount(locals);
    if (existingCount > 0) {
      return redirect("/admin");
    }

    const form = await request.formData();
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const password = String(form.get("password") ?? "");

    if (!email || password.length < 10) {
      return redirect("/admin/setup?error=invalid");
    }

    const db = ensureDB(locals);
    const userId = crypto.randomUUID();
    const passwordHash = await hashPassword(password);

  await db
    .prepare("INSERT INTO users (id, email, password_hash, role, created_at) VALUES (?, ?, ?, 'admin', ?)")
    .bind(userId, email, passwordHash, Date.now())
    .run();

    const session = await createSession(locals, userId);
    cookies.set(SESSION_COOKIE, session.id, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: url.protocol === "https:",
      expires: new Date(session.expiresAt),
    });

    return redirect("/admin");
  } catch (error) {
    console.error("[create-admin] Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
};
