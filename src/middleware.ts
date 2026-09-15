import { defineMiddleware } from "astro:middleware";
import { env as workerEnv } from "cloudflare:workers";
import { getSessionAndUserByToken } from "./lib/auth";

const SESSION_COOKIE = "orboro_session";

const CSP_REPORT_ONLY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://js.hcaptcha.com",
  "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
  "img-src 'self' data: https://www.google.com https://www.google-analytics.com",
  "font-src 'self'",
  "connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com",
  "frame-src https://newassets.hcaptcha.com https://hcaptcha.com",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
].join("; ");

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.user = null;
  context.locals.session = null;

  const token = context.cookies.get(SESSION_COOKIE)?.value;
  if (token && ((workerEnv as unknown) as { DB?: unknown }).DB) {
    try {
      const { session, user } = await getSessionAndUserByToken(context.locals, token);
      context.locals.session = session;
      context.locals.user = user;
    } catch {
      context.cookies.delete(SESSION_COOKIE, { path: "/" });
    }
  }

  const response = await next();

  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload",
  );
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  );
  response.headers.set("Content-Security-Policy-Report-Only", CSP_REPORT_ONLY);

  return response;
});

export { SESSION_COOKIE };
