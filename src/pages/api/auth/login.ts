import type { APIRoute } from "astro";
import { createSession, verifyPassword } from "../../../lib/auth";
import { ensureDB } from "../../../lib/db";
import { SESSION_COOKIE } from "../../../middleware";

export const POST: APIRoute = async ({ request, locals, cookies, url, redirect }) => {
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");

  if (!email || !password) {
    return redirect("/admin?error=invalid");
  }

  const db = ensureDB(locals);
  const user = await db
    .prepare("SELECT id, password_hash, role FROM users WHERE email = ? LIMIT 1")
    .bind(email)
    .first<{ id: string; password_hash: string; role: UserRole }>();

  if (!user) {
    return redirect("/admin?error=invalid");
  }

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) {
    return redirect("/admin?error=invalid");
  }

  const session = await createSession(locals, user.id);
  cookies.set(SESSION_COOKIE, session.id, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: url.protocol === "https:",
    expires: new Date(session.expiresAt),
  });

  return redirect("/admin");
};
