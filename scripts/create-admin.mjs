/**
 * Creates the first admin user in D1, only when the users table is empty.
 *
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='...' npm run admin:create -- --local
 *
 * Pass --local for the local D1 simulation or --remote for production. The
 * password is read from the environment so it stays out of shell history and
 * the process list. The hash matches `hashPassword` in src/lib/auth.ts.
 */
import { spawnSync } from "node:child_process";
import { randomUUID, pbkdf2Sync, randomBytes } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const ITERATIONS = 100_000;
const MIN_PASSWORD_LENGTH = 10;

const target = process.argv.includes("--remote") ? "--remote" : process.argv.includes("--local") ? "--local" : null;
const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD ?? "";

if (!target || !email.includes("@") || password.length < MIN_PASSWORD_LENGTH) {
  console.error(
    "Usage: ADMIN_EMAIL=<email> ADMIN_PASSWORD=<at least 10 characters> npm run admin:create -- --local|--remote",
  );
  process.exit(1);
}

const salt = randomBytes(16);
const hash = pbkdf2Sync(password, salt, ITERATIONS, 32, "sha256");
const passwordHash = `pbkdf2$${ITERATIONS}$${salt.toString("base64")}$${hash.toString("base64")}`;
const quote = (value) => `'${value.replaceAll("'", "''")}'`;

// A single conditional INSERT is atomic, so this never adds a second admin.
const sql = `INSERT INTO users (id, email, password_hash, role, created_at)
SELECT ${quote(randomUUID())}, ${quote(email)}, ${quote(passwordHash)}, 'admin', ${Date.now()}
WHERE NOT EXISTS (SELECT 1 FROM users);
SELECT COUNT(1) AS users FROM users;
`;

const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "orboro-admin-")), "create-admin.sql");
fs.writeFileSync(file, sql, { mode: 0o600 });
try {
  const result = spawnSync("npx", ["wrangler", "d1", "execute", "DB", target, `--file=${file}`], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
} finally {
  fs.rmSync(path.dirname(file), { recursive: true, force: true });
}
console.log("Done. A users count of 1 means an admin exists; if one already existed, nothing was inserted.");
