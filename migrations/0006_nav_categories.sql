-- Recreate nav_items to support category-based items alongside page items
CREATE TABLE nav_items_v2 (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  item_type TEXT NOT NULL DEFAULT 'page',
  content_id TEXT,
  category_id TEXT,
  category_display TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (content_id) REFERENCES content(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

INSERT INTO nav_items_v2 (id, label, item_type, content_id, sort_order, created_at)
SELECT id, label, 'page', content_id, sort_order, created_at FROM nav_items;

DROP TABLE nav_items;
ALTER TABLE nav_items_v2 RENAME TO nav_items;
