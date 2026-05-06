-- Users and authentication
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'author')),
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_expires_idx ON sessions(expires_at);

-- Markdown-first content
CREATE TABLE IF NOT EXISTS content (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT,
  markdown TEXT NOT NULL,
  page_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'published')),
  author_id TEXT NOT NULL,
  published_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (author_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS content_type_status_idx ON content(page_type, status);
CREATE INDEX IF NOT EXISTS content_updated_idx ON content(updated_at DESC);

-- Basic media metadata management (URL + alt/caption)
CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  alt_text TEXT NOT NULL,
  caption TEXT,
  created_by TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS media_created_idx ON media(created_at DESC);
