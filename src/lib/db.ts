export function getDB(locals?: App.Locals): D1Database | null {
  return locals?.runtime?.env?.DB ?? null;
}

export function ensureDB(locals?: App.Locals): D1Database {
  const db = getDB(locals);
  if (!db) {
    throw new Error("D1 binding not available. Run via wrangler dev and configure DB binding.");
  }
  return db;
}
