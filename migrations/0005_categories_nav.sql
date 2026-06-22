CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL
);

CREATE TABLE content_categories (
  content_id TEXT NOT NULL,
  category_id TEXT NOT NULL,
  PRIMARY KEY (content_id, category_id),
  FOREIGN KEY (content_id) REFERENCES content(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE INDEX content_categories_content_idx ON content_categories(content_id);

CREATE TABLE nav_items (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  content_id TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (content_id) REFERENCES content(id) ON DELETE CASCADE
);
