/// <reference types="astro/client" />
/// <reference path="../worker-configuration.d.ts" />

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
    user: UserRecord | null;
    session: SessionRecord | null;
  }
}
