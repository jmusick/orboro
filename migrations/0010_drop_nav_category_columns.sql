PRAGMA foreign_keys = OFF;

CREATE TABLE nav_items_new (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  content_id TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  parent_item_id TEXT REFERENCES nav_items_new(id) ON DELETE CASCADE,
  FOREIGN KEY (content_id) REFERENCES content(id) ON DELETE CASCADE
);

INSERT INTO nav_items_new (id, label, content_id, sort_order, created_at, parent_item_id)
SELECT id, label, content_id, sort_order, created_at, parent_item_id
FROM nav_items;

DROP TABLE nav_items;

ALTER TABLE nav_items_new RENAME TO nav_items;

PRAGMA foreign_keys = ON;
