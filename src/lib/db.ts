import { env as workerEnv } from "cloudflare:workers";

export function getDB(_locals?: App.Locals): D1Database | null {
  return ((workerEnv as unknown) as { DB?: D1Database }).DB ?? null;
}

export function ensureDB(_locals?: App.Locals): D1Database {
  const db = getDB();
  if (!db) {
    throw new Error("D1 binding not available. Run via wrangler dev and configure DB binding.");
  }
  return db;
}
