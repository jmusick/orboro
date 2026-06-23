import type { APIRoute } from "astro";
import { env as workerEnv } from "cloudflare:workers";
import { createSession, verifyPassword } from "../../../lib/auth";
import { ensureDB } from "../../../lib/db";
import { SESSION_COOKIE } from "../../../middleware";

async function verifyCaptcha(token: string): Promise<boolean> {
  const secret = ((workerEnv as unknown) as { HCAPTCHA_SECRET?: string }).HCAPTCHA_SECRET;
  if (!secret) return true; // skip verification in local dev (secret not configured)
  if (!token) return false;
  const body = new URLSearchParams({ secret, response: token });
  const res = await fetch("https://api.hcaptcha.com/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const data = await res.json() as { success: boolean };
  return data.success === true;
}

export const POST: APIRoute = async ({ request, locals, cookies, url, redirect }) => {
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const captchaToken = String(form.get("h-captcha-response") ?? "");

  if (!email || !password) {
    return redirect("/admin?error=invalid");
  }

  const captchaOk = await verifyCaptcha(captchaToken);
  if (!captchaOk) {
    return redirect("/admin?error=captcha");
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
