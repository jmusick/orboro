/// <reference types="astro/client" />
/// <reference types="@cloudflare/workers-types" />

type Env = {
  DB: D1Database;
};

type UserRole = "admin" | "editor" | "author";

interface UserRecord {
  id: string;
  email: string;
  role: UserRole;
}

interface SessionRecord {
  id: string;
  userId: string;
  expiresAt: number;
}

declare namespace App {
  interface Locals {
    runtime: import("@astrojs/cloudflare").Runtime<Env>;
    user: UserRecord | null;
    session: SessionRecord | null;
  }
}
