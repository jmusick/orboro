import type { APIContext } from "astro";

export function requireUser(context: APIContext | AstroGlobal): UserRecord {
  const user = context.locals.user;
  if (!user) {
    throw context.redirect("/admin");
  }
  return user;
}

export function hasRole(user: UserRecord, allowed: UserRole[]): boolean {
  return allowed.includes(user.role);
}

export function ensureRole(
  context: APIContext | AstroGlobal,
  allowed: UserRole[]
): UserRecord {
  const user = requireUser(context);
  if (!hasRole(user, allowed)) {
    throw context.redirect("/admin?error=forbidden");
  }
  return user;
}

export function sanitizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\-\/]+/g, "-")
    .replace(/\-+/g, "-")
    .replace(/^\-+|\-+$/g, "");
}
