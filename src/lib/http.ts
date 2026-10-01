import type { APIContext } from "astro";

export function requireUser(context: APIContext): UserRecord | Response {
  const user = context.locals.user;
  if (!user) {
    return context.redirect("/admin");
  }
  return user;
}

export function hasRole(user: UserRecord, allowed: UserRole[]): boolean {
  return allowed.includes(user.role);
}

export function ensureRole(
  context: APIContext,
  allowed: UserRole[]
): UserRecord | Response {
  const user = requireUser(context);
  if (user instanceof Response) return user;
  if (!hasRole(user, allowed)) {
    return context.redirect("/admin?error=forbidden");
  }
  return user;
}

export function sanitizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\-]+/g, "-")
    .replace(/\-+/g, "-")
    .replace(/^\-+|\-+$/g, "");
}
